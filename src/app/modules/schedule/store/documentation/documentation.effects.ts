import * as moment from 'moment';
import { Injectable } from '@angular/core';
// NgRx
import { Store } from '@ngrx/store';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { AppStore } from '@app/appstore.model';
import { selectInvoicePeriod } from '@common/store/invoice';
// RxJs
import { of } from 'rxjs';
import { concatMap, withLatestFrom, catchError, map } from 'rxjs/operators';
// Actions
import * as documentationActions from './documentation.actions';
// Services
import { PLTimezoneService } from '@root/index';
import { PLScheduleService } from '../../services';
// Models
import { PLEvent, PLGetAppointmentsParams } from '../../models';

@Injectable()
export class DocumentationEffects {

    private user$ = this.store$.select('currentUser');
    private invoicePeriod$ = this.store$.select(selectInvoicePeriod);
    private userTimezone$ = this.user$.pipe(
        map(user => this.plTimezone.getUserZone(user)),
    );

    loadDataForDocumentationAssistant$ = createEffect(() =>
        this.actions$.pipe(
            ofType(documentationActions.PLFetchDocumentationAssistant),
            withLatestFrom(this.invoicePeriod$, this.userTimezone$, this.user$),
            concatMap(([{ provider }, invoicePeriod, tz, user]) => {
                if (!invoicePeriod) {
                    return of(null);
                }
                const queryStart = moment.utc(moment.tz(invoicePeriod.start, tz)).add(1, 'seconds');
                const queryEnd = moment.utc(moment.tz(invoicePeriod.end, tz)).add(1, 'days');
                const nowLocal = moment().tz(tz);
                const nowUTC = moment.utc(nowLocal);
                if (!invoicePeriod.start && !invoicePeriod.end) {
                    return of({
                        invoicePeriod,
                        queryStart,
                        queryEnd,
                        appointments: [],
                        incompleteAppointments: [],
                        incompletePastAppointments: [],
                        incompleteEventsTotalCount: 0,
                        incompleteEventsPastCount: 0,
                        isBillingPeriodOver: false,
                        isInvoiceSubmitted: false,
                        totalEventCount: 0,
                        nowLocal: nowLocal.format(),
                        nowUTC: nowUTC.format(),
                    });
                }
                const format = 'YYYY-MM-DDTHH:mm:ss';
                const queryParams: PLGetAppointmentsParams = {
                    provider: provider || user.uuid,
                    event_type__in: 'BILLING',
                    calendar_view: true,
                    start: `${queryStart.format(format)}`,
                    end: `${queryEnd.format(format)}`,
                };
                return this.scheduleService.getAppointments(queryParams)
                    .pipe(map(({ results: appointments }) => {
                        // find all incommplete appointments
                        const incompleteAppointments = (<PLEvent[]>appointments)
                            .reduce((result, item) => [...result, ...(item.signed ? [] : [item])], []);
                        const incompleteEventsTotalCount = incompleteAppointments.length;
                        const incompletePastAppointments = incompleteAppointments.reduce((result, item) => {
                            if (moment.utc(item.start).isBefore(nowUTC)) {
                                return [...result, item];
                            }
                            return [...result];
                        }, []);
                        const incompleteEventsPastCount = incompletePastAppointments.length;
                        const isBillingPeriodOver =
                            moment().diff(moment(invoicePeriod.end), 'days') > 0;
                        const isInvoiceSubmitted = invoicePeriod.submitStatus === 'submitted';
                        return {
                            invoicePeriod,
                            queryStart,
                            queryEnd,
                            appointments,
                            incompleteAppointments,
                            incompletePastAppointments,
                            incompleteEventsTotalCount,
                            incompleteEventsPastCount,
                            isBillingPeriodOver,
                            isInvoiceSubmitted,
                            totalEventCount: appointments.length,
                            nowLocal: nowLocal.format(),
                            nowUTC: nowUTC.format(),
                        };
                    }));
            }),
            map(data => documentationActions.PLSetDocumentationAssistant({ data })),
        ));

    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private scheduleService: PLScheduleService,
        private plTimezone: PLTimezoneService,
    ) { }

}
