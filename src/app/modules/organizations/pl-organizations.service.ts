import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import * as moment from 'moment';

// tslint:disable: no-require-imports
const ORG_OVERVIEW_QUERY = require('./queries/organization-overview.graphql');
const ORG_LOCATIONS_QUERY = require('./queries/organization-locations.graphql');

import {
    PLApiUsStatesService,
    PLGraphQLService,
    PLLodashService,
} from '@root/index';

import { PLCurrentOrganization, PLProviderProfile } from '@common/interfaces';
import { PLProviderProfileService } from '@common/services';

@Injectable()
export class PLOrganizationsService {
    private currentOrgId$: ReplaySubject<string> = new ReplaySubject<string>(1);

    constructor(
        private plGraphQL: PLGraphQLService,
        private states: PLApiUsStatesService,
        private lodash: PLLodashService,
        private plProviderProfileService: PLProviderProfileService,
    ) {}

    currentOrgDetails(): Observable<PLCurrentOrganization> {
        return this.currentOrgOverview().pipe(
            map((overview: any) => this.lodash.pick(overview, ['name', 'id', 'state', 'website', 'sfAccountId'])),
        );
    }

    currentOrgOverview(): Observable<any> {
        return this.currentOrgId().pipe(
            switchMap((orgId: string) => this.orgOverviewById(orgId)),
        );
    }

    currentOrgId(): Observable<string> {
        return this.currentOrgId$;
    }

    locationsByOrgId(orgId: string, params: any): Observable<{locations: any[], totalCount: number}> {
        const options = Object.assign(params, { organizationId_In: orgId });

        const getClientsInService = (clientStatistics: any) => {
            return clientStatistics.statuses.find((s: any) => s.status === 'IN_SERVICE').count;
        };

        return this.plGraphQL.query(ORG_LOCATIONS_QUERY, options).pipe(
            first(),
            map((results: any) => ({
                locations: results.locations.map((location: any) => ({
                    id: location.id,
                    name: location.name,
                    sfAccountId: location.sfAccountId,
                    timezone: location.timezone,
                    clientsInService: getClientsInService(location.clientStatistics),
                })),
                totalCount: results.locations_totalCount,
            })),
        );
    }

    orgOverviewById(orgId: string): Observable<any> {
        const options = { id: orgId };

        return this.plGraphQL.query(ORG_OVERVIEW_QUERY, options, { suppressError: true }).pipe(
            map((results: any) => {
                if (results.organization === null) {
                    throw new Error('No permissions to view organization');
                }

                const org = results.organization;
                const address = org.shippingAddress;

                return {
                    city: address.city || '',
                    id: org.id,
                    name: org.name,
                    postalCode: address.postalCode || '',
                    sfAccountId: org.sfAccountId,
                    salesforceId: org.salesforceId,
                    state: org.state ? this.states.getFromPostalCode(org.state) : '',
                    stateCode: org.state || '',
                    street: address.street || '',
                    website: org.website || '',
                    timezone: org.timezone || '',
                    dateTherapyStarted: org.dateTherapyStarted ?
                        moment(org.dateTherapyStarted, 'YYYY-MM-DD HH:mm:ss').format('MM/DD/YYYY') : '',
                    projectedTherapyStartDate: org.projectedTherapyStartDate ?
                        moment(org.projectedTherapyStartDate, 'YYYY-MM-DD HH:mm:ss').format('MM/DD/YYYY') : '',
                    accountOwner: org.accountOwner,
                    accountCqm: org.accountCqm,
                };
            }),
        );
    }

    setCurrentOrgId(orgId: string) {
        this.currentOrgId$.next(orgId);
    }

    providerProfiles(params: any): Observable<{ providers: PLProviderProfile[], totalCount: number}> {
        return this.plProviderProfileService.getProviderProfiles(params);
    }
}
