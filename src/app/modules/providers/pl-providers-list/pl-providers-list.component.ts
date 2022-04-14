import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first, takeUntil } from 'rxjs/operators';

import { Store } from '@ngrx/store';

import { PLMayService, PLGraphQLService } from '@root/index';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLDestroyComponent } from '@root/src/app/common/components';

const providerProfilesQuery = require('../queries/provider-profiles.graphql');

@Component({
    selector: 'pl-providers-list',
    templateUrl: './pl-providers-list.component.html',
    styleUrls: ['./pl-providers-list.component.less'],
})
export class PLProvidersListComponent extends PLDestroyComponent implements OnInit {
    user: User;
    data: any[] = [];
    columns: any = [];
    plProvidersList: any = {
        providers: [],
        total: 0,
        currentPage: 0,
        pageSize: 25,
        loading: false,
    };
    filterSelectOpts: any[] = [
        {
            value: 'lastName_Icontains',
            label: 'Last Name',
            defaultVisible: true,
            placeholder: 'Type to filter..',
        },
        {
            value: 'firstName_Icontains',
            label: 'First Name',
            defaultVisible: true,
            placeholder: 'Type to filter..',
        },
        {
            value: 'providerType_Icontains',
            label: 'Provider Type',
            defaultVisible: false,
            placeholder: 'Select an item',
            selectOpts: this.formProviderTypeSelectOpts(),
        },
        {
            value: 'subStatus_Icontains',
            label: 'Sub-Status',
            defaultVisible: false,
            placeholder: 'Select an item',
            selectOpts: this.formStatusSelectOpts(),
        },
    ];

    constructor(
        private store: Store<AppStore>,
        private router: Router,
        private plMay: PLMayService,
        private plGraphQL: PLGraphQLService,
    ) {
        super();
    }

    ngOnInit(): void {
        this.store.select('currentUser')
            .pipe(takeUntil(this.destroyed$))
            .subscribe((user: User) => {
                this.user = user;
            });
    }

    onQuery(info: { query: any, queryId: string }) {
        const vars = Object.assign({}, info.query, {
            first: info.query.first,
            offset: info.query.offset,
            orderBy: info.query.orderBy,
            isActive: true,
            user_IsActive: true,
        });
        this.plProvidersList.pageSize = info.query.first;
        this.plProvidersList.currentPage = info.query.page;
        this.plProvidersList.loading = true;
        this.plGraphQL
            .query(providerProfilesQuery, vars, {})
            .pipe(first())
            .subscribe((res: any) => {
                this.data = res.providerProfiles ? this.formatProviders(res.providerProfiles) : [];
                this.plProvidersList.providers = this.data;
                this.plProvidersList.total = res.providerProfiles_totalCount;
                this.plProvidersList.loading = false;
            });
    }

    onRowClick(data: any) {
        if (data.user && data.user.id) {
            this.router.navigate(['/provider', data.user.id]);
        }
    }

    formProviderTypeSelectOpts() {
        return [
            { value: 'Speech-Language Pathologist', label: 'Speech-Language Pathologist' },
            { value: 'Occupational Therapist', label: 'Occupational Therapist' },
            { value: 'Mental Health Professional', label: 'Mental Health Professional' },
            { value: 'School Psychologist', label: 'School Psychologist' },
        ];
    }

    formStatusSelectOpts() {
        return [
            { value: 'Onboarding', label: 'Onboarding' },
            { value: 'Ready for Placement', label: 'Ready for Placement' },
            { value: 'Providing Services', label: 'Providing Services' },
        ];
    }

    shouldShowSubStatusRow(): boolean {
        return this.plMay.isAdminType(this.user) || this.plMay.isSuperuser(this.user);
    }

    private formatProviders(providers: any[]) {
        return providers.map((provider: any) => {
            let providerTypeLongName = ''

            if (provider && provider.providerTypes) {
                providerTypeLongName = provider.providerTypes.map((provider) => provider.longName).join(', ');
            }

            return Object.assign(provider, {
                xLastName: provider.user.lastName,
                xFirstName: provider.user.firstName,
                xProviderTypeName: providerTypeLongName,
            });
        });
    }
}
