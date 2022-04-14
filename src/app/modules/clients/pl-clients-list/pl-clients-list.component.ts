import { Store } from '@ngrx/store';
import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { CurrentUserService } from '@modules/user/current-user.service';

import { PLClientStudentDisplayService, PLMayService } from '@root/index';
import { filter, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { PLSubNavigationTabs } from '@root/src/app/common/interfaces/pl-sub-navigation-tabs';
import { selectCurrentUser, selectCurrentUserLoaded, selectIsServiceAndSupport } from '@root/src/app/common/store';

@Component({
    selector: 'pl-clients-list',
    templateUrl: './pl-clients-list.component.html',
    styleUrls: ['./pl-clients-list.component.less'],
})
export class PLClientsListComponent implements OnInit {
    hrefBase = `/client/list/`;
    tabs: PLSubNavigationTabs[] = [];
    currentUser: User;
    userCanMerge = true;
    isServiceAndSupportUser = false;

    constructor(
        private router: Router,
        private location: Location,
        private store: Store<AppStore>,
        private plCurrentUser: CurrentUserService,
        private plMayService: PLMayService,
    ) { }

    ngOnInit() {
        this.selectCurrentUserAndCheckRouterEvent();
    }
    
    selectCurrentUserAndCheckRouterEvent() {
        this.store.select(selectCurrentUserLoaded).pipe(
            filter(loaded => loaded),
            withLatestFrom(this.store.select(selectIsServiceAndSupport)),
            tap(([_, isSvcAndSupport]) => this.isServiceAndSupportUser = isSvcAndSupport),
            switchMap(() => this.store.select(selectCurrentUser)),
        ).subscribe((user) => {
            this.currentUser = user;
            this.userCanMerge = user.xGlobalPermissions && user.xGlobalPermissions.mergeClient;
            this.updateTabs();
        });

        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) this.updateTabs();
        });
    }

    updateTabs() {
        const user = this.currentUser;
        const clientStudentCapital = PLClientStudentDisplayService.get(user, { capitalize: true });
        const sufix = `- ${clientStudentCapital}s`;

        const absencesTab = { href: `${this.hrefBase}absences`, label: 'Absences', pageTabTitle: `Absences ${sufix}` };
        const caseloadTab = { href: `${this.hrefBase}caseload-clients`, label: 'My Caseload', pageTabTitle: `Caseload ${sufix}` };
        const assessmentsTabLabel = this.plMayService.isProvider(user) ? 'My Assessments' : 'Assessments';
        const assessmentsTab = { href: `${this.hrefBase}assessments`, label: assessmentsTabLabel, pageTabTitle: `Assessments ${sufix}` };
        const allClientsTab = {
            href: `${this.hrefBase}all-clients`, label: `All ${clientStudentCapital}s`, pageTabTitle: `All ${clientStudentCapital}s ${sufix}`,
        };

        if (user && user.xGlobalPermissions) {
            const tabs: PLSubNavigationTabs[] = [allClientsTab];
            const caseLoadClientsPathEnabled = this.location.path().indexOf('caseload-clients') > -1;
            const clientAbsenceDashboardEnabled = user.xEnabledUiFlags.indexOf('client-absence-dashboard') > -1;

            if (user.xGlobalPermissions.provideServices) {
                tabs.push(caseloadTab);
            } else if (caseLoadClientsPathEnabled) {
                this.router.navigate(['/clients/all-clients']);
            }

            if (this.plMayService.isProvider(user) || this.plMayService.isClinicalAccountManager(user)) {
                tabs.push(assessmentsTab);
            }

            if (clientAbsenceDashboardEnabled || this.isServiceAndSupportUser){
                tabs.push(absencesTab);
            }
            this.tabs = tabs;
        } else {
            this.tabs = [allClientsTab];
        }
    }
};
