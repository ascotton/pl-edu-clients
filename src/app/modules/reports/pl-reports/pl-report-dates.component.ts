import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import * as moment from 'moment';

import { PLLodashService } from '@root/index';
import { Option, PLReportDates } from '@common/interfaces';

import { PLReportDatesService } from './pl-report-dates.service';

const int = (value: string) => parseInt(value, 10);

/**
 * PLReportDatesComponent - emits user-selected start and end months.
 *
 */
@Component({
    selector: 'pl-report-dates',
    templateUrl: './pl-report-dates.component.html',
    styleUrls: ['./pl-report-dates.component.less'],
    providers: [PLReportDatesService],
})
export class PLReportDatesComponent implements OnInit {
    @Output() readonly dates = new EventEmitter<PLReportDates>();

    // The component maintains values in strings to match Option interface
    // month values go from '0' to '11', where '0' corresponds to January
    startMonthIndex: string;
    startYear: string;
    endMonthIndex: string;
    endYear: string;

    monthOptions = {
        start: <Option[]> [],
        end: <Option[]> [],
    };

    readonly yearOptions: Option[];

    private readonly months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    private readonly allMonthOptions = this.months.map((label, i) => ({ label, value: `${i}` }));

    constructor(
        private service: PLReportDatesService,
        lodash: PLLodashService,
    ) {
        // Years from 2009 (first year in business) until current.
        this.yearOptions = lodash.range(moment().year(), 2009).map(year => ({ label: `${year}`, value: `${year}` }));
    }

    ngOnInit(): void {
        // Default to current month for both start and end.
        this.startMonthIndex = this.service.currentMonthIndex().toString();
        this.startYear = this.service.currentYear().toString();
        this.endMonthIndex = this.startMonthIndex;
        this.endYear = this.startYear;

        this.updateMonthOptions();

        // emit immediately since defaults are implicitly selected.
        this.emitDates();
    }

    /**
     * private updateMonthOptions - clip out months that haven't happened yet.
     *
     */
    private updateMonthOptions() {
        const monthsInStartYear = this.service.monthsInYear(int(this.startYear));
        this.monthOptions.start = this.allMonthOptions.slice(0, monthsInStartYear);

        const monthsInEndYear = this.service.monthsInYear(int(this.endYear));
        this.monthOptions.end = this.allMonthOptions.slice(0, monthsInEndYear);
    }

    private emitDates(): void {
        const start = this.startMonthIndex ? { year: int(this.startYear), month: int(this.startMonthIndex) } : null;
        const end = this.endMonthIndex ? { year: int(this.endYear), month: int(this.endMonthIndex) } : null;

        this.dates.emit({ start, end });
    }

    onChangeMonth(): void {
        this.emitDates();
    }

    onChangeYear() {
        this.updateMonthOptions();

        // When year changes, if selected month no longer in set of options, then clear month.
        this.startMonthIndex = int(this.startMonthIndex) < this.monthOptions.start.length ? this.startMonthIndex : null;
        this.endMonthIndex = int(this.endMonthIndex) < this.monthOptions.end.length ? this.endMonthIndex : null;

        this.emitDates();
    }
}
