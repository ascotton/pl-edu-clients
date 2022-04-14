import { Component } from '@angular/core';

import { PLTableFilter, PLMayService } from '@root/index';

import { PLOrganizationFilter, PLOrganizationFilterFactory, PLLocationsOrganizationsLimiter } from '@common/filters';

import { PLAssignedLocationsService } from '@common/services';

import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { PLSubNavigationTabs } from '@root/src/app/common/interfaces/pl-sub-navigation-tabs';

@Component({
    selector: 'pl-locations-list',
    templateUrl: './pl-locations-list.component.html',
    styleUrls: ['./pl-locations-list.component.less'],
})
export class PLLocationsListComponent {
    filterSelectOpts: PLTableFilter[] = [];
    filteredLocationsTotal = 0;
    loading = false;
    locations: any[] = [];
    showTabs = false;
    tabs: PLSubNavigationTabs[] = [
        { 
            href: `/location/list`, 
            label: 'Locations', 
            replaceHistory: true,
        },
        { 
            href: `/organization/list`, 
            label: `Organizations`, 
            replaceHistory: true,
        },
    ];

    private orgFilter: PLOrganizationFilter;

    constructor(
        private store: Store<AppStore>,
        private plMay: PLMayService,
        private service: PLAssignedLocationsService,
        private plOrgFilterFactory: PLOrganizationFilterFactory,
    ) {
        this.orgFilter = Object.assign(
            plOrgFilterFactory.create({ value: 'organizationId_In', label: 'Organizations' }),
            { defaultVisible: true },
        );

        this.filterSelectOpts = [
            this.orgFilter,
            { value: 'name_Icontains', label: 'Locations', defaultVisible: true },
            { value: 'accountCam_Icontains', label: 'Clinical Account Manager', defaultVisible: true },
        ];
    }

    ngOnInit(): void {
        this.store.select('currentUser').subscribe((user: any) => {
            if (user.groups) this.showTabs = user.is_superuser || this.plMay.isAdminType(user);
        });
    }

    filtersSetModelOptions({ filterValue, modelValues }: { filterValue: string; modelValues: string[] }) {
        if (filterValue === this.orgFilter.value) {
            this.orgFilter.updateModelOptions(modelValues);
        }
    }

    filtersSearch({ value, filterValue }: { value: string; filterValue: string }) {
        if (filterValue === this.orgFilter.value) {
            this.orgFilter.setOptionsSearchTerm(value);
            this.orgFilter.updateOptions();
        }
    }

    onQuery({ query }: { query: any }) {
        this.loading = true;
        this.locations = [];

        query.offset = (query.page - 1) * query.first;

        if (query.orderBy === 'organization_name') query.orderBy = 'organization_name,name';

        this.service.getLocations(query).subscribe((results: { locations: any[]; filteredTotalCount: number }) => {
            this.locations = results.locations;
            this.filteredLocationsTotal = results.filteredTotalCount;

            this.loading = false;
        });
    }

    showOrgLink(location: any): boolean {
        return location.organizationId && !location.isVirtual;
    }
}
