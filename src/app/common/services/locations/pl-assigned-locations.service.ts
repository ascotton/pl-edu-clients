import { Injectable } from '@angular/core';
import { PLGraphQLService, PLLodashService } from '@root/index';
import { Observable, Observer } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { PLLocationsOrgsMapping } from './pl-locations-orgs-mapping';
import { PLLocation, nodeToLocation } from './pl-location';
import { PLAssignedLocationsResults } from './pl-assigned-locations-results';

interface QueryParameters {
    accountCam?: string;
    after?: string;
    first?: number;
    id_In?: string;
    isActive?: boolean;
    name_Icontains?: string;
    offset?: number;
    orderBy?: string;
    organizationId_In?: string;
}

interface QueryResults extends PLAssignedLocationsResults {
    pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
    };
}

// tslint:disable-next-line: no-require-imports
const LOCATIONS_QUERY = require('./queries/locations.graphql');

// Re-export for the convenience of consumers
export { PLAssignedLocationsResults };

@Injectable()
export class PLAssignedLocationsService {
    constructor(private plGraphQL: PLGraphQLService, private lodash: PLLodashService) {}

   /**
     * Returns GraphQL observable for fetching locations and their organizations.
     *
     * Note: by default, this observable only emits active locations.
     */
    getLocations(params: QueryParameters = {}): Observable<PLAssignedLocationsResults> {
        const paramsWithDefaults = { ...{ isActive: true }, ...params };

        return this.queryLocations(paramsWithDefaults).pipe(
            map((results: QueryResults) => this.lodash.pick(results, 'locations', 'filteredTotalCount')),
        );
    }

    /**
     * Returns an observable that emits once, and includes all active locations
     * assigned to the logged-in user, and then it completes.
     *
     * Under the hood it recursively makes several calls to fetch the paginated
     * locations data.
     */
    getAllLocationsOnce(params: QueryParameters = {}): Observable<PLAssignedLocationsResults> {
        const all: PLAssignedLocationsResults = { locations: [], filteredTotalCount: 0 };

        return new Observable<PLAssignedLocationsResults>((observer: Observer<PLAssignedLocationsResults>) => {
            const fetch = (fetchParams: QueryParameters) => {
                this.queryLocations(fetchParams, { tryCache: true }).pipe(first()).subscribe({
                    next: (results: QueryResults) => {
                        // Concatenate locations with previous calls' results
                        all.locations = [...all.locations, ...results.locations];
                        all.filteredTotalCount = results.filteredTotalCount;

                        if (results.pageInfo.hasNextPage) {
                            fetch({ ...fetchParams, ...{ after: results.pageInfo.endCursor } });
                        } else {
                            observer.next(all);
                            observer.complete();
                        }
                    },
                    error: (error: any) => observer.error(error),
                });
            };

            // Initiate the first query. isActive can be overwritten by params. Pagination parameters are forced.
            fetch({ ...{ isActive: true }, ...params, ...{ first: 1000, after: null } });
        });
    }

    getAllLocationsOnceAsMapping(params: QueryParameters = {}): Observable<PLLocationsOrgsMapping> {
        return this.getAllLocationsOnce(params).pipe(
            map(results => new PLLocationsOrgsMapping(results.locations)),
        );
    }

    private queryLocations(
        params: QueryParameters,
        options: { tryCache: boolean } = { tryCache: false },
    ): Observable<QueryResults> {
        const queryOptions = options.tryCache ? { fetchPolicy: 'cache-first' } : {};

        return this.plGraphQL.query(LOCATIONS_QUERY, params, {}, queryOptions).pipe(
            map((results: any) => ({
                locations: results.locations.map(nodeToLocation),
                filteredTotalCount: results.locations_totalCount,
                pageInfo: results.locations_pageInfo, // hasNextPage = false;
            })),
        );
    }
}
