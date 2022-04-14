import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { PLNotesReportService } from '@common/services';
import { Option, PLReportDates } from '@common/interfaces';
import { PLToastService } from '@root/index';

import { PLLocationService } from '../pl-location.service';

@Component({
    selector: 'pl-location-reports',
    templateUrl: './pl-location-reports.component.html',
    styleUrls: ['./pl-location-reports.component.less'],
})
export class PLLocationReportsComponent implements OnInit, OnDestroy {
    location: any = {};
    generatingReport = false;
    loading = true;
    private reportDates: PLReportDates = null;
    reportFormats: Option[] = [{value: 'PDF', label: 'PDF'}, {value: 'XLSX', label: 'Excel'}];
    reportFormat: string = 'PDF';
    private ngUnsubscribe = new Subject();

    constructor(
        private plLocation: PLLocationService,
        private reportService: PLNotesReportService,
        private plToastService: PLToastService,
    ) {}

    ngOnInit() {
        this.plLocation.getFromRoute().pipe(
            takeUntil(this.ngUnsubscribe),
        )
        .subscribe((res: any) => {
            this.location = res.location;
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
                reportFilenameTitle: this.location.name.replace(/[.\s]/g, ''),
                reportTitle: 'Location Session Notes Report',
                fileFormat: this.reportFormat,
                filterRecords: {
                    orderBy: 'appointmentStartDate',
                    locationId_In: this.location.id,
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
