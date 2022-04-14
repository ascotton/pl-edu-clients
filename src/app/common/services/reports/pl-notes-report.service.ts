import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import {
    catchError,
    first,
    filter,
    map,
    tap,
} from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as moment from 'moment';

import { AppStore } from '@app/appstore.model';

import {
    PLGraphQLService,
    PLLodashService,
    HeapLogger,
} from '@root/index';
import { PLExpirationService } from '../pl-expiration.service';

import { PLReportDates } from '@common/interfaces/';
import { PLNotesReportDownload } from './pl-notes-report-download';
import { PLDownloadItem } from '@common/interfaces';
import { PLDownloadsService } from '../pl-downloads.service';
import { toDownloadItem } from './pl-notes-report-download-item';

const NOTE_EXPORT_QUERY = require('./queries/note-export.graphql');
const EXPORT_NOTES_QUERY = require('./queries/export-notes.graphql');

interface NotesReportParams {
    fileFormat?: string;
    filterClientServices?: any;
    filterRecords?: any;
    reportTemplate?: string;
    reportTitle?: string;
    reportFilenameTitle: string;
}

/**
 * PLNotesReportService - initiates and manages updates for notes reports. It
 * is a source for download items. It registers as a download source witht the
 * download service.
 *
 * After initiating a notes report, it periodically polls to get updates on
 * the progress for that report.
 *
 * If the user cancels or clears out a completed download, this service stops
 * polling for that report download.
 */
@Injectable()
export class PLNotesReportService {
    constructor(
        private plGraphQL: PLGraphQLService,
        private store: Store<AppStore>,
        private plLodash: PLLodashService,
        private plHeapLogger: HeapLogger,
        private expirationService: PLExpirationService,
        downloadsService: PLDownloadsService,
    ) {
        store.select('notesReportDownloads')
            .subscribe((downloadInfo: any) => {
                this.downloads = downloadInfo.downloads;

                this.checkForExpiredUrls(this.downloads);
            });

        // Register as a source for download items and manage any items that are removed.
        downloadsService.addSource(this.getAllNotes());
        downloadsService.removedItems().pipe(filter(id => this.noteExists(id))).subscribe(id => this.removeNote(id));
    }

    private readonly POLL_INTERVAL: number = 5 * 1000;        // 5 seconds
    private readonly MAX_POLL_TIME: number = 60 * 60 * 1000;  // 60 minutes

    downloads: any[];
    private expirations: any = {};

    private checkForExpiredUrls(downloads: any[]): void {
        const newDownloadsWithUrlExpirations = downloads.filter((download: any) => {
            return download.downloadUrlExpiresOn && !this.expirations[download.id];
        });

        newDownloadsWithUrlExpirations.forEach((download: any) => {
            const expirationDate = moment(download.downloadUrlExpiresOn, 'YYYY-MM-DD HH:mm:ss').toDate();
            const expire = () => {
                if (this.noteExists(download.id)) {
                    this.store.dispatch({
                        type: 'UPDATE_NOTES_REPORT_DOWNLOAD',
                        payload: { download: { id: download.id, xExpired: true } },
                    });
                }
            };

            this.expirations[download.id] = this.expirationService.setTimeout(expire, expirationDate);
        });
    }

    private createDownload(): PLNotesReportDownload {
        return {
            id: '',
            filePath: '',
            fileFormat: '',
            name: '',
            progress: 0,
            error: '',
            hasEmptyResults: false,
            hasError: false,
            downloadUrl: '',
            downloadUrlExpiresOn: null,
            xCreatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
            xUpdatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
            xTimedOut: false,
            xExpired: false,
        };
    }

    generateReport(notesReportParams: NotesReportParams): Observable<{ id: string}> {
        const defaultParams = {
            filterRecords: {},
            filterClientServices: {},
            fileFormat: 'PDF',
            reportTemplate: 'STANDARD',
        };

        const params = { ...defaultParams, ...notesReportParams };

        const heapEvent = {
            clientID: params.filterRecords.clientId_In || '',
            locationID: params.filterRecords.locationId_In || '',
            startDate: params.filterRecords.appointmentStartDate_Gte || '',
            endDate: params.filterRecords.appointmentEndDate_Lt || '',
            reportTitle: params.reportTitle,
            requestDate: (new Date()).toDateString(),
        };

        const heapEventName = 'GenerateNotes';

        return this.plGraphQL.mutate(EXPORT_NOTES_QUERY, params, {}).pipe(
            tap(() => {
                this.plHeapLogger.logCustomEvent(heapEventName, { ...heapEvent, success: true });
            }),
            catchError((err: any) => {
                this.plHeapLogger.logCustomEvent(heapEventName, { ...heapEvent, success: false });

                return throwError(err);
            }),
            map((res: any) => {
                const noteId = res.exportNotes.noteExport.id;
                const download = {
                    ...this.createDownload(),
                    id: noteId,
                    name: notesReportParams.reportFilenameTitle,
                };
                this.store.dispatch({ type: 'CREATE_NOTES_REPORT_DOWNLOAD', payload: { download } });
                this.pollForNotesProgress(noteId);
                return { id: noteId };
            }),
        );
    }

    private getAllNotes(): Observable<PLDownloadItem[]> {
        return this.store.select('notesReportDownloads').pipe(
            map(({ downloads }) => {
                const sortedNotes = this.plLodash.sort2d([...downloads], 'xCreatedAt');

                // Right before emitting download items, convert them to more generic PLDownloadItems.
                return sortedNotes.map(toDownloadItem);
            }),
        );
    }

    pollForNotesProgress(noteId: string, timeCount: number = 0) {
        // Do not poll if note has been removed.
        if (this.noteExists(noteId)) {
            const vars: any = {
                id: noteId,
            };
            const gqlOptions = { fetchPolicy: 'network-only' };
            this.plGraphQL.query(NOTE_EXPORT_QUERY, vars, { suppressError: true }, gqlOptions).pipe(
                first(), // close after first emitted value since we queue up another call/subscription
                map((result: any) => {
                    // Covers specific server issue where noteExport is intermittently set to null
                    if (result === null || result.noteExport === null) {
                        throw Error(`Poll response null or includes a null noteExport: ${noteId}`);
                    }

                    return result.noteExport;
                }),
            )
            .subscribe((noteExport: any) => {
                noteExport.xUpdatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
                const errorOrEmpty = (noteExport.hasError || noteExport.hasEmptyResults);
                if (!errorOrEmpty) {
                    if (timeCount >= this.MAX_POLL_TIME) {
                        noteExport.xTimedOut = true;
                    } else if (noteExport.progress < 1) {
                        setTimeout(() => {
                            this.pollForNotesProgress(noteId, (timeCount + this.POLL_INTERVAL));
                        }, this.POLL_INTERVAL);
                    }
                }
                this.store.dispatch({ type: 'UPDATE_NOTES_REPORT_DOWNLOAD', payload: { download: noteExport } });
            }, (err: any) => {
                this.store.dispatch({
                    type: 'UPDATE_NOTES_REPORT_DOWNLOAD',
                    payload: {
                        download: { id: noteId, error: err, hasError: true },
                    }
                });
            });
        }
    }

    noteExists(noteId: string) {
        const index = this.plLodash.findIndex(this.downloads, 'id', noteId);
        return (index > -1);
    }

    private removeNote(noteId: string) {
        this.store.dispatch({ type: 'REMOVE_NOTES_REPORT_DOWNLOAD', payload: { download: { id: noteId } } });
    }

    /**
     * monthToStartDateInclusive - returns formatted string representing the month's first day.
     */
    monthToStartDateInclusive(month: { year: number, month: number}): String {
        return moment({ years: month.year, month: month.month, date: 1 }).format('YYYY-MM-DD');
    }

    /**
     * monthToEndDateExclusive - returns formatted string representing the first day of the _next_ month
     */
    monthToEndDateExclusive(month: { year: number, month: number}): String {
        return moment({ years: month.year, month: month.month, date: 1 }).add({ month: 1 }).format('YYYY-MM-DD');
    }

    reportDatesValidationMessage(dates: PLReportDates): string {
        const start = dates.start;
        const end = dates.end;

        if (dates === null || dates.start === null || dates.end === null) {
            return 'Please select start and end dates.';
        }

        if (start.year > end.year || (start.year === end.year && start.month > end.month)) {
            return 'Please select an end date that is not before the start date.';
        }

        return '';
    }
}
