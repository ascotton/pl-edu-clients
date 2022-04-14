import { Component, OnInit, OnChanges } from '@angular/core';
import * as moment from 'moment';
import { Store } from '@ngrx/store';
import { forkJoin, Observable } from 'rxjs';

import {PLHttpService, PLLodashService, PLTimezoneService, PLApiBillingCodesService,
 PLApiNotesSchemasService, PLUrlsService} from '@root/index';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLGalleryModalComponent } from '@common/components/pl-gallery-modal/pl-gallery-modal.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

let plClientRecordsList: any;

@Component({
    selector: 'pl-client-records-list',
    templateUrl: './pl-client-records-list.component.html',
    styleUrls: ['./pl-client-records-list.component.less'],
    inputs: ['client'],
})
export class PLClientRecordsListComponent implements OnInit, OnChanges {
    client: any = {};

    private currentUser: User;
    private userTimezone: string;
    data: any[] = [];
    columns: any = [];
    dataInfo: any = {
        count: 0,
        queryId: '',
    };

    currentPage: number;
    pageSize: number;
    total: number;

    private billingCodes: any[] = [];
    private notesSchemas: any[] = [];
    private loaded: any = {
        currentUser: false,
        client: false,
        billingCodes: false,
        notesSchemas: false,
    };
    currentArchiveVideoSrc: string;
    showArchiveVideo: boolean;
    currentArchiveVideoName: string;

    private TRACKING_TYPE_CHOICES = {
        regular: 'Regular',
        extended_school_year: 'Extended School Year',
        compensatory_time: 'Compensatory Time',
    };

    constructor(private plHttp: PLHttpService, private plLodash: PLLodashService,
                private store: Store<AppStore>, private plTimezone: PLTimezoneService,
                private plBillingCodes: PLApiBillingCodesService,
                private plNotesSchemas: PLApiNotesSchemasService,
                private plUrls: PLUrlsService,
                private dialog: MatDialog) {
        plClientRecordsList = this;
        store.select('currentUser')
            .subscribe((user) => {
                this.currentUser = user;
                this.userTimezone = this.plTimezone.getUserZone(this.currentUser);
                this.loaded.currentUser = true;
                this.checkAllDataLoaded();
            });
    }

    ngOnInit() {
        this.loadData();
    }

    ngOnChanges(changes: any) {
        if (changes.client) {
            this.loaded.client = true;
            this.checkAllDataLoaded();
        }
    }

    loadData() {
        this.plBillingCodes.get()
            .subscribe((res: any) => {
                this.billingCodes = res;
                this.loaded.billingCodes = true;
                this.checkAllDataLoaded();
            });
        this.plNotesSchemas.get()
            .subscribe((res: any) => {
                this.notesSchemas = res;
                this.loaded.notesSchemas = true;
                this.checkAllDataLoaded();
            });
    }

    checkAllDataLoaded() {
        if (this.plLodash.allTrue(this.loaded)) {
            // this.setColumns();
            // this.reQuery = !this.reQuery;
        }
    }

    displayAppointment(appointment: any) {
        return this.plTimezone.toUserZone(appointment.start, null, this.userTimezone).format('MM/DD/YYYY');
    }

    displayBillingCode(billingCode: any) {
        return this.plBillingCodes.getFromKey('uuid', billingCode).name;
    }

    displayDiscipline(service: any) {
        let discipline = (service &&
            service.service_expanded &&
            service.service_expanded.service_type) ?
            service.service_expanded.service_type.short_name : 'N/A';

        discipline = discipline === 'GROUPBMH' ? 'Group BMH'  : discipline;

        return discipline;
    }

    displayService(service: any) {
        return (service &&
            service.service_expanded &&
            service.service_expanded.name) ?
            service.service_expanded.name : 'N/A';
    }

    displayRecordTrackingType(service: any) {
        return service.tracking_type ? this.TRACKING_TYPE_CHOICES[service.tracking_type] : '--';
    }

    displayModifiedBy(modifiedBy: any) {
        return `${modifiedBy.first_name} ${modifiedBy.last_name}`;
    }

    displayRecording(recording: any) {
        const created_date = moment(recording.created).format('YY-MM-DD H:mm');
        return `${created_date}`;
    }

    clickedRecording(recording: any) {
        this.getRecordingViewURL(recording).subscribe((resUrl: string) => {
            this.currentArchiveVideoSrc = resUrl;
            this.currentArchiveVideoName = this.displayRecording(recording);
            this.showArchiveVideo = true;
        });
    }
    closeVideoPlayer() {
        this.showArchiveVideo = false;
        this.currentArchiveVideoSrc = null;
    }

    getNotesForRow(row: any) {
        const notes = JSON.parse(row.notes);
        if (notes && (notes.subjective || notes.objective || notes.assessment || notes.plan || notes.notes)) {
            return notes;
        }
        return null;
    }

    onQuery(info: { query: any, queryId: string }) {
        if (this.client.id) {
            const params = Object.assign({}, info.query, {
                client: this.client.id,
                expand: ['appointment', 'client_service', 'modified_by'],
            });
            this.plHttp.get('records', params)
                .subscribe((res: any) => {
                    this.total = res.count;
                    this.data = res.results ? res.results : [];
                    this.getClientRecordings().subscribe(
                        (next) => {
                            this.dataInfo.count = res.count;
                            this.dataInfo.queryId = info.queryId;
                        },
                    );
                    this.getClientJumbotronCaptures();
                });
        }
    }

    getClientRecordings() {
        return new Observable((observer: any) => {
            const params = {
                client: this.client.id,
                limit: 1000,
            };
            const getRecordRow = (recordId: string) => this.data.find(datum => datum.uuid === recordId);
            this.plHttp.get('recording', params)
                .subscribe((res: any) => {
                    res.results.forEach((recordingItem: any) => {
                        const recordingRecordId = recordingItem.record;
                        const row = getRecordRow(recordingRecordId);
                        if (row) {
                            if (!row.recordingsX) {
                                row.recordingsX = [];
                            }
                            row.recordingsX.push(recordingItem);
                        }
                    });
                    observer.next();
                });
        });
    }

    getClientJumbotronCaptures() {
        const getRecordRow = (recordId: string) => this.data.find(datum => datum.uuid === recordId);
        const requests = this.data.reduce((acc: any, curr: any) => {
            const params = {
                record: curr.uuid,
                limit: 1000,
            };
            acc[curr.uuid] = this.plHttp.get('jumbotron', params);
            return acc;
        }, {});
        forkJoin(requests).subscribe((res: any) => {
            for (const recordID in res) {
                const row = getRecordRow(recordID);
                if (res[recordID] && res[recordID].count > 0) {
                    const jumbotronEntries = res[recordID].results
                        .filter((entry: any) => entry.status === 'completed');
                    const captures = Object.keys(jumbotronEntries).map((entryId: string) => {
                        return jumbotronEntries[entryId];
                    }).filter(entry => entry.items_count > 0);
                    const sortedCaptures = this.plLodash.sort2d(captures, 'created', 'ascending');
                    row.capturesX = sortedCaptures;
                    this.loadThumbnails(row.capturesX);
                } else {
                    row.capturesX = [];
                }
            }
        });
    }

    getRecordingViewURL(recording: any) {
        return new Observable((observer: any) => {
            const data = {
                headers: {
                    'X-Tokbox-Env': recording.tokbox_env_origin,
                },
            };
            const params: any = {};
            const url = `${this.plUrls.urls.recording}${recording.uuid}/get_view_url/?t=${new Date().getTime()}`;
            this.plHttp.get('', params, url)
                .subscribe((res: any) => {
                    observer.next(res.url);
                });
        });
    }

    onRightClick() {
        return false;
    }

    onCapturesGalleryClick(event: any) {
        if (!event.captures || !event.captures.length) {
            this.loadCaptures(event, true);
        } else {
            this.openCapturesGallery(event.captures, event.name);
        }
    }

    loadCaptures(event: any, shouldOpenGallery: boolean) {
        if (!event.captures || !event.captures.length) {
            const params = {
                jumbotron_uuid: event.uuid,
                limit: 1000,
            };
            const URL = this.plUrls.urls.jumbotronItems.replace(':jumbotron_uuid', event.uuid);
            this.plHttp.get('', params, URL).subscribe((res: any) => {
                const allCaptures = res.results.filter((image: any) => image.uuid !== event.thumbnail_item);
                const images: any[] = allCaptures.map((image: any) => {
                    // Preload images
                    const img = new Image();
                    img.src = image.download_url;
                    return {
                        id: image.uuid,
                        url: image.download_url,
                        timestamp: image.created,
                    };
                });
                const sortedImages = this.plLodash.sort2d(images, 'timestamp', 'ascending');
                event.captures = sortedImages;
                if (shouldOpenGallery) {
                    this.openCapturesGallery(sortedImages, event.name);
                }
            });
        }
    }

    loadThumbnails(captures: any[]) {
        const thumbnailReqs = captures
            .filter((item: any) => !!item.thumbnail_item)
            .reduce((acc: any, curr: any) => {
                const URL = this.plUrls.urls.jumbotronItems.replace(':jumbotron_uuid', curr.uuid) + `${curr.thumbnail_item}/`;
                acc[curr.uuid] = this.plHttp.get('', {}, URL);
                return acc;
            }, {});
        if (thumbnailReqs) {
            forkJoin(thumbnailReqs).subscribe((thumbnailRes: any) => {
                for (const jumbotronId in thumbnailRes) {
                    const jumbotron = captures.find((item: any) => item.uuid === jumbotronId);
                    jumbotron.thumbnailUrl = thumbnailRes[jumbotronId].download_url;
                }
            });
        }
    }

    private openCapturesGallery(images: any[], galleryName: string) {
        const dialogRef = this.dialog
            .open(PLGalleryModalComponent, {
                data: {
                    images,
                    title: galleryName,
                },
                maxHeight: '100vh',
                maxWidth: '80vw',
                width: '80vw',
                panelClass: 'gallery-modal',
                disableClose: false,
            });
        this.closeDialogsOnEscape(dialogRef);
    }

    private closeDialogsOnEscape(dialogRef: MatDialogRef<any>) {
        dialogRef.keydownEvents()
            .subscribe(({ key }) => {
                if (key === 'Escape') {
                    dialogRef.close();
                }
            });
    }
}
