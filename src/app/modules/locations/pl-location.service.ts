import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { first, filter, map, withLatestFrom } from 'rxjs/operators';
import { ActivatedRoute, Params } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';
import { User } from '../user/user.model';
import { PLUtilService } from '@common/services';

import {
    PLMayService,
    PLLodashService,
    PLApiLocationsService,
    PLClientStudentDisplayService,
    PLGraphQLService,
} from '@root/index';
import { PLSubNavigationTabs } from '../../common/interfaces/pl-sub-navigation-tabs';

// tslint:disable-next-line: no-require-imports
const locationQuery = require('./queries/location.graphql');

@Injectable()
export class PLLocationService {
    private location: any = {};
    private locationUuid = '';
    private currentUser: User;

    private mayViewPhi = false;
    private mayViewPii = false;
    private mayExportLocationNotes = false;
    private loaded: any = {
        currentUser: false,
        location: false,
    };
    private mayViewLocation = false;
    private permissionCode: number;

    constructor(
        public util: PLUtilService,
        private plMay: PLMayService,
        private route: ActivatedRoute,
        private store: Store<AppStore>,
        private plLodash: PLLodashService,
        private plGraphQL: PLGraphQLService,
        private plApiLocations: PLApiLocationsService,
    ) { }

    getFromRoute() {
        return new Observable((observer: any) => {
            const checkAllLoadedLocal = () => {
                if (this.plLodash.allTrue(this.loaded)) {
                    // TODO - every one has access?
                    this.mayViewPhi = true;
                    this.mayViewPii = true;
                    this.mayExportLocationNotes = this.plMay.exportLocationNotes(this.currentUser);
                    observer.next({
                        location: this.location,
                        currentUser: this.currentUser,
                        mayViewPhi: this.mayViewPhi,
                        mayViewPii: this.mayViewPii,
                        mayViewLocation: this.mayViewLocation,
                        mayExportLocationNotes: this.plMay.exportLocationNotes,
                    });
                }
            };

            this.store
                .select('currentUser')
                .pipe(
                    filter((user: any) => user.uuid),
                    first(),
                )
                .subscribe((user: any) => {
                    this.currentUser = user;
                    this.loaded.currentUser = true;
                    checkAllLoadedLocal();
                });

            this.getIdFromRoute()
                .pipe(first())
                .subscribe((locationId: string) => {
                    if (locationId === this.locationUuid) {
                        return;
                    }
                    this.locationUuid = locationId;

                    this.getLocation()
                        .pipe(first())
                        .subscribe(
                            () => {
                                checkAllLoadedLocal();
                            },
                            () => {
                                observer.error({ permissionCode: this.permissionCode });
                            },
                        );
                });
        });
    }

    getIdFromRoute(): Observable<string> {
        return this.route.firstChild.firstChild.params.pipe(
            map((params: Params) => params['id']),
            filter(id => !!id),
        );
    }

    getLocation(locationId?: string) {
        this.locationUuid = locationId || this.locationUuid;
        return new Observable((observer: any) => {
            const vars = {
                id: this.locationUuid,
            };
            this.plGraphQL
                .query(locationQuery, vars, {})
                .pipe(first(), withLatestFrom(this.store.select('currentUser')))
                .subscribe(
                    ([res, user]) => {
                        this.currentUser = user;
                        this.loaded.location = true;
                        this.mayViewPhi = true;
                        this.mayViewPii = true;
                        this.mayViewLocation = true;
                        this.location = res.location;

                        // GraphQL does not have triennial count?
                        const params = {
                            uuid: this.locationUuid,
                            expand: 'client_stats',
                        };
                        this.plApiLocations.get(params, { suppressError: true }).subscribe((res2: any) => {
                            this.location.client_stats_expanded = res2[0].client_stats_expanded;
                            observer.next({
                                location: this.location,
                                currentUser: this.currentUser,
                                mayViewPhi: this.mayViewPhi,
                                mayViewPii: this.mayViewPii,
                                mayViewLocation: this.mayViewLocation,
                            });
                        });
                    },
                    (err: any) => {
                        if (err.status === 403 || err.status === 404) {
                            this.permissionCode = err.status;
                        }
                        observer.error();
                    },
                );
        });
    }

    isVirtual(location: any): boolean {
        return location && location.locationType === 'VIRTUAL';
    }

    getType(location: any): string {
        return this.isVirtual(location) ? 'Virtual School' : 'Brick & Mortar School';
    }

    getTabs(currentUser?: any): PLSubNavigationTabs[] {
        this.currentUser = currentUser || this.currentUser;
        this.mayExportLocationNotes = this.plMay.exportLocationNotes(this.currentUser);

        const userGlobalPermissions = this.currentUser && this.currentUser.xGlobalPermissions
            ? this.currentUser.xGlobalPermissions : {};
        const userUiFlags: any = this.currentUser && this.currentUser.xEnabledUiFlags
            ? this.currentUser.xEnabledUiFlags : [];
        const hrefBase = `/location/${this.locationUuid}/`;
        const clientStudentCapital = PLClientStudentDisplayService.get(this.currentUser, { capitalize: true });

        let tabs: PLSubNavigationTabs[] = [
            { href: `${hrefBase}overview`, label: 'Overview', replaceHistory: true, pageTabTitle: `Overview - ${this.location.name}` },
            { href: `${hrefBase}clients`, label: `${clientStudentCapital}s`, replaceHistory: true, pageTabTitle: `${clientStudentCapital}s - ${this.location.name}` },
        ];

        if (this.plMay.isCustomer(this.currentUser)) {
            const assessmentsTab = { href: `${hrefBase}assessments`, label: 'Assessments', pageTabTitle: `Assessments - ${this.location.name}` };
            tabs = tabs.concat([assessmentsTab]);
        }

        if (userGlobalPermissions.viewProviders) {
            tabs = tabs.concat([
                { href: `${hrefBase}providers`, label: 'Providers', replaceHistory: true, pageTabTitle: `Providers - ${this.location.name}` },
            ]);
        }

        tabs = tabs.concat([
            { href: `${hrefBase}contacts`, label: 'School Staff', replaceHistory: true, pageTabTitle: `School Staff - ${this.location.name}` },
        ]);
        tabs = tabs.concat([
            { href: `${hrefBase}documents`, label: 'Documents', replaceHistory: true, pageTabTitle: `Documents  - ${this.location.name}` },
        ]);
        tabs = tabs.concat([
            { href: `${hrefBase}handbook`, label: 'Organization Handbook', replaceHistory: true, pageTabTitle: `Handbook - ${this.location.name}` },
        ]);
        tabs = tabs.concat([
            { href: `${hrefBase}availability`, label: 'Availability', replaceHistory: true, pageTabTitle: `Availability - ${this.location.name}` },
        ]);

        if (userUiFlags.includes('view_location_schedule')) {
            tabs = tabs.concat([
                { href: `${hrefBase}appointments`, label: 'Appointments', replaceHistory: true, pageTabTitle: `Appointments - ${this.location.name}` }
            ]);
        }
        if (this.mayExportLocationNotes) {
            tabs = tabs.concat([
                { href: `${hrefBase}reports`, label: 'Reports', replaceHistory: true, pageTabTitle: `Reports - ${this.location.name}` },
            ]);
        }

        tabs = [
            ...tabs,
            { href: `${hrefBase}scheduler`, label: 'Scheduler', replaceHistory: true, pageTabTitle: `Scheduler - ${this.location.name}` },
        ];
        return tabs;
    }

    getLocationClientAggregates(locationId: string) {
        return this.plGraphQL
            .query(GQL_CLIENT_LOCATION_AGGREGATES, { locationId }, {})
            .pipe(first());
    }
}

const GQL_CLIENT_LOCATION_AGGREGATES = `
    query clientLocationAggregates($locationId: UUID!) {
        clientStats(locationId: $locationId) {
            nextMonthAnnualIepCount
            nextMonthEvaluationCount
        }
    }
`;
