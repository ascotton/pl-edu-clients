import { Injectable } from '@angular/core';
// NgRx
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { Actions, ofType, createEffect } from '@ngrx/effects';
// RxJs
import { of } from 'rxjs';
import { concatMap, catchError, map, tap, withLatestFrom } from 'rxjs/operators';
// Actions
import {
    PLFetchInvoicePreview,
    PLSetInvoicePreview,
    PLSetInvoicePeriod,
    PLClearInvoicePreview,
} from './invoice.store';
// import { PLFetchDocumentationAssistant } from '../documentation/documentation.actions';
// Services
import { PLTimezoneService } from '@root/index';
import { PLInvoiceService } from '@root/src/app/modules/billing/pl-invoice.service';
// Models
import { PLInvoicePeriod } from '@root/src/app/modules/billing/pl-invoice';

@Injectable()
export class InvoiceEffects {

    private user$ = this.store$.select('currentUser');

    fetchInvoicePreview$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLFetchInvoicePreview),
            concatMap(() => this.plInvoice.getPreview()),
            catchError(_ => of(null)),
            map(invoicePreview => PLSetInvoicePreview({ invoicePreview })),
        ),
    );

    clearInvoicePreview$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLClearInvoicePreview),
            tap(() => localStorage.removeItem('KEY_BILLING_PERIOD')),
        ),
        { dispatch: false });

    setInvoicePreview$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLSetInvoicePreview),
            withLatestFrom(this.user$),
            map(([{ invoicePreview }, user]) => {
                const lastRefresh = this.plTimezone.getUserToday(user);
                return PLSetInvoicePeriod({
                    invoicePeriod: {
                        lastRefresh,
                        userId: user.uuid,
                        start: invoicePreview.period_expanded.start,
                        end: invoicePreview.period_expanded.end,
                        dueDate: invoicePreview.period_expanded.due_date,
                        submitStatus: invoicePreview.status,
                    },
                });
            }),
        ),
    );

    setInvoicePeriod$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLSetInvoicePeriod),
            withLatestFrom(this.user$),
            tap(([{ invoicePeriod, source }, user]) => {
                let storage: PLInvoicePeriod = invoicePeriod;
                // In case user is not set
                if (invoicePeriod && !invoicePeriod.userId) {
                    storage = {
                        ...storage,
                        userId: user.uuid,
                    };
                }
                // In case lastRefresh is not set
                if (invoicePeriod && !invoicePeriod.lastRefresh) {
                    const lastRefresh = this.plTimezone.getUserToday(user);
                    storage = {
                        ...storage,
                        lastRefresh,
                        lastRefreshSource: source || 'calendar',
                    };
                }
                localStorage.setItem('KEY_BILLING_PERIOD', JSON.stringify(storage));
                // TODO: Update iDA Box invoicePeriod
                // this.store$.dispatch(PLFetchDocumentationAssistant({ }));
            }),
    ), { dispatch: false });

    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private plInvoice: PLInvoiceService,
        private plTimezone: PLTimezoneService) { }
}
