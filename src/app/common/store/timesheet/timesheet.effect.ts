
import { Injectable } from '@angular/core';
import { PLTimezoneService } from '@root/index';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { of } from 'rxjs';
import { catchError, concatMap, map, withLatestFrom } from 'rxjs/operators';
import { PLFetchTimesheetPreview, PLSetTimesheetPreview } from './timesheet.store';

import { AppStore } from '@app/appstore.model';
import { PLTimesheetService } from '@root/src/app/modules/billing/pl-timesheet.service';

import { PLSetInvoicePeriod } from '../invoice';

@Injectable()
export class TimesheetEfects {

    private user$ = this.store$.select('currentUser');

    fetchTimesheetPreview$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLFetchTimesheetPreview),
            concatMap(_ => this.plTimesheetSvc.getPreview()),
            catchError(_ => of({ catchedError: true })),
            map(timesheetPreview => PLSetTimesheetPreview({ timesheetPreview })),
        ),
    );

    setInvoicePeriod$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLSetTimesheetPreview),
            withLatestFrom(this.user$),
            map(([{ timesheetPreview }, user]) => {
                const lastRefresh = this.plTimezone.getUserToday(user);
                let start = '';
                let end = '';
                let dueDate = new Date();
                let submitStatus = '';
                if (timesheetPreview && !timesheetPreview.catchedError) {
                    end = timesheetPreview.work_period_expanded.end_date;
                    start = timesheetPreview.work_period_expanded.start_date;
                    dueDate = timesheetPreview.work_period_expanded.due_date;
                    submitStatus = timesheetPreview.status;
                }
                return PLSetInvoicePeriod({
                    invoicePeriod: {
                        end,
                        start,
                        dueDate,
                        submitStatus,
                        lastRefresh,
                        userId: user.uuid,
                    },
                });
            }),
        ),
    );

    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private plTimezone: PLTimezoneService,
        private plTimesheetSvc: PLTimesheetService) { }

}
