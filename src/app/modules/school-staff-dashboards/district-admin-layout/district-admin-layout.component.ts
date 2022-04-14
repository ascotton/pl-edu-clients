import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// NgRx
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { selectSchoolYears, selectSelectedSchoolYearId, PLSelectSchoolYear } from '@common/store/common.store';
import { selectLoadedUser } from '@common/store/user.selectors';
import { selectSelectedOrganization, selectOrganizations, PLSelectOrganization, selectIsGroupPrivatePractice } from '../store';
// RxJs
import { Observable } from 'rxjs';
import { map, tap, withLatestFrom, delay, filter, takeUntil } from 'rxjs/operators';
// Common
import { PLDestroyComponent } from '@common/components';
import { PLDesignService, PLUserAssignment } from '@common/services';
import { PLSchoolYear } from '@common/interfaces';
import {
    PLMenuItem,
    PLOrganization,
} from '../models';
import { User } from '../../user/user.model';
import { PLUserNavigationService } from '@common/services/facade';
import { PLUserGuidingService } from '@common/services/pl-user-guiding.service';

@Component({
    templateUrl: './district-admin-layout.component.html',
    styleUrls: ['./district-admin-layout.component.less'],
})
export class PLDistrictAdminLayoutComponent extends PLDestroyComponent implements OnDestroy {

    menuItems: PLMenuItem[] = [];
    schoolYearHidden = false;
    isGroup = false;
    user$ = this.store$.pipe(selectLoadedUser);
    isGroupPrivatePractice$: Observable<boolean> = this.store$.select(selectIsGroupPrivatePractice);
    schoolYears$: Observable<PLSchoolYear[]> = this.store$.select(selectSchoolYears);
    selectedSY$: Observable<string> = this.store$.select(selectSelectedSchoolYearId);
    organizations$: Observable<PLOrganization[]> = this.store$.select(selectOrganizations);
    selectedOrganization$: Observable<PLOrganization> = this.store$.select(selectSelectedOrganization).pipe(
        withLatestFrom(
            this.route.data,
            this.user$,
            this.isGroupPrivatePractice$,
        ),
        delay(0),
        tap(([org, data, user, isGroup]) => {
            this.isGroup = isGroup || org.isGroupOrganization;
            this.buildSideNav(org, data.userAssigments, user, isGroup);
        }),
        map(([value]) => value),
    );

    constructor(
        private route: ActivatedRoute,
        public plDesign: PLDesignService,
        private store$: Store<AppStore>,
        private navigationHelper: PLUserNavigationService,
        private userGuiding: PLUserGuidingService,
    ) {
        super();
    }

    ngOnInit() {
        this.userGuiding.addUserGuiding('491585731ID');
        this.userGuiding.runScript(`(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:2292696,hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`);
        // Updates Selected Organization base on query param
        this.route.queryParams.pipe(
            filter(({ org }) => !!org),
            withLatestFrom(this.store$.select(selectOrganizations)),
            takeUntil(this.destroyed$),
        ).subscribe(([{ org } , organizations]) => {
            const item = organizations.find(({ id }) => org === id);
            if (item) {
                this.store$.dispatch(PLSelectOrganization({ item }));
            }
        });
        this.navigationHelper.getFullRouteData().pipe(
            takeUntil(this.destroyed$),
        ).subscribe(({ hideSchoolYear }) => {
            this.schoolYearHidden = !!hideSchoolYear;
        });
    }

    districtChanged(id: string, organizations: PLOrganization[]) {
        const item = organizations.find(org => org.id === id);
        this.store$.dispatch(PLSelectOrganization({ item }));
    }

    schoolYearChanged(schoolYear: string) {
        this.store$.dispatch(PLSelectSchoolYear({ schoolYear }));
    }

    buildSideNav(org: PLOrganization, assignments: PLUserAssignment[], user: User, isGroup: boolean) {
        const hasAssignment = assignments.find(a => a.orgID === org.id);
        const _items: PLMenuItem[] = [];
        _items.push({
            label: 'Platform Dashboard',
            icon: 'dashboard',
            href: 'dashboard-platform',
        });
        _items.push({
            label: 'User Management',
            icon: 'group',
            href: 'user-management',
        });
        _items.push({
            label: 'Usage Reports',
            icon: 'description',
            href: 'reports-usage',
        });
        if (!isGroup) {
            _items.push({
                label: 'User Training & Development',
                icon: 'school',
                href: 'training',
            });
        }
        if (hasAssignment) {
            _items.push({ label: 'divider' });
            _items.push({
                label: 'Provider Dashboard',
                // label: user.groups.includes('School Staff Providers') ?
                    // 'Provider Dashboard' : 'Admin Training & Resources',
                icon: 'dashboard',
                href: 'dashboard-user',
            });
        }
        this.menuItems = _items;
    }
}
