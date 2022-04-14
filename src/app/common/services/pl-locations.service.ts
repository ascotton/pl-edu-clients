import { Injectable } from '@angular/core';
import { PLHttpService, PLGraphQLService, PLLodashService } from '@root/index';
import { Subject, Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Option } from '@common/interfaces';

interface FetchLocationResults {
    totalCount: number;
    locations: {};
    organizations: {};
}

/**
 * Provides all locations and organizations assigned to the logged in user.
 *
 * @deprecated in favor of PLAssignedLocationsService and PLLocationsOrgsMapping
 * which provides a more straightforward subscription interface and replicates
 * functions of this class.
 */
@Injectable()
export class PLLocationsService {
    private organizationIndex: any = {};
    private organizationOpts: Option[] = [];

    private locationsObserver: any;

    private locationIndex: any = {};
    private locationOpts: Option[] = [];

    loadingLocations: boolean = false;
    locationsLoaded: boolean = false;

    constructor(private lodash: PLLodashService, private plGraphQL: PLGraphQLService) {
    }

    getLocationsData() {
        return new Observable((observer: any) => {
            this.locationsObserver = observer;
            this.locationsObserver.next(this);
        });
    }

    beginFetch() {
        this.loadingLocations = true;

        // We must do a re-assignment of organizationOpts & locationOpts in order to trigger the ngOnChanges
        // hook in the input select that they get bound to. Hence we create the 'options' arrays below
        // and set organizationOpts & locationOpts by assignment, rather than using push() calls.

        const fetchedOrganizations: any[] = [];
        const resultsSeed: FetchLocationResults = {
            totalCount: 0,
            locations: {},
            organizations: {},
        };
        const startTime = Date.now();
        this.fetchLocations(
            resultsSeed,
            (results: FetchLocationResults) => {
                const fetchTime = Date.now();

                const locOptions: any[] = [];
                for (const locId in results.locations) {
                    const loc = results.locations[locId];
                    loc.option = { value: loc.id, label: loc.name };
                    locOptions.push(loc.option);
                }
                this.labelSort(locOptions);
                this.locationOpts = locOptions;
                this.locationIndex = results.locations;

                const orgOptions: any[] = [];
                for (const orgId in results.organizations) {
                    const org = results.organizations[orgId];
                    org.option = { value: org.id, label: org.name };
                    orgOptions.push(org.option);
                }
                this.labelSort(orgOptions);
                this.organizationOpts = orgOptions;
                this.organizationIndex = results.organizations;

                this.loadingLocations = false;
                this.locationsLoaded = true;
                if (this.locationsObserver) {
                    this.locationsObserver.next(this);
                }
            },
            '',
        );
    }

    getLocationCount() {
        return this.locationOpts.length;
    }

    getOrganizationCount() {
        return this.organizationOpts.length;
    }

    getLocationOptions() {
        return this.locationOpts.slice(0);
    }

    getOrganizationOptions() {
        return this.organizationOpts.slice(0);
    }

    getLocationForID(id: string) {
        return this.locationIndex[id];
    }
    getLocationNameForID(id: string) {
        return this.locationIndex[id].name;
    }

    getOrganizationForID(id: string) {
        return this.organizationIndex[id];
    }

    getOrganizationNameForID(id: string) {
        return this.organizationIndex[id].name;
    }

    private labelSort(arrayToSort: Option[]) {
        this.lodash.sort2d(arrayToSort, 'label');
    }

    getLocationOptionsForParentOrg(parentOrgId: string) {
        if (parentOrgId === null) {
            return this.locationOpts.slice(0);
        } else {
            const locIds = this.organizationIndex[parentOrgId].children;
            if (locIds) {
                const options: any[] = [];
                locIds.forEach((locID: any) => {
                    const loc = this.locationIndex[locID];
                    options.push(loc.option);
                });
                this.labelSort(options);
                return options.slice(0);
            } else {
                return [];
            }
        }
    }

    getOrganizationOptionsByLabel(labelSearchTerm: string): Option[] {
        const bySearchTerm = (org: any) => org.label.toLowerCase().includes(labelSearchTerm.toLowerCase());

        return this.getOrganizationOptions().filter(bySearchTerm);
    }

    getOrganizationOptionsByIDs(orgIDs: string[]) {
        return orgIDs.map(id => ({ label: this.getOrganizationNameForID(id), value: id }));
    }

    private fetchLocations(
        results: FetchLocationResults,
        callback: (results: FetchLocationResults) => any,
        cursor: string,
    ) {
        /**
         * @deprecated special loadAllLocations query and location.parent have have
         * been deprecated in api-workplace.
         */
        this.plGraphQL
            .query(
                `
                    query loadAllLocations($first: Int!, $after: String) {
                     locations(first: $first, after: $after) {
                      totalCount
                      pageInfo {
                        endCursor
                        hasNextPage
                      }
                       edges {
                         node {
                          name
                          id
                          state
                          parent {
                            id
                            name
                          }
                         }
                       }
                     }
                    }
                `,
                { first: 100, after: cursor }, {}, {'fetchPolicy': 'cache-first'},
            )
            .subscribe((res: any) => {
                const locations: any[] = res.locations;
                results.totalCount = res.locations_totalCount;
                for (const location of locations) {
                    if (location.parent) {
                        results.locations[location.id] = {
                            name: location.name,
                            id: location.id,
                            state: location.state,
                            parentId: location.parent.id,
                        };
                        if (results.organizations[location.parent.id]) {
                            results.organizations[location.parent.id].children.push(location.id);
                        } else {
                            results.organizations[location.parent.id] = {
                                name: location.parent.name,
                                id: location.parent.id,
                                children: [location.id],
                            };
                        }
                    }
                }
                if (res.locations_pageInfo.hasNextPage && res.locations_pageInfo.endCursor) {
                    this.fetchLocations(results, callback, res.locations_pageInfo.endCursor);
                } else {
                    callback(results);
                }
            });
    }
}
