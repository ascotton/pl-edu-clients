import * as moment from 'moment';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// RxJs
import { Subject } from 'rxjs';
import { map, withLatestFrom, switchMap, takeUntil } from 'rxjs/operators';
// Services
import { PLDesignService } from '@common/services';
import { PLSchoolStaffService, PLPlatformHelperService } from '../services';

import { PLDestroyComponent } from '@common/components';

@Component({
    templateUrl: './usage-reports.component.html',
    styleUrls: ['./usage-reports.component.less']
})
export class PLUsageReportsComponent extends PLDestroyComponent implements OnInit, OnDestroy {

    download$: Subject<{ start: string, end: string }> = new Subject();
    reFetch$ = this.helper.reFetch();
    data$ = this.reFetch$.pipe(
        switchMap(({ organization, schoolYear }) =>
            this.plSS.fetchPlatformUserActivity(organization.sfAccountId,
                organization.isGroupOrganization ? null : schoolYear.id)),
        map(usage => ({ usage, loading: false })),
    );
    mintDate = new Date(2020, 6, 1);
    startAt: Date;
    formErrorMessages: string[] = [];
    form: FormGroup;
    downloading: boolean;

    constructor(
      private plSS: PLSchoolStaffService,
      private fb: FormBuilder,
      private helper: PLPlatformHelperService,
      public plDesign: PLDesignService) {
        super();
    }

    ngOnInit() {
        const _start = moment().startOf('month').toDate();
        const _end = moment().startOf('day').toDate();
        this.startAt = _start;
        this.form = this.fb.group({
            start: [_start, [Validators.required]],
            end: [_end, Validators.required],
        });

        this.download$.pipe(
            withLatestFrom(this.reFetch$),
            switchMap(([{ start, end }, { organization, schoolYear }]) =>
                this.plSS.userActivityReport(organization.sfAccountId, start, end,
                    organization.isGroupOrganization ? null : schoolYear.id)),
            withLatestFrom(this.reFetch$),
            takeUntil(this.destroyed$),
        ).subscribe((res) => {
            const [_file, { organization }] = res;
            const fileName = `${organization.name}_usage_report_${_start}-${_end}.csv`;
            const url = URL.createObjectURL(_file);

            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            this.downloading = false;
        });
    }

    download() {
        if (this.downloading || this.form.invalid) {
            return;
        }
        const _errors: string[] = [];
        if (this.form.valid) {
            let { start, end } = this.form.value;
            start = moment(start);
            end = moment(end);
            const monthDuration: number = end.diff(start, 'months');
            if (monthDuration >= 12) {
                _errors.push(`Please select duration less then 12 months.`);
            }
            if (end.isSameOrBefore(start)) {
                _errors.push('End must be after start.');
            }
            if (!_errors.length) {
                const beFormat = 'YYYY-MM-DD';
                const _start = start.format(beFormat);
                const _end = end.format(beFormat);
                this.downloading = true;
                this.download$.next({ start: _start, end: _end });
            }
        }
        this.formErrorMessages = _errors;
    }
}
