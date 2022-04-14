import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { Subject } from 'rxjs';
import { filter, finalize, takeUntil } from 'rxjs/operators';

import { PLNotesReportService } from '@common/services';
import { Option, PLReportDates } from '@common/interfaces';
import { PLToastService } from '@root/index';

@Component({
    selector: 'pl-client-reports',
    templateUrl: './pl-client-reports.component.html',
    styleUrls: ['./pl-client-reports.component.less'],
})
export class PLClientReportsComponent implements OnInit, OnDestroy {
    client: any = {};
    generatingReport = false;
    loading = true;
    private reportDates: PLReportDates = null;
    reportFormats: Option[] = [{value: 'PDF', label: 'PDF'}, {value: 'XLSX', label: 'Excel'}];
    reportFormat: string = 'PDF';
    private ngUnsubscribe = new Subject();

    constructor(
        private store: Store<AppStore>,
        private reportService: PLNotesReportService,
        private plToastService: PLToastService,
    ) {}

    ngOnInit(): void {
        this.store.select('currentClientUser').pipe(
            filter((clientUser: any) => clientUser && clientUser.client),
            takeUntil(this.ngUnsubscribe),
        )
        .subscribe((clientUser: any) => {
            this.client = clientUser.client;
            this.loading = false;
        });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    onReportDates(dates: PLReportDates) {
        this.reportDates = dates;
    }

    generateReport(): void {
        const validationMessage = this.reportService.reportDatesValidationMessage(this.reportDates);

        if (validationMessage) {
            this.plToastService.show('error', validationMessage);
        } else {
            this.generatingReport = true;

            this.reportService.generateReport({
                // Strip periods and whitespace from name.
                reportFilenameTitle: `${this.client.lastName}_${this.client.firstName}`.replace(/[.\s]/g, ''),
                reportTitle: 'Session Notes Report',
                fileFormat: this.reportFormat,
                filterRecords: {
                    orderBy: 'appointmentStartDate',
                    clientId_In: this.client.id,
                    appointmentStartDate_Gte: this.reportService.monthToStartDateInclusive(this.reportDates.start),
                    appointmentEndDate_Lt: this.reportService.monthToEndDateExclusive(this.reportDates.end),
                },
            }).pipe(
                finalize(() => this.generatingReport = false),
            )
            .subscribe();
        }
    }
}
