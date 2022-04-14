import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import * as moment from 'moment';

import { PLMayService } from '@root/index';
import { PLUtilService, PLComponentStateInterface, PLComponentInitDone, PLUserAssignment } from '@common/services';

import { ISAFeatureStates } from '../../isa';
import { PLISAService } from '../../isa/pl-isa.service';
import { CurrentUserService } from '@modules/user/current-user.service';
import { PLCustomerDashboardService } from '../pl-customer-dashboard.service';

@Component({
    selector: 'pl-customer-dashboard',
    templateUrl: './pl-customer-dashboard.component.html',
    styleUrls: ['./pl-customer-dashboard.component.less'],
})
export class PLCustomerDashboardComponent implements OnInit, OnDestroy {
    componentName = 'PLCustomerDashboardComponent';
    assignments: PLUserAssignment[] = [];
    _state: PLComponentStateInterface;
    loading: Boolean = true;

    constructor(
        private router: Router,
        private util: PLUtilService,
        private plMay: PLMayService,
        private plISASvc: PLISAService,
        private activatedRoute: ActivatedRoute,
        private currentUserService: CurrentUserService,
        private dashboardService: PLCustomerDashboardService,
    ) {}

    // --------------------------
    // lifecycle methods
    // --------------------------
    ngOnInit(): void {
        this._state = this.util.initComponent({
            name: this.componentName,
            params: {
                flags: {
                    // COMPONENT_INIT: 1,
                    // RUN_TEST: 1,
                },
                mocks: [
                    // 'MOCK_MULTI_ORG_LOC',
                ],
            },
            initObservables: [this.getSchoolYearInitObservable()],
            afterDoneFn: (state: PLComponentStateInterface) => {
                this.test(state);
            },
            fn: (state: PLComponentStateInterface, done: PLComponentInitDone) => {
                const user = state.currentUser;
                this.assignments = user.xAssignments;

                state.clientsUpdatedAt = moment().format('MM/DD/YYYY');
                state.lastSeenDays = 15;

                if (this.plMay.isNewLandingEnabled(user)) {
                    if (this.plMay.isNewLandingAccessEnabled(user)) {
                        if (!this.plMay.canAccessCustomerDashboard(user)) {
                            this.router.navigateByUrl('/not-found', { skipLocationChange: true });
                        }
                    }
                }

                state.mayViewProviders = user.xGlobalPermissions && user.xGlobalPermissions.viewProviders;

                this.initUserSeen(state);

                // get stuff
                state.asyncCount = 2;

                this.setOrgsAndLocsOpts(state, user.xAssignments);

                done();

                // get stats
                if (state.model.selectedOrgOrLocation) {
                    this.getStudentStats(state, () => {
                        done();
                    });
                } else {
                    done();
                }
            },
        });
    }

    ngOnDestroy(): void {
        this.util.destroyComponent(this._state);
    }

    //#region  Public Methods

    onChangeOrgOrLocation(evt: any) {
        const uuid = evt.model;
        const selected = this._state.model.orgOrLocationOpts.filter((x: { uuid: any }) => x.uuid === uuid)[0];

        this.setSelectedOrgOrLocation(selected, this._state);
        this.getStudentStats(this._state);
    }

    canAddUser(): Boolean {
        const id = this._state.model.selectedOrgOrLocation.uuid;

        return (
            this.assignments.filter(a => a.roleCode === 'customer-admin' && (a.locationID === id || a.orgID === id))
                .length > 0
        );
    }

    getSelectedOrganizationUuid(): string {
        return this._state.model.selectedOrgOrLocation.orgUuid;
    }

    getSelectedLocationUuid(): string {
        return this._state.model.selectedOrgOrLocation.isLocation ? this._state.model.selectedOrgOrLocation.uuid : '';
    }

    getSelectedLocationName(): string {
        return this._state.model.selectedOrgOrLocation.isLocation ? this._state.model.selectedOrgOrLocation.label : '';
    }

    refreshPage() {
        const fn = () => {
            this._state.refreshPage = this._state.refreshPage ? 0 : 1;
        };
        fn();
        setTimeout(fn, 0);
    }

    routeTo(uriToRoute: string): void {
        if (uriToRoute) {
            this.router.navigate([uriToRoute], {relativeTo: this.activatedRoute});
        }
    }

    //#endregion Public Methods

    //#region Private Methods

    private initUserSeen(state: PLComponentStateInterface) {
        this.currentUserService
            .updateUserSeen()
            .pipe(first())
            .subscribe((res: any) => {
                const previousLastSeen = res.updateCurrentUserProfileLastSeen.lastSeen;
                if (!previousLastSeen) {
                    state.lastSeenDays = -1;
                } else {
                    state.lastSeenDays = moment().diff(moment(previousLastSeen, 'YYYY-MM-DD HH:mm:ss'), 'days');
                }
            });
    }

    private getStudentStats(state: PLComponentStateInterface, fn?: Function) {
        // using loading to re-add elements to the DOM; necessary to reset search defaults in reports textboxes
        this.loading = true;

        // client student stats totals
        this.dashboardService
            .getStatsStudents$(
            {
                schoolYearCode: state.model.currentSchoolYear.code,
                id: state.model.selectedOrgOrLocation.uuid,
                isLocation: state.model.selectedOrgOrLocation.isLocation,
            },
            state)
            .subscribe((res: any) => {
                this.loading = false;

                state.model.clientStatsStudents = res.statsStudents;
                if (fn) {
                    fn(res, state);
                }
            });
    }

    private setOrgsAndLocsOpts(state: PLComponentStateInterface, assignments: PLUserAssignment[]) {
        const opts = assignments.map((a: PLUserAssignment) => {
            return {
                value: a.isLocation ? a.locationID : a.orgID,
                label: a.isLocation ? `${a.locationName} (${a.orgName})` : a.orgName,
                uuid: a.isLocation ? a.locationID : a.orgID,
                orgName: a.orgName,
                orgUuid: a.orgID,
                isLocation: a.isLocation,
                locationName: a.locationName,
            };
        });

        state.model.orgOrLocationOpts = opts;

        if (opts.length > 0) {
            this.setSelectedOrgOrLocation(opts[0], state);
        }
    }

    private setSelectedOrgOrLocation(selected: any, state: PLComponentStateInterface) {
        state.model.selectedOrgOrLocation = selected;
        state.model.selectedOrgOrLocationUuid = selected.uuid;
        this.updateOrgInfoForISAs(selected.uuid, selected.orgName);

        state.model.orgName = selected.orgName;

        if (!selected.isLocation) {
            state.model.viewContactsLink = `/organization/${selected.uuid}/contacts`;
            state.model.viewHandbookLink = `/organization/${selected.uuid}/handbook`;
            state.model.orgOrLocationName = selected.orgName;
        } else {
            state.model.viewContactsLink = `/location/${selected.uuid}/contacts`;
            state.model.viewHandbookLink = `/location/${selected.uuid}/handbook`;
            state.model.orgOrLocationName = selected.locationName;
        }
    }

    private getSchoolYearInitObservable() {
        return this.dashboardService.getSchoolYearInitObservable((data: any, state: PLComponentStateInterface) => {
            state.model.currentSchoolYear = data;
        });
    }

    private test(state: PLComponentStateInterface) {
        this.util.runTest(state, () => {
            this.getStudentStats(state, (res: any, state2: PLComponentStateInterface) => {
                this.util.testLog('stats students', res, state2);
            });
            this.dashboardService.getOrganizations$({}, state).subscribe((res: any) => {
                this.util.testLog('gql organizations', res, state);
            });
        });
    }

    /**
     * When the selected organization changes (automatically or by the user); the id has to be updated in and for the ISAs.
     * This scenario applies when:
     *   - the customer admin has more than one organization.
     *   - the customer admin selects its second org, navigates away the dashboard, comes back, and the first org gets selected automatically.
     * 
     * @param orgId - The id of the current organization
     */
     private updateOrgInfoForISAs(orgId: string, orgName: string) {
        if ( this.plISASvc.isasFeatureState === ISAFeatureStates.available ) {
            this.plISASvc.schoolOrgId = orgId;
            this.plISASvc.currentSchoolOrgName = orgName;
        }
    }

    //#endregion Private Methods
}
