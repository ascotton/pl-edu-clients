import { Component, OnDestroy, OnInit } from '@angular/core';

import { first } from 'rxjs/operators';

import { PLBrowserService, PLGraphQLService } from '@root/index';

import { PLOrganizationsService } from '../pl-organizations.service';

@Component({
    selector: 'pl-organization-contacts',
    templateUrl: './pl-organization-contacts.component.html',
    styleUrls: ['./pl-organization-contacts.component.less'],
})
export class PLOrganizationContactsComponent implements OnInit, OnDestroy {
    private organizationId = '';
    private orgSubscription: any = null;

    isReady = false;
    sfAccountId: string;
    organization: any;
    locations: any[] = [];

    constructor(
        private plOrganizationsService: PLOrganizationsService,
    ) {
    }

    ngOnInit(): void {
        this.orgSubscription = this.plOrganizationsService.currentOrgDetails().subscribe((org: any) => {
            this.organizationId = org.id;

            this.organization = org;
            this.sfAccountId = org.sfAccountId;
            this.isReady = false;
            this.locations = [];

            // get locations
            const params = { orderBy: 'name' };
            this.plOrganizationsService
                .locationsByOrgId(this.organizationId, params)
                .pipe(first())
                .subscribe((res: any) => {
                    for (const l of res.locations) this.locations.push(l);

                    this.isReady = true;
                });
        });
    }

    ngOnDestroy(): void {
        this.orgSubscription.unsubscribe();
    }
}
