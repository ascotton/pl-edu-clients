import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { first, filter, map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';
import { User } from '../user/user.model';
import { PLClientIdService } from '@common/services';

import {
    PLMayService, HeapLogger, PLGraphQLService,
    PLGQLQueriesService, PLClientStudentDisplayService,
} from '@root/index';
import { PLSubNavigationTabs } from '../../common/interfaces/pl-sub-navigation-tabs';

@Injectable()
export class PLClientService {
    private client: any = {};
    private gettingClientId = '';
    private clientUuid = '';
    private currentUser: User;

    private mayViewPhi = false;
    private mayViewClient = false;
    private mayRemoveFromCaseload = false;
    private mayAddToCaseload = false;
    private mayEditClient = false;
    private permissionCode: number;
    private subscriptions: any = {};

    constructor(
        private route: ActivatedRoute,
        private plMay: PLMayService,
        private store: Store<AppStore>,
        private heapLogger: HeapLogger,
        private plGraphQL: PLGraphQLService,
        private plGQLQueries: PLGQLQueriesService,
    ) {
        this.subscriptions.user = store.select('currentUser')
            .subscribe((user: any) => {
                this.currentUser = user;
            });
    }

    destroy() {
        this.subscriptions.user && this.subscriptions.user.unsubscribe();
        this.subscriptions.clientId && this.subscriptions.clientId.unsubscribe();
    }

    // NOTE (jh 2019-05)
    //   This doesn't work if the route is a child of the client route
    //   and ONLY works as a helper for the root client route
    getClientIdFromRoute() {
        return new Observable((observer: any) => {
            this.subscriptions.clientId = this.route.firstChild.params
                .subscribe((routeParams: any) => {
                    this.clientUuid = routeParams['id'] || null;
                    observer.next({ clientId: this.clientUuid });
                });
        });
    }

    getClient(forceReload: boolean = false, clientId?: string) {
        if (!forceReload && (this.client.id === this.clientUuid || this.gettingClientId === this.clientUuid)) {
            return new Observable((observer: any) => observer.next(this.client));
        }
        this.clientUuid = clientId || this.clientUuid;
        this.gettingClientId = this.clientUuid;
        const variables = {
            id: this.clientUuid,
        };
        const obs = this.plGraphQL.query(`query ${this.plGQLQueries.queries.client.cacheName}($id: ID!) {
            ${this.plGQLQueries.queries.client.apiName}(id: $id) {
                id
                canDelete
                permissions {
                    viewPhi
                    updatePhi
                    updatePii
                    deleteClient
                    uploadDocument
                    transferLocation
                }
                firstName
                lastName
                externalId
                birthday
                inCaseload
                transferable
                primaryLanguage {
                    id
                    code
                    name
                }
                secondaryLanguage {
                    id
                    code
                    name
                }
                englishLanguageLearnerStatus
                locations {
                    edges {
                        node {
                            id
                            name
                            state
                            parent {
                                id
                                name
                            }
                            locationType
                            techCheckStatus
                        }
                    }
                }
                age
                grade
                gradeDisplay
                email
                phone
                contactPreference
                timezone
                strategies
                city
                street
                state
                postalCode
                sex
                races {
                    edges {
                        node {
                            id
                            name
                        }
                    }
                }
                ethnicities {
                    edges {
                        node {
                            id
                            name
                        }
                    }
                }
                activeIep {
                    id
                    status
                    startDate
                    nextAnnualIepDate
                    nextEvaluationDate
                    prevEvaluationDate
                }
                recordingAllowed
                status
                statusDisplay
                teletherapyInformedConsent
            }
         }`, variables, {}).pipe(
            filter((res) => this.clientUuid === res.client.id),
            map((res) => this.formatClient(res.client)),
            first(),
        );

        obs.subscribe((res: any) => {
            // this.loaded.client = true;
            this.mayViewClient = true;
            this.client = res;
            this.checkPrivileges();
            this.heapLogger.logCustomEvent('ViewProfile', { clientID: this.client.id });
            this.store.dispatch({ type: 'UPDATE_CURRENT_CLIENT', payload: this.client });

            this.mayViewPhi = this.plMay.viewPhiClient(this.currentUser, this.client);
            this.store.dispatch({
                type: 'UPDATE_CURRENT_CLIENT_USER', payload: {
                    client: this.client,
                    mayViewPhi: this.mayViewPhi,
                    mayViewClient: this.mayViewClient,
                    mayRemoveFromCaseload: this.mayRemoveFromCaseload,
                    mayAddToCaseload: this.mayAddToCaseload,
                    mayEditClient: this.mayEditClient,
                },
            });
        }, (err: any) => {
            if (err.status === 403 || err.status === 404) {
                this.permissionCode = err.status;
                this.store.dispatch({
                    type: 'UPDATE_CURRENT_CLIENT_USER', payload: {
                        permissionCode: this.permissionCode,
                    },
                });
            }
        });

        return obs;
    }

    /**
     * Based on the frequency a label for the UI will be created.
     *   e.g. `1 time`, `0 Times`, or blank when the frequency is  null or undefined.
     * 
     * @param frequency - The frequency the client will have his/her sessions.
     * @returns - A string for being displayed in the UI iwth the number of frequencies.
     */
    buildFrequencyLabel(frequency: number) : string {
        let frequencyLabel = '';

        if (frequency !== undefined && frequency !== null) {
            frequencyLabel = frequency === 1 ? `${frequency} time` : `${frequency} times`;
        }
        
        return frequencyLabel;
    }

    checkPrivileges() {
        if (this.currentUser && this.client) {
            // Need BOTH the ability to manage caseload for the provider (usually self)
            // and then to check if user is already in caseload.
            // TODO - if ever view this page on behalf of another provider, will need
            // to check against THAT provider, not self.
            // NOTE (jh) - Two cases:
            //   * case 1 - If viewing caseload AS another provider (hijacked), then user-level permissions is correct
            //   * case 2 - If viewing caseoad OF another provider, then the check requires data-level permissions
            // TODO (jh) - what is the means by which we perform data-level permissions?
            const mayManageCaseload = this.currentUser.xPermissions && this.currentUser.xPermissions.manageCaseload;
            this.mayRemoveFromCaseload = (mayManageCaseload && this.plMay.removeClientFromCaseload(this.currentUser, this.client));
            this.mayAddToCaseload = (mayManageCaseload && this.plMay.addClientToCaseload(this.currentUser, this.client));
            this.mayEditClient = this.plMay.editClient(this.currentUser, this.client);
        }
    }

    formatClient(client: any) {
        client._id = (PLClientIdService.getModeFromId(client.externalId) === 'needs_update') ?
            client.externalId : '';
        client._language = (client.primaryLanguage.name) ?
            client.primaryLanguage.name : '';
        const locations: string[] = [];
        if (client.locations) {
            client.locations.forEach((location: any) => {
                locations.push(location.name);
            });
        }
        client._locations = locations.join(',');
        // As of 2018-10, a client with multiple location isn't
        // an actual use case. Use the first location.
        client._isVirtual = client.locations.length > 0 && client.locations[0].locationType === 'VIRTUAL';
        const teletherapyMap = {
            ACKNOWLEDGED: 'Acknowledged',
            NOT_APPLICABLE: 'Not Applicable',
        };
        client._teletherapyDisplay = (client.teletherapyInformedConsent) ?
            teletherapyMap[client.teletherapyInformedConsent] : '';

        client._recordingConsentDisplay = client.recordingAllowed ? 'Obtained' : 'Not obtained';
        return client;
    }

    getTabs(): PLSubNavigationTabs[] {
        let tabs: PLSubNavigationTabs[] = [];
        const hrefBase = `/client/${this.clientUuid}/`;
        const clientName = `${this.client.firstName} ${this.client.lastName}`;

        const sufix = '- Clients';
        if (this.mayViewPhi) {
            // providers and customer admins have access to IEPs
            const hasIepAccess = this.plMay.isProvider(this.currentUser) || this.plMay.isCustomerAdmin(this.currentUser);

            if (hasIepAccess) {
                tabs.push({
                    href: `${hrefBase}iep-goals`, label: 'IEP/Progress Trackers', replaceHistory: true, pageTabTitle: `${clientName} - IEP/Progress ${sufix}`,
                });
            }
            tabs = tabs.concat([
                { href: `${hrefBase}services`, label: 'Services', replaceHistory: true, pageTabTitle: `${clientName} - Services ${sufix}` },
                { href: `${hrefBase}reports`, label: 'Events', replaceHistory: true, pageTabTitle: `${clientName} - Events ${sufix}` },
                { href: `${hrefBase}documents`, label: 'Documents', replaceHistory: true, pageTabTitle: `${clientName} - Documents ${sufix}` },
            ]);
        }
        const mayViewProviders = this.currentUser.xGlobalPermissions && this.currentUser.xGlobalPermissions.viewProviders;
        const clientStudentCapital = PLClientStudentDisplayService.get(this.currentUser, { capitalize: true });
        tabs.push({
            href: `${hrefBase}details`, label: `${clientStudentCapital} Details`, replaceHistory: true, pageTabTitle: `${clientName} - Details ${sufix}`,
        });
        if (mayViewProviders) {
            tabs.push({ href: `${hrefBase}providers`, label: 'Providers', replaceHistory: true, pageTabTitle: `${clientName} - Providers ${sufix}` });
        }

        return tabs;
    }
}
