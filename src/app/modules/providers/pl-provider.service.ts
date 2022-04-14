import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { map, first } from 'rxjs/operators';
import { Router } from '@angular/router';

import { User } from '@modules/user/user.model';
import { CurrentUserService } from '@modules/user/current-user.service';

import {
    PLBrowserService,
    PLMayService,
    PLGraphQLService,
    PLUrlsService,
} from '@root/index';

import * as providerQuery from './queries/provider.graphql';

@Injectable()
export class PLProviderService {
    private provider: any = {};
    private providerUserUuid = '';
    private currentUser: User;

    private tabs: any[] = [];
    private mayViewProvider = false;

    private getFromRouteSubject = new ReplaySubject();

    constructor(
        private router: Router,
        private plBrowser: PLBrowserService,
        private plMay: PLMayService,
        private plGraphQL: PLGraphQLService,
        private plUrls: PLUrlsService,
        private plCurrentUserService: CurrentUserService,
    ) { }

    getFromRoute() {
        const curUuid = this.router.url.split('/')[2];
        if (curUuid !== this.providerUserUuid) {
            this.providerUserUuid = curUuid;

            this.plCurrentUserService.getCurrentUser().subscribe((u: User) => {
                this.currentUser = u;
                this.getProvider()
                    .subscribe((res: any) => {
                        this.getFromRouteSubject.next({
                            provider: this.provider,
                            currentUser: this.currentUser,
                            mayViewProvider: this.mayViewProvider,
                        });
                    });
            });
        }

        return this.getFromRouteSubject.asObservable();
    }

    private providerTitle(provider: any): string {
        const providerTypes = provider && provider.providerTypes || [];

        return providerTypes.map((type: any) => type.longName).join(', ');
    }

    getProvider(providerUuid?: string) {
        return new Observable((observer: any) => {
            this.getProviderByUserId(providerUuid || this.providerUserUuid).subscribe((providerProfile: any) => {
                this.mayViewProvider = true;

                this.provider = this.formatProvider(providerProfile);
                this.provider.title = this.providerTitle(this.provider);

                observer.next({ provider: this.provider });
            });
        });
    }

    getProviderByUserId(userId: any) {
        return this.plGraphQL.query(providerQuery, { userId }, {}).pipe(
            map((obj: any) => obj.providerProfile),
            first(),
        );
    }

    formatProvider(provider: any) {
        if (provider.accountOwner == null) {
            provider.accountOwner = {};
        }
        return provider;
    }

    getTabs(currentUser: {firstName: string, lastName: string}) {
        const hrefBase = `/provider/${this.providerUserUuid}/`;
        const prefix = `${currentUser.firstName} ${currentUser.lastName} -`;
        const replaceHistory = { replaceHistory: true };

        this.tabs = [
            { replaceHistory, href: `${hrefBase}overview`, label: 'Overview', pageTabTitle: `${prefix} Overview` },
            { replaceHistory, href: `${hrefBase}caseload`, label: 'Caseload', pageTabTitle: `${prefix} Caseload` },
            { replaceHistory, href: `${hrefBase}locations`, label: 'Locations', pageTabTitle: `${prefix} Locations` },
        ];

        const mayViewProviderQuals = (
            this.provider.user.id === this.currentUser.uuid ||
            this.plMay.isAdminType(this.currentUser) ||
            this.plMay.isSuperuser(this.currentUser)
        );

        if (mayViewProviderQuals) {
            this.tabs.push(
                { replaceHistory, href: `${hrefBase}qualifications`, label: 'Qualifications', pageTabTitle: `${prefix} Qualifications` },
            );
        }

        const mayViewProvider = (this.provider.user.id === this.currentUser.uuid || (this.provider.user.permissions.viewSchedule));
        if (mayViewProvider) {
            const providerId = this.provider.user.id !== this.currentUser.uuid ? this.provider.user.id : '';
            this.tabs.push(
                { href: `/schedule/calendar/${providerId}`, label: 'Schedule' },
            );
        }

        const mayViewAssignments = (
            this.plMay.isSupport(this.currentUser) || this.plMay.isClinicalAccountManager(this.currentUser)
        );

        if (mayViewAssignments) {
            this.tabs.push(
                { href: `${hrefBase}assignments`, label: 'Assignments', replaceHistory: true },
            );
        }

        const mayViewAvailability = (
            this.plMay.isSupport(this.currentUser) || this.plMay.isClinicalAccountManager(this.currentUser)
        );

        if (mayViewAvailability) {
            this.tabs.push(
                { href: `${hrefBase}availability`, label: 'Availability', replaceHistory: true },
            );
        }

        return this.tabs;
    }
}
