import * as moment from 'moment';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
// NgRx
import { Store } from '@ngrx/store';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { AppStore } from '@app/appstore.model';
// RxJs
import { of, Observable } from 'rxjs';
import { concatMap, withLatestFrom, catchError, map, tap, switchMap, share, filter } from 'rxjs/operators';
// Actions
import * as eventActions from './schedule.actions';
import * as eventSelectors from './schedule.selectors';
import * as documentationActions from '../documentation/documentation.actions';
// Services
import { PLTimezoneService, PLToastService } from '@root/index';
import { PLUtilService } from '@common/services';
import { PLScheduleService, PLAppointmentService, PLEventParticipantsService } from '../../services';
// Models
import { PL_EVENT_SOURCE, PLGetAppointmentsParams, PLEvent, PLEventRepeatMode } from '../../models';
import { PLFetchTimesheetPreview } from '@common/store/timesheet';
import { selectCurrentUser, selectIsW2User } from '@common/store/user.selectors';

@Injectable()
export class ScheduleEffects {

    private user$ = this.store$.select(selectCurrentUser);
    private isW2$ = this.store$.select(selectIsW2User);
    private userId$ = this.user$.pipe(
        map(user => user.uuid),
    );

    getEvents$ = createEffect(() =>
        this.actions$.pipe(
            ofType(eventActions.PLGetEvents),
            withLatestFrom(this.userId$, this.route.queryParams),
            tap(([action, user, queryParams]) => {
                const { vs, ve } = queryParams;
                let { start, end } = queryParams;
                if (vs && ve) {
                    start = vs;
                    end = ve;
                }
                if (action.start) {
                    start = action.start;
                }
                if (action.end) {
                    end = action.end;
                }
                const { source, provider = user, timezone } = action;
                this.store$.dispatch(eventActions.PLLoadEvents({
                    payload: { source, start, end, provider, timezone },
                }));
            }),
        ), { dispatch: false });

    loadEvents$ = createEffect(() =>
        this.actions$.pipe(
            ofType(eventActions.PLLoadEvents),
            withLatestFrom(this.user$),
            concatMap(([{ payload }, user]) => {
                let eventType = 'BILLING';
                if (payload.source === PL_EVENT_SOURCE.Availability) {
                    eventType = 'AVAILABILITY';
                }
                const _end = moment(payload.end).add(1, 'days');
                const _start = moment(payload.start).subtract(1, 'days');
                return this.loadEvents(payload.provider, _start, _end, eventType).pipe(
                    map(({ results: events }) => {
                        const { start, end, timezone } = payload;
                        const _events: PLEvent[] = events
                            .map((e) => {
                                const _timezone = timezone || (user.xProvider ? user.xProvider.timezone : '');
                                return this.toLocalTime(e, _timezone);
                            });
                        return eventActions.PLLoadEventsSuccess({ payload: { start, end, events: _events } });
                    }),
                    catchError(err => of(eventActions.PLLoadEventsFail({ payload: err }))),
                );
            }),
        ),
    );

    loadAppointment$ = createEffect(() =>
        this.actions$.pipe(
            ofType(eventActions.PLLoadAppointment),
            withLatestFrom(this.user$),
            concatMap(([{ payload: uuid }, user]) => {
                const queryParams: PLGetAppointmentsParams = {
                    uuid,
                    calendar_view: true,
                };
                return this.scheduleService.getAppointments(queryParams).pipe(
                    map((payload: PLEvent) => {
                        const _timezone = user.xProvider ? user.xProvider.timezone : '';
                        return eventActions.PLSetAppointment({
                            appointment: this.toLocalTime(payload, _timezone),
                        });
                    }),
                    catchError(err => of(eventActions.PLSchedulerError({ error: err }))),
                );
            }),
        ));

    saveEvent$ = createEffect(() =>
        this.actions$.pipe(
            ofType(eventActions.PLSaveEvent),
            withLatestFrom(this.user$),
            switchMap(([{ payload }, currentUser]) => {
                const timezone = currentUser.xProvider ? currentUser.xProvider.timezone : '';
                const { prevEvent, document, repeat, keepOpen, runCancel } = payload;
                let appointment = { ...payload.event };
                const isAppointment = repeat === PLEventRepeatMode.One || !!appointment.uuid;
                // If is an Event have original_start and original_end match start and end
                if (!isAppointment) {
                    appointment.original_start = appointment.start;
                    appointment.original_end = appointment.end;
                }
                // Format Times
                // NOTE: toLocalTime() invokes the DST CROSSOVER offset adjustment, but that does not apply to a split.
                // A split is disconnected from the original event and can have no crossover relative to it.
                const following = repeat === PLEventRepeatMode.Following;
                const isRepeatingEventSplitFollowing =
                    following && prevEvent && prevEvent.event.repeating;
                if (!isRepeatingEventSplitFollowing) {
                    appointment = this.toLocalTime(appointment, timezone, false);
                }
                let save$: Observable<PLEvent> = this.appointmentService.saveEvent(appointment, currentUser.uuid);
                if (isAppointment && !following) {
                    save$ = this.appointmentService.saveAppointment(appointment, currentUser.uuid);
                } else if (isRepeatingEventSplitFollowing) {
                    const splitAfter: string = moment(prevEvent.original_start, this.plTimezone.formatDateTime)
                        .subtract(1, 'hour').format(this.plTimezone.formatDateTime);
                    save$ = this.appointmentService.split(appointment, splitAfter);
                }
                return save$.pipe(
                    map(_appointment => this.toLocalTime(_appointment, timezone)),
                    switchMap(_appointment =>
                        this.eventParticipants
                            .saveAll(_appointment, this.eventParticipants.buildParticipants(prevEvent))),
                    tap(() => {
                        if (prevEvent && prevEvent.event.repeating && !appointment.event.repeating) {
                            this.store$.dispatch(eventActions.PLRemoveRepeatingEvent({
                                uuid: prevEvent.event.uuid,
                                following: prevEvent.original_start,
                            }));
                        }
                    }),
                    map(_appointment =>  {
                        const isBlackoutDay = _appointment.is_blacked_out || localStorage.getItem('DEBUG_BLACKOUT_DAY')
                        if (localStorage.getItem('DEV_DEBUG_BLACKOUT_DAY')) {
                            console.log('---- saveEvent effect', {_appointment, isBlackoutDay})
                        }
                        if (isBlackoutDay) {
                            this.toastr.warning(
                                `This appointment conflicts with the school's Non-Service Dates.`,
                                '⚠️ Warning - Event Saved', {
                                    positionClass: 'toast-bottom-right',
                                    enableHtml: true,
                                }
                            );
                        } else {
                            this.toastr.success(`Saved`, '🎉 Success', {
                                positionClass: 'toast-bottom-right',
                            });
                        }
                        return eventActions.PLSetAppointment({
                        document, keepOpen, appointment: _appointment,
                    })}),
                    catchError(({ error }) => {
                        let errorMessage;
                        if (error && error.non_field_errors) {
                            errorMessage = error.non_field_errors.join('\n');
                        }
                        if (runCancel) {
                            runCancel();
                        }
                        return of(eventActions.PLSchedulerError({ error: errorMessage }));
                    }),
                );
            }),
        ));

    eventSaved$ = createEffect(() =>
        this.actions$.pipe(
            ofType(eventActions.PLSetAppointment),
            tap(({ appointment }) => {
                if (!appointment.uuid || appointment.event.repeating) {
                    this.store$.dispatch(eventActions.PLGetEvents({ source: PL_EVENT_SOURCE.Calendar }));
                }
            }),
            share(),
        ), { dispatch: false });

    scheduleError$ = createEffect(() =>
        this.actions$.pipe(
            ofType(eventActions.PLSchedulerError),
            filter(({ error }) => !!error),
            tap(({ error }) =>
                this.plToast.show('error', error)),
        ), { dispatch: false });

    scheduleUpdated$ = createEffect(() =>
        this.actions$.pipe(
            ofType(
                eventActions.PLSetAppointment,
                eventActions.PLRemoveEvent,
                eventActions.PLRemoveRepeatingEvent),
            withLatestFrom(this.isW2$),
            // TODO: If posible just update was needed
            tap(([_, isW2]) => {
                if (isW2) {
                    this.store$.dispatch(PLFetchTimesheetPreview());
                }
            }),
            map(() => documentationActions.PLFetchDocumentationAssistant({ })),
    ));

    deleteEvent$ = createEffect(() =>
        this.actions$.pipe(
            ofType(eventActions.PLDeleteEvent),
            withLatestFrom(this.userId$),
            switchMap(([{ event, deleteType, isAmendable }, userUuid]) =>
                this.appointmentService.delete({
                    event,
                    reason: isAmendable ? 'Correction' : '',
                }, deleteType)
                    .pipe(
                        map(({ uuid }) => {
                            let following;
                            const _uuid = this.getUuid(event);
                            if (deleteType === 'following') {
                                following = event.original_start;
                            }
                            return deleteType !== 'one' ?
                                eventActions.PLRemoveRepeatingEvent({ uuid, following }) :
                                eventActions.PLRemoveEvent({ uuid: _uuid });
                        }),
                        catchError(({ error }) => {
                            let errorMessage;
                            if (error && error.non_field_errors) {
                                errorMessage = error.non_field_errors.join('\n');
                            }
                            return of(eventActions.PLSchedulerError({ error: errorMessage }));
                        }),
                    )),
        ));

    loadEvaluations$ = createEffect(() =>
        this.actions$.pipe(
            ofType(eventActions.PLLoadEvaluations),
            withLatestFrom(this.userId$),
            concatMap(([actions, user]) => {
                const {
                    statusIn: status__in,
                    assignedTo: assigned_to = user,
                } = actions.payload;
                return this.scheduleService.getPendingClients({ assigned_to, status__in }).pipe(
                    map(({ results: payload }) => eventActions.PLLoadEvaluationsSuccess({ payload })),
                    catchError(err => of(eventActions.PLLoadEvaluationsFail({ payload: err }))),
                );
            }),
        ));

    goToCalendar$ = createEffect(() =>
        this.actions$.pipe(
            ofType(eventActions.PLGoToCalendar),
            withLatestFrom(
                this.userId$,
                this.store$.select(eventSelectors.selectScheduleView)),
            tap(([_, __, view]) => {
                this.router.navigate([], {
                    queryParams: {
                        view: view.type,
                        start: moment(view.date).format('YYYY-MM-DD'),
                    },
                });
            }),
        ), { dispatch: false });

    loadEvents(provider: string, start: moment.Moment, end: moment.Moment, event_type__in = 'BILLING')
    : Observable<{ results: PLEvent[] }> {
        const format = 'YYYY-MM-DDTHH:mm:ss';
        const queryParams: PLGetAppointmentsParams = {
            provider,
            event_type__in,
            calendar_view: true,
            start: `${start.format(format)}`,
            end: `${end.format(format)}`,
        };
        return this.scheduleService.getAppointments(queryParams);
    }

    private toLocalTime(appointment: PLEvent, timezone: string, forDisplay: boolean = true): PLEvent {
        const {
            apptStart,
            apptEnd,
            apptOriginalEnd,
            apptOriginalStart,
        } = this.plUtil.computeAppointmentLocalDateTimes(appointment, timezone, forDisplay);
        return {
            ...appointment,
            end: apptEnd.format(this.plTimezone.formatDateTime),
            start: apptStart.format(this.plTimezone.formatDateTime),
            original_start: apptOriginalStart.format(this.plTimezone.formatDateTime),
            original_end: apptOriginalEnd.format(this.plTimezone.formatDateTime),
        };
    }

    private getUuid(item: PLEvent): string {
        const { event, original_start } = item;
        let { uuid } = item;
        if (!uuid) {
            uuid = `evt__${event.uuid}${event.repeating ? `__${original_start}` : ''}`;
        }
        return uuid;
    }

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private actions$: Actions,
        private store$: Store<AppStore>,
        private scheduleService: PLScheduleService,
        private eventParticipants: PLEventParticipantsService,
        private appointmentService: PLAppointmentService,
        private plTimezone: PLTimezoneService,
        private plUtil: PLUtilService,
        private plToast: PLToastService,
        private toastr: ToastrService,
    ) { }
}
