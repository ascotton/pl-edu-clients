import { first } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';

import { PLTableFilter, PLGraphQLService } from '@root/index';
import { PLSubNavigationTabs } from '@root/src/app/common/interfaces/pl-sub-navigation-tabs';

@Component({
    selector: 'pl-organizations-list',
    templateUrl: './pl-organizations-list.component.html',
    styleUrls: ['./pl-organizations-list.component.less'],
})
export class PLOrganizationsListComponent implements OnInit {
    filterSelectOpts: PLTableFilter[] = [];
    total = 0;
    loading = false;
    organizations: any[] = [];
    tabs: PLSubNavigationTabs[] = [
        {
            href: `/locations/list`,
            label: 'Locations',
            replaceHistory: true,
        },
        {
            href: `/organization/list`,
            label: `Organizations`,
            replaceHistory: true,
        },
    ];

    constructor(
        private plGraphQL: PLGraphQLService,
    ) { }

    ngOnInit() {
        this.filterSelectOpts = [
            { value: 'name_Icontains', label: 'Organization', defaultVisible: true },
        ];
    }

    onQuery({ query }: { query: any }) {
        this.loading = true;
        this.organizations = [];

        query.offset = (query.page - 1) * query.first;

        this.plGraphQL
            .query(GQL_ORGANIZATIONS, query, { debug: false })
            .pipe(first())
            .subscribe(
                (results: any) => {
                    this.organizations = results.organizations;
                    this.total = results.organizations_totalCount;

                    this.loading = false;
                },
            );
    }
}

// TODO: I will like to move this into a service some kind of gql builder
const GQL_ORGANIZATIONS = `
    query organizations($first: Int!, $offset: Int, $orderBy: String, $name_Icontains: String) {
        organizations(includeProspects: true, excludeIfHasVirtualLocation: true, first: $first, offset: $offset, orderBy: $orderBy, name_Icontains: $name_Icontains) {
            totalCount
            edges {
                node {
                    id
                    name
                    accountCam {
                        firstName
                        lastName
                    }
                }
            }
        }
    }
`;
