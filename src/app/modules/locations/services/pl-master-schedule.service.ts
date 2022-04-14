import { Injectable } from '@angular/core';
import { PLGraphQLService } from '@root/index';
// RxJs
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { PLProviderSession } from '../models';

@Injectable()
export class PLMasterSchedulerService {

    private readonly CLEAR_MUTATION = `mutation ClearMasterSchedule($locationId: ID!, $schoolYearCode: String!) {
        clearAllMasterSchedule(input: { locationId: $locationId, schoolYearCode: $schoolYearCode }) {
            updated
        }
    }`;

    private readonly APPROVE_MUTATION = `mutation ApproveMasterSchedule($locationId: ID!, $schoolYearCode: String!) {
        approveAllMasterSchedule(input: { locationId: $locationId, schoolYearCode: $schoolYearCode }) {
            updated
        }
    }`;

    private readonly GET_EVENTS = `query realSchedule($providerId: ID!, $locationId: ID!, $schoolYearCode: String!) {
        scheduledEvents(providerId: $providerId, schoolYearCode: $schoolYearCode, locationId: $locationId) {
            edges {
                node {
                    uuid
                    week
                    day
                    start
                    end
                    location {
                        id
                    }
                    provider {
                        id
                    }
                    timezone
                }
            }
        }
    }`;

    // masterSchedulesByProvider
    private readonly GET = `query schedule($providerId: ID, $locationId: ID, $schoolYearCode: String!) {
        masterSchedules(providerId: $providerId, locationId: $locationId, schoolYearCode: $schoolYearCode) {
            edges {
                node {
                    id
                    referrals {
                        edges {
                            node {
                                id
                                state
                                client {
                                    id
                                    firstName
                                    lastName
                                }
                                frequency
                                interval
                                duration
                            }
                        }
                    }
                    timezone
                    hasReferrals
                    location {
                        id
                        name
                        organizationName
                        timezone
                    }
                    provider {
                        id
                    }
                    start
                    end
                    day
                    week
                }
            }
        }
    }`;

    private readonly DELETE_MUTATION = `mutation DeleteLocationSchedule($id: ID!) {
        deleteMasterSchedule(input: { id: $id }) {
            success
        }
    }`;

    private readonly REMOVE_REFERRAL_MUTATION = `mutation clearReferralMasterSchedule($referralId: ID!) {
        removeReferralMasterSchedule(input: { referralId: $referralId }) {
            status
        }
    }`;

    private readonly CREATE_MUTATION = `mutation SaveLocationSchedule($locationId: ID!, $providerId: ID!, $referralIds: [ID], $week: Int, $day: String!, $start: Time!, $end: Time!) {
        createMasterSchedule(
          input: {
            week: $week,
            day: $day,
            start: $start,
            end: $end,
            locationId: $locationId,
            providerId: $providerId,
            referralIds: $referralIds
          }) {
            masterSchedule {
                uuid
            }
            errors {
                code
                message
                field
            }
        }
    }`;

    constructor(private plGraphQL: PLGraphQLService) { }

    private mapSchedule(masterSchedules: any[]): PLProviderSession[] {
        return masterSchedules.map(session => ({
            ...session,
            end: session.end.substring(0, 5),
            start: session.start.substring(0, session.start.length - 3),
            providerId: session.provider.id,
            locationId: session.location.id,
            referralIds: session.referrals ? session.referrals.map((r: any) => r.id) : [],
        }));
    }

    clear(locationId: string, schoolYearCode: string) {
        return this.plGraphQL.query(this.CLEAR_MUTATION, { locationId, schoolYearCode });
    }

    approve(locationId: string, schoolYearCode: string): Observable<number> {
        return this.plGraphQL.query(this.APPROVE_MUTATION, { locationId, schoolYearCode }).pipe(
            map(({ approveAllMasterSchedule }) => approveAllMasterSchedule.updated),
        );
    }

    delete(appointment: PLProviderSession): Observable<PLProviderSession> {
        return this.plGraphQL.mutate(this.DELETE_MUTATION, { id: appointment.id }).pipe(
            map(({ deleteMasterSchedule }) => deleteMasterSchedule.success ? appointment : null),
        );
    }

    removeReferral(referralId: string): Observable<boolean> {
        return this.plGraphQL.mutate(this.REMOVE_REFERRAL_MUTATION, { referralId }).pipe(
            map(({ removeReferralMasterSchedule }) => removeReferralMasterSchedule.status === 'ok'),
        );
    }

    create(appointment: PLProviderSession): Observable<PLProviderSession> {
        return this.plGraphQL.mutate(this.CREATE_MUTATION, appointment).pipe(
            map(({ createMasterSchedule }) => {
                const { uuid } = createMasterSchedule.masterSchedule;
                return uuid ? { ...appointment, id: uuid } : null;
            }),
        );
    }

    getLocationSchedule(schoolYearCode: string, locationId: string): Observable<PLProviderSession[]> {
        return this.plGraphQL.query(this.GET, { schoolYearCode, locationId }).pipe(
            first(),
            map((data: { masterSchedules: any[] }) => this.mapSchedule(data.masterSchedules)));
    }

    getProviderSchedule(schoolYearCode: string, providerId: string): Observable<PLProviderSession[]> {
        return this.plGraphQL.query(this.GET, { schoolYearCode, providerId }).pipe(
            first(),
            map((data: { masterSchedules: any[] }) => this.mapSchedule(data.masterSchedules)));
    }

    getProviderRealSchedule(schoolYearCode: string, providerId: string, locationId?: string): Observable<PLProviderSession[]> {
        return this.plGraphQL.query(this.GET_EVENTS, { schoolYearCode, providerId, locationId }).pipe(
            first(),
            map((data: { scheduledEvents: any[] }) => this.mapSchedule(data.scheduledEvents)));
    }

}
