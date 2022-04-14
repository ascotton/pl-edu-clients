import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import {
    PLUrlsService,
} from '@root/index';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

import { PLProviderProfile } from '@common/interfaces';
import { PLProvidersListService } from '@common/services';
import { PLOrganizationsService } from '../pl-organizations.service';

@Component({
    selector: 'pl-organization-providers',
    templateUrl: './pl-organization-providers.component.html',
    styleUrls: ['./pl-organization-providers.component.less'],
})
export class PLOrganizationProvidersComponent {
    organizationId = '';
    private orgIdSubscription: any = null;
    private currentUserSubscription: Subscription = null;

    mayViewRoom = false;
    providers: PLProviderProfile[] = [];
    urls: any = {};
    total: number;
    pageSize: number;
    private tableQueryCache: any = null;
    loading = false;
    readonly orderKey: string = 'orderBy';
    readonly pageSizeKey: string = 'first';
    private currentUser: User;

    readonly filterSelectOpts: any[] = [
        { value: 'lastName_Icontains', label: 'Last Name', defaultVisible: true },
        { value: 'firstName_Icontains', label: 'First Name', defaultVisible: true },
    ];

    constructor(
        private plUrls: PLUrlsService,
        private plOrganizationsService: PLOrganizationsService,
        private router: Router,
        private store: Store<AppStore>,
        private plProvidersListService: PLProvidersListService,
    ) {}

    ngOnInit(): void {
        this.orgIdSubscription = this.plOrganizationsService.currentOrgId().subscribe((orgId: string) => {
            this.organizationId = orgId;
            if (this.tableQueryCache) {
                this.onQuery({ query: this.tableQueryCache });
            }
        });

        this.currentUserSubscription = this.store.select('currentUser').subscribe((user: User) => {
            this.currentUser = user;
            this.checkPrivileges();
        });

        this.setUrls();
    }

    setUrls() {
        this.urls.room = this.plUrls.urls.roomFE;
    }

    checkPrivileges() {
        if (this.currentUser && this.currentUser.uuid) {
            this.mayViewRoom = this.currentUser.xEnabledUiFlags &&
            this.currentUser.xEnabledUiFlags.includes('room-view-room-url');
        }
    }

    ngOnDestroy(): void {
        this.orgIdSubscription.unsubscribe();
        this.currentUserSubscription.unsubscribe();
    }

    scheduleUrl(provider: any): string {
        return this.plProvidersListService.scheduleUrl(provider.user.id);
    }

    mayViewScheduleFor(provider: any): boolean {
        return this.plProvidersListService.mayViewScheduleFor(provider);
    }

    isScheduleColumnVisible(): boolean {
        return this.plProvidersListService.isScheduleColumnVisible(this.currentUser);
    }

    isPhoneColumnVisible(): boolean {
        return this.plProvidersListService.isPhoneColumnVisible(this.currentUser);
    }

    onQuery(info: { query: any }) {
        // Save in case organization not loaded yet and need to re-call later.
        this.tableQueryCache = info.query;
        if (this.organizationId) {
            this.loading = true;

            const params: any = Object.assign(info.query, {
                organizationId: this.organizationId,
                offset: (info.query.page - 1) * info.query.first,
            });

            // Close subscription after first emitted value with first()
            this.plOrganizationsService.providerProfiles(params).pipe(
                first(),
            )
            .subscribe((results: { providers: PLProviderProfile[], totalCount: number }) => {
                this.providers = results.providers;
                this.total = results.totalCount;
                this.loading = false;
            });
        }
    }

    clickRow(provider: any) {
        this.router.navigate(['/provider', provider.user.id]);
    }

    listProviderTypes(provider: any): string {
        const finalTypes = [];
        const types = provider.providerTypes;
        for (let i = 0; i < types.length; i++) {
            finalTypes.push(types[i]['longName']);
        }
        return finalTypes.join(', ');
    }
}
