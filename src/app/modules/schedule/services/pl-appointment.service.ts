import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, switchMap, pluck } from 'rxjs/operators';
import { PLHttpService, PLTimezoneService } from '@root/index';
import { PLAppointmentResponse, PLEvent, PLEventResponse } from '../models';
import * as moment from 'moment';

@Injectable()
export class PLAppointmentService {

    fteContractServiceSubject = new Subject();

    constructor(
        private plHttp: PLHttpService,
        private plTimezone: PLTimezoneService,
    ) { }

    // Gets event id and appointment id.
    getEventId(appointment: PLEvent) {
        return { eventId: appointment.event.uuid, appointmentId: appointment.uuid };
    }

    /**
     * Get count of persisted appointments one year into the future for the input recurrence
     */
    getCountOfPersistedFutureAppointmentsInRecurringSeries(recurringEvent: PLEvent): Observable<any> {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        const params = {
            event: recurringEvent.event.uuid,
            persisted_only: true,
            unremoved_only: true,
            start: this.plTimezone.toUTCBackend(recurringEvent.start),
            end: this.plTimezone.toUTCBackend(moment(recurringEvent.start).add(1, 'y')),
        };
        return this.plHttp
            .get('appointments', params)
            .pipe(pluck('count'));
    }

    checkForExisting(appointment: PLEvent, userUuid: string): Observable<any> {
        const event = appointment.event.uuid;
        const queryParams: any = {
            event,
            provider: userUuid,
            persisted_only: true,
            original_start: this.plTimezone.toUTCNoSeconds(appointment.original_start),
            original_end: this.plTimezone.toUTCNoSeconds(appointment.original_end),
        };
        return this.plHttp.get('appointments', queryParams).pipe(
            map(({ results }) => results.length ? results[0].uuid : null),
        );
    }

    private _save<R>(DTO: any, removed = false, urlKey = 'appointments'): Observable<R> {
        if (removed) {
            DTO['removed'] = true;
        }
        return this.plHttp.save(urlKey, DTO);
    }

    split(appointment: PLEvent, splitAfter: string): Observable<PLEvent> {
        const body = {
            after: splitAfter,
            event: {
                ...appointment.event,
                start: appointment.start,
                end: appointment.end,
            },
        };
        const httpUrl = `${this.plHttp.formUrl('events')}${appointment.event.uuid}/split/`;
        const httpOpts = {
            body,
            url: httpUrl,
            method: 'POST',
        };
        return this.plHttp.go(httpOpts)
            .pipe(map((res: { event_before_split: PLEventResponse; event_after_split: PLEventResponse }) =>
                this.formatEventReponse(res.event_after_split, appointment)));
    }

    saveAppointment(appointment: PLEvent, provider: string): Observable<PLEvent> {
        const {
            end,
            uuid,
            title,
            start,
            billing_code,
            original_end,
            original_start,
        } = appointment;
        const {
            uuid: eventUuid,
            event_type,
        } = appointment.event;
        let uuidKey = 'event';
        let uuidValue = eventUuid;
        const saveFn = (apptId?: string) => {
            if (uuid || apptId) {
                uuidKey = 'uuid';
                uuidValue = uuid || apptId;
            }
            const payload: any = {
                title,
                provider,
                event_type,
                billing_code,
                end,
                start,
                original_end,
                original_start,
                [uuidKey]: uuidValue,
            };
            return this._save<PLAppointmentResponse>(payload, false).pipe(map(res => {
                if (localStorage.getItem('DEV_DEBUG_BLACKOUT_DAY')) {
                    console.log('---- saveAppt', res)
                }
                return {
                    ...appointment,
                    is_blacked_out: res.is_blacked_out,
                    uuid: res.uuid,
                }
            }));
        };
        // If new, need to check for existing appointment first (in case of stale data).
        if (!uuid && appointment.original_start && appointment.original_end) {
            return this.checkForExisting(appointment, provider)
                .pipe(switchMap(_uuid => saveFn(_uuid)));
        }
        return saveFn();
    }

    saveEvent(appointment: PLEvent, provider: string): Observable<PLEvent> {
        const {
            end,
            title,
            start,
            billing_code,
            billing_expanded,
        } = appointment;
        const {
            uuid,
            repeating,
            event_type,
            recurrence_params,
            end_recurring_period,
            recurrence_frequency,
        } = appointment.event;
        let payload: any = {
            end,
            uuid,
            start,
            title,
            provider,
            event_type,
            billing_code,
        };

        if (repeating) {
            payload = {
                ...payload,
                recurrence_params,
                end_recurring_period,
                recurrence_frequency,
            };
        }

        this.triggerFTESubject(billing_expanded);

        return this._save<PLEventResponse>(payload, false, 'events')
            .pipe(map(response => this.formatEventReponse(response, appointment)));
    }

    private formatEventReponse(response: PLEventResponse, appointment: PLEvent): PLEvent {
        return {
            ...appointment,
            is_blacked_out: response.is_blacked_out,
            event: {
                ...appointment.event,
                end: response.end,
                uuid: response.uuid,
                start: response.start,
                title: response.title,
                provider: response.provider,
                repeating: response.repeating,
                recurrence_params: response.recurrence_params,
                recurrence_frequency: response.recurrence_frequency,
                end_recurring_period: response.end_recurring_period,
            },
        };
    }

    remove(event: PLEvent, reason_for_edit?: string): Observable<PLEventResponse> {
        const { start, end, original_start, original_end } = event;
        const uuid = event.uuid || event.event.uuid;
        return this._save<any>({
            end,
            start,
            reason_for_edit,
            event: uuid,
            original_end: original_end || end,
            original_start: original_start || start,
        }, true, 'appointments');
    }

    delete(options: { event: PLEvent, reason?: string }, type = 'all'): Observable<any> {
        const { event, reason } = options;
        const { billing_expanded } = event;
        // From woody: some issues on multiple sequential updates so refreshing every time for now..
        // const repeatUpdate = true; // => calendarModel.isRepeatingUpdate(event);

        // special case handling of individual non-recurring appointments
        // delete the appointment and let backend determine whether to delete the event
        const IS_INDIVIDUAL_APPOINTMENT = event && event.event
            && !event.event.repeating && !event.event.recurrence_frequency;
        const { eventId, appointmentId: appointmentUuid } = this.getEventId(event);

        this.triggerFTESubject(billing_expanded);

        if (type === 'one' || IS_INDIVIDUAL_APPOINTMENT) {
            // Delete a single appointment from a repeating event.
            // Need to create first, but create with the `removed` flag set.
            if (!appointmentUuid) {
                return this.remove(event, reason);
            }
            return this._save({ uuid: appointmentUuid, reason_for_edit: reason }, true);
        }
        if (type === 'all') {
            // 'all' is for both deleting ALL repeating events for for deleting a single non-repeating event.
            return this.plHttp.delete('events', { uuid: eventId, reason_for_edit: reason });
        }
        if (type === 'following') {
            // Delete following is just a save with setting the recurring end time to the start date of this event.
            const end_recurring_period = this.plTimezone.toUTCBackend(event.original_start);
            return this._save({ end_recurring_period, uuid: eventId }, false, 'events');
        }
    }

    /**
     * Notifies updates to the FTE widget when visible on the calendar.
     */
    private triggerFTESubject(billingExpanded: any) {
        if (billingExpanded && billingExpanded.code === 'fte_contract_services') {
            this.fteContractServiceSubject.next('fte contract service updated.');
        }
    }
}
