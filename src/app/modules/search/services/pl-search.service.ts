import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, first } from 'rxjs/operators';

import {
    PLGraphQLService,
} from '@root/index';
import {
    PL_SEARCH_CATEGORY,
    PLLocationSearch,
    PLClientSearch,
    PLProviderSearch,
    PLSearchResult,
    PLOrganizationSearch,
} from '../models';

@Injectable()
export class PLSearchService {

    private buildQuery<T>(
        queryName: string,
        catalog: string,
        fields: string[],
        queryParams?: string,
        formater?: Function,
        limitedTo?: number,
        page?: number,
    ): Observable<{ results: T, totalCount: number }> {
        const query = `query ${queryName} { ${ this.buildListQuery(catalog, fields, queryParams, page, limitedTo) } }`;
        return this.plGraphQL.query(query).pipe(
            map(data => ({
                results: formater ? formater(data[catalog]) : data[catalog],
                totalCount: data[`${catalog}_totalCount`],
            })),
            first(),
        );
    }

    private buildListQuery(catalog: string, fields: string[], queryParams = '', page = 0, limit?: number): string {
        let params = queryParams;
        if (limit) {
            params = `${params}first:${limit} `;
            params = `${params}offset:${page * limit} `;
        }
        if (params) {
            params = `(${params})`;
        }
        const edges = fields.length >  0 ? `edges { node { ${fields.join(',')} } }` : '';
        return `${catalog}${params} {
            totalCount ${edges}
        }`;
    }

    buildLocation(location: PLLocationSearch, lastViewed?: Date): PLSearchResult {
        const { id: uuid, name, organizationName: other } = location;
        return {
            uuid,
            name,
            other,
            lastViewed,
            link: `/location/${uuid}`,
            type: PL_SEARCH_CATEGORY.Location,
        };
    }

    buildOrganization(organization: PLOrganizationSearch, lastViewed?: Date): PLSearchResult {
        const { id: uuid, name } = organization;
        return {
            uuid,
            name,
            lastViewed,
            link: `/organization/${uuid}`,
            type: PL_SEARCH_CATEGORY.Organization,
        };
    }

    buildClient(client: PLClientSearch, lastViewed?: Date): PLSearchResult {
        const { id: uuid, firstName, lastName, locations } = client;
        return {
            uuid,
            lastViewed,
            name: `${firstName} ${lastName}`,
            initials: `${firstName[0]}${lastName[0]}`,
            other: locations[0].name, // Does a client always has a location?
            link: `/client/${uuid}`,
            type: PL_SEARCH_CATEGORY.Client,
        };
    }

    buildProvider(provider: PLProviderSearch, lastViewed?: Date): PLSearchResult {
        const { id: uuid, user } = provider;
        return {
            uuid,
            lastViewed,
            name: `${user.firstName} ${user.lastName}`,
            initials: `${user.firstName[0]}${user.lastName[0]}`,
            link: `/provider/${user.id}/overview`,
            type: PL_SEARCH_CATEGORY.Provider,
        };
    }

    constructor(private plGraphQL: PLGraphQLService) { }

    getClientsCount(syCode: string): Observable<number> {
        return this.buildQuery<any>(
            'clientsCount',
            'clients',
            [],
            `schoolYearCode_In:"${syCode}" `).pipe(
                map(({ results }) => results.totalCount),
            );
    }

    searchClients(syCode: string, limit: number, page: number): Observable<{ results: PLSearchResult[], totalCount: number }> {
        return this.buildQuery<PLSearchResult[]>(
            'searchClients',
            'clients',
            [
                'id',
                'firstName',
                'lastName',
                this.buildListQuery('locations', ['name']),
            ],
            // TODO: Get Current School Year
            `excludeSandbox:true schoolYearCode_In:"${syCode}" `,
            (clients: any) => clients.map((item: any) => this.buildClient(item)),
            limit,
            page,
            );
    }

    searchProviders(limit: number, page: number): Observable<{ results: PLSearchResult[], totalCount: number }> {
        return this.buildQuery<PLSearchResult[]>(
            'searchProviders',
            'providerProfiles',
            [
                'id',
                'user { id, firstName, lastName }',
            ],
            `excludeSandbox:true `,
            (providers: any) => providers.map((item: any) => this.buildProvider(item)),
            limit,
            page);
    }

    searchLocations(limit: number, page: number): Observable<{ results: PLSearchResult[], totalCount: number }> {
        return this.buildQuery<PLSearchResult[]>(
            'searchLocations',
            'locations',
            [
                'id',
                'name',
                'organizationName',
            ],
            'isActive:true ',
            (locations: any) => locations.map((item: any) => this.buildLocation(item)),
            limit,
            page);
    }

    searchOrganizations(limit: number, page: number): Observable<{ results: PLSearchResult[], totalCount: number }> {
        return this.buildQuery<PLSearchResult[]>(
            'searchOrganizations',
            'organizations',
            [
                'id',
                'name',
            ],
            'isActive:true ',
            (organizations: any) => organizations.map((item: any) => this.buildOrganization(item)),
            limit,
            page);
    }
}
