import {
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';

import { PLTableFilter } from '@root/index';

import { PLOrganizationsService } from '../pl-organizations.service';

@Component({
    selector: 'pl-organization-overview',
    templateUrl: './pl-organization-overview.component.html',
    styleUrls: ['../../../common/less/app/card-section.less', './pl-organization-overview.component.less'],
})
export class PLOrganizationOverviewComponent implements OnDestroy, OnInit {
    org: any;
    orgId: string;

    filteredLocationsTotal = 0;
    readonly filterSelectOpts: PLTableFilter[] = [{ value: 'name_Icontains', label: 'Location', defaultVisible: true }];
    locationsLoading = false;
    locations: any[] = [];

    private orgSubscription: any = null;
    private orgIdSubscription: any = null;

    constructor(private service: PLOrganizationsService) { }

    ngOnInit(): void {
        this.orgIdSubscription = this.service.currentOrgId().subscribe((orgId: string) => {
            this.orgId = orgId;
        });

        this.orgSubscription = this.service.currentOrgOverview().subscribe((org: any) => {
            this.org = org;
            this.org.isLocation = false;
        });
    }

    ngOnDestroy(): void {
        this.orgSubscription.unsubscribe();
        this.orgIdSubscription.unsubscribe();
    }

    onQuery({ query }: any): void {
        // For legibility
        // tslint:disable-next-line: interface-over-type-literal
        type locationResult = { locations: any[], totalCount: number };

        this.locationsLoading = true;

        query.offset = (query.page - 1) * query.first;

        // Assumes that org is loaded. Guarded by template check around table
        // component for this.org being defined.
        this.service.locationsByOrgId(this.orgId, query).subscribe(({ locations, totalCount }: locationResult) => {
            this.locations = locations;
            this.filteredLocationsTotal = totalCount;

            this.locationsLoading = false;
        });
    }
}
