import { Injectable } from '@angular/core';

import * as moment from 'moment';

// TODO: document
//
@Injectable()
export class PLReportDatesService {
    // Ease mocking for tests
    currentMonthIndex(): number {
        return moment().month();
    }

    // Ease mocking for tests
    currentYear(): number {
        return moment().year();
    }

    monthsInYear(year: number): number {
        return year === this.currentYear() ? this.currentMonthIndex() + 1 : 12;
    }
}
