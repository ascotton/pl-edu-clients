import { Component } from '@angular/core';
import { PLPlatformHelperService, PLSchoolStaffService } from '../services';
// NgRx Store
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import {
    PLFetchLicenses,
    selectSelectedOrganization,
    selectIsGroupPrivatePractice,
} from '../store';
import { combineLatest, Observable } from 'rxjs';
import { tap, switchMap, map } from 'rxjs/operators';

@Component({
    templateUrl: './platform-dashboard.component.html',
    styleUrls: ['./platform-dashboard.component.less']
})
export class PLPlatformDashboardComponent {
    organization$ = this.store$.select(selectSelectedOrganization);
    isGroupPrivatePractice$: Observable<boolean> = this.store$.select(selectIsGroupPrivatePractice);
    data$ = this.helper.reFetch().pipe(
        tap(() => this.store$.dispatch(PLFetchLicenses({}))),
        switchMap(({ organization, schoolYear }) => combineLatest([
            this.plSS.fetchDashboardData(organization.id, organization.isGroupOrganization ? null : schoolYear.id),
            this.plSS.fetchPlatformUserActivity(organization.sfAccountId, organization.isGroupOrganization ? null : schoolYear.id),
        ])),
        map(([dashboard, userActivity]) => ({ dashboard, userActivity })),
    );

    today = new Date();

    constructor(
        private store$: Store<AppStore>,
        private plSS: PLSchoolStaffService,
        private helper: PLPlatformHelperService) {
    }
}
