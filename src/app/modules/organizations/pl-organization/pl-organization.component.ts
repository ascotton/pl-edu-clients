import { Component, OnDestroy, OnInit } from '@angular/core';

import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { combineLatest } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { User } from '@modules/user/user.model';

import { PLOrganizationsService } from '../pl-organizations.service';
import { PLAddRecentOrganization } from '@modules/search/store/search.store';
import { PLUtilService, PLComponentStateInterface } from '@common/services';
import { PLClientStudentDisplayService, PLMayService } from '@root/index';
import { PLSubNavigationTabs } from '@common/interfaces/pl-sub-navigation-tabs';
import { PLCurrentOrganization } from '@common/interfaces';

@Component({
    selector: 'pl-organization',
    templateUrl: './pl-organization.component.html',
    styleUrls: ['./pl-organization.component.less'],
})
export class PLOrganizationComponent implements OnDestroy, OnInit {
    state: PLComponentStateInterface;
    classname = 'PLOrganizationComponent';
    mayViewOrg = true;
    org: any = {};
    tabs: PLSubNavigationTabs[] = [];
    FLAG_NO_ADD_USER = 0;

    private userOrgIdSubscription: any;
    private orgSubscription: any;

    constructor(
        public util: PLUtilService,
        private route: ActivatedRoute,
        private store: Store<AppStore>,
        private service: PLOrganizationsService,
        private plOrganizationsSvc: PLOrganizationsService,
        private plMay: PLMayService,
    ) { }

    ngOnInit(): void {
        this.state = this.util.initComponent({
            name: this.classname,
            fn: (state: PLComponentStateInterface, done: Function) => {
                const id$ = this.route.paramMap.pipe(map((p: ParamMap) => p.get('id')));
                const currentUser$ = this.store.select('currentUser');
                const currentOrganization$ = this.plOrganizationsSvc.currentOrgDetails().pipe(first());
                const currentIdUserAndOrganizationArray = [id$, currentUser$, currentOrganization$];

                id$.subscribe((id: string) => {
                    this.service.setCurrentOrgId(id);
                });

                this.userOrgIdSubscription = combineLatest(currentIdUserAndOrganizationArray)
                    .subscribe(([id, user, organization]: [string, User, PLCurrentOrganization]) => {
                        this.setTabs(id, user, organization.name);
                    });

                this.orgSubscription = this.service.currentOrgDetails().subscribe({
                    next: (org: any) => {
                        this.mayViewOrg = true;
                        this.org = org;
                        this.store.dispatch(PLAddRecentOrganization({ organization: this.org }));
                        done();
                    },
                    error: () => {
                        this.mayViewOrg = false;
                        done();
                    },
                });
            },
        });
    }

    ngOnDestroy(): void {
        this.userOrgIdSubscription.unsubscribe();
        this.orgSubscription.unsubscribe();
        this.util.destroyComponent(this.state);
    }

    setTabs(orgId: string, currentUser: User, orgName: string) {
        this.tabs = [];
        const hrefBase = `/organization/${orgId}/`;
        const clientStudentCapital = PLClientStudentDisplayService.get(currentUser, { capitalize: true });
        const userCanViewProviders = currentUser.xGlobalPermissions && currentUser.xGlobalPermissions.viewProviders;
        const providersTab = { href: `${hrefBase}providers`, label: 'Providers', replaceHistory: true, pageTabTitle: `Providers - ${orgName}` };

        this.tabs.push({ href: `${hrefBase}overview`, label: 'Overview', replaceHistory: true, pageTabTitle: `Overview - ${orgName}` });
        this.tabs.push({ href: `${hrefBase}clients`, label: `${clientStudentCapital}s`, replaceHistory: true, pageTabTitle: `${clientStudentCapital}s - ${orgName}` });
        if (this.plMay.isCustomer(currentUser)) {
            this.tabs.push({ href: `${hrefBase}assessments`, label: 'Assessments', pageTabTitle: `Assessments - ${orgName}` });
        }
        if (userCanViewProviders) this.tabs.push(providersTab);
        this.tabs.push({ href: `${hrefBase}contacts`, label: 'School Staff', replaceHistory: true, pageTabTitle: `School Staff - ${orgName}` });
        this.tabs.push({ href: `${hrefBase}documents`, label: 'Documents', replaceHistory: true, pageTabTitle: `Documents - ${orgName}` });
        this.tabs.push({ href: `${hrefBase}handbook`, label: 'Organization Handbook', replaceHistory: true, pageTabTitle: `Handbook - ${orgName}` });
        this.tabs.push({ href: `${hrefBase}availability`, label: 'Availability', replaceHistory: true, pageTabTitle: `Availability - ${orgName}` });

    }
}
