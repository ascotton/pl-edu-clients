import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PLHttpService, PLTimezoneService, PLGraphQLService } from '@root/index';
import { PLGetAppointmentsParams, PLGetPendingClientsParams, PLEvent } from '../models';
import { MAX_QUERY_LIMIT } from '@common/services';

@Injectable()
export class PLScheduleService {

    private readonly CREATE_CALENDAR_MUTATION = `mutation createCalendarForProvider($providerId: ID!) {
        createCalendarForProvider(input: {
            providerId: $providerId
        }) {
            errors {
                code
                message
                field
            }
            calendar {
                id
                token
            }
        }
    }`;

    constructor(
        private plHttp: PLHttpService,
        private plGraphQL: PLGraphQLService,
        private plTimezone: PLTimezoneService,
        @Inject(MAX_QUERY_LIMIT) private limit: number) { }

    getExportInfo(providerId: string): Observable<any> {
        return this.plGraphQL.query(this.CREATE_CALENDAR_MUTATION, { providerId });
    }

    getAppointments(params: PLGetAppointmentsParams): Observable<any> {
        return this.plHttp.get('appointments', params);
    }

    getPendingClients(params: PLGetPendingClientsParams): Observable<any> {
        return this.plHttp.get('evaluations', params);
    }

    // Convert form inputs to event format (for saving to backend and displaying on calendar).
    inputsToEvent(eventInput: PLEvent, provider: string) {

        const { uuid, title, billing_code, start, end } = eventInput;
        // Daylight savings timezone change needs original times.
        if (!eventInput.original_start) {
            eventInput.original_start = start;
        }
        if (!eventInput.original_end) {
            eventInput.original_end = end;
        }
        return {
            uuid,
            title,
            provider,
            billing_code,
            event_type: 'BILLING',
            start: this.plTimezone.toUTC(start),
            end: this.plTimezone.toUTC(end),
        };
    }
}
