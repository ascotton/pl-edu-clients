import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PLLodashService, PLGraphQLService, PLGQLQueriesService,
    PLTableFrameworkService, PLTableFrameworkUrlService } from '@root/index';

import {
    PLLocationFilter,
    PLLocationFilterFactory,
} from '@common/filters';

@Injectable()
export class PLSelectClientsTableService {

    filtersPrimary: any[] = [
        { value: 'fullName_Icontains', label: 'Client Name', placeholder: 'Search Client Name' },
    ];

    filtersSecondary: any[];

    private locationFilter: PLLocationFilter;

    constructor(private plLodash: PLLodashService,
                private plGraphQL: PLGraphQLService,
                private plGQLQueries: PLGQLQueriesService,
                private plTableFramework: PLTableFrameworkService,
                private plTableFrameworkUrl: PLTableFrameworkUrlService,
                plLocationsFilterFactory: PLLocationFilterFactory) {
        const locationFilterOptions = { value: 'locationId_In', label: 'Locations', placeholder: 'Locations' };
        this.locationFilter = plLocationsFilterFactory.create(locationFilterOptions);
        this.filtersSecondary = [this.locationFilter];
    }

    filtersSetModelOptions(evt: { filterValue: string, modelValues: string[] }) {
        if (evt.filterValue === this.locationFilter.value) {
            this.locationFilter.updateModelOptions(evt.modelValues);
        }
    }

    filtersSearch(evt: { value: string, filterValue: string }) {
        if (evt.filterValue === this.locationFilter.value) {
            this.locationFilter.setOptionsSearchTerm(evt.value);
            this.locationFilter.updateOptions();
        }
    }

    onQuery(info: { query: any }, tableStateName: string) {
        return new Observable((observer: any) => {
            const query = info.query;
            const params: any = query;

            if (tableStateName) {
                const queryParams = this.plTableFramework.getQueryParams(query);
                this.plTableFrameworkUrl.updateUrl(tableStateName, queryParams);
            }
            this.plGraphQL.query(
                `query ${this.plGQLQueries.queries.clientsListClients.cacheName}($first: Int!,
                 $orderBy: String, $fullName_Icontains: String, $locationId_In: String,
                 $schoolYearCode_In: String, $offset: Int) {
                    ${this.plGQLQueries.queries.clientsListClients.apiName}(first: $first, orderBy: $orderBy,
                    fullName_Icontains: $fullName_Icontains, locationId_In: $locationId_In,
                    schoolYearCode_In: $schoolYearCode_In, offset: $offset) {
                        totalCount
                        edges {
                            node {
                                id
                                firstName
                                lastName
                                externalId
                                birthday
                                referralMatchedCount
                                locations {
                                    edges {
                                        node {
                                            id
                                            name
                                            parent {
                                                id
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }`,
                params, {}).subscribe(
                 (res: any) => {
                     const clients: any[] = res.clients;
                     observer.next({
                         clients: this.formatClients(clients),
                         total: res.clients_totalCount,
                     });
                 });
        });

    }

    formatClients(clients: any[]) {
        clients.forEach((client: any) => {
            const location = (client.locations && client.locations[0]) ? client.locations[0] : {};
            const organization = (location && location.parent) ? location.parent : {};
            client.organizationName = organization.name ? organization.name : '';
            client.locationName = location.name ? location.name : '';
        });
        return clients;
    }

}
