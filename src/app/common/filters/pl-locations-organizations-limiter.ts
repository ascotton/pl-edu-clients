import {
    PLLocationFilter,
    PLOrganizationFilter,
} from './';

interface Options {
    accountsManagedByUserFilterKey?: string;
    accountsManagedByUser?: string;
}

/*
    Creates dependent behavior between an organizations filter and a locations
    filter. Optionally, both filters can be tied to a filter to only include
    the current user's managed accounts.

    When an organizations filter updates its selected organizations,
    the locations filter will be limited by those organization ids.

    A filter for including only managed accounts will also update organization
    and location filters.
*/
export class PLLocationsOrganizationsLimiter {
    private isInitialQuery = true;
    // Query parameter key for managed accounts only filter
    private accountsManagedByUserFilterKey: string;
    private previousOrgsQueryParams: string = null;
    private previousAccountsManagedByUserFilterParam = '';

    constructor(
        private locationsFilter: PLLocationFilter,
        private orgsFilter: PLOrganizationFilter,
        options: Options = {},
    ) {
        orgsFilter.selectedIDs().subscribe((orgIDs: string[]) => {
            locationsFilter.limitByParentOrganizations(orgIDs);
            locationsFilter.optionsLimitedText = orgIDs.length > 0 ? '(Limited by selected organizations)' : '';
            locationsFilter.updateOptions();
        });

        this.accountsManagedByUserFilterKey = options.accountsManagedByUserFilterKey || '';

        if (options.accountsManagedByUser) {
            locationsFilter.setAccountsManagedByUser(options.accountsManagedByUser);
            orgsFilter.setAccountsManagedByUser(options.accountsManagedByUser);
        }
    }

    /*
        Call during table framework query handling to clear the locations or orgs
        filter selections.

        Returns query parameters, clearing the locations filter or orgs filter values
        if they need to be reset.
    */
    onQuery(query: any): any {
        // Will be modify and return filteredQuery
        const filteredQuery = { ...query };
        const accountsManagedByUser = this.accountsManagedByUser(query);
        const orgsFilterParam = query[this.orgsFilter.value];
        const changes = {
            accountsManagedByUser: accountsManagedByUser !== this.previousAccountsManagedByUserFilterParam,
            orgsFilterValue: orgsFilterParam !== this.previousOrgsQueryParams,
        };

        this.locationsFilter.setAccountsManagedByUser(accountsManagedByUser);
        this.orgsFilter.setAccountsManagedByUser(accountsManagedByUser);

        // Only clear the locations filter when the list of selected orgs has changed or
        // accountsManagedByUser has changed.
        if (!this.isInitialQuery) {
            // Reset the orgs filter if managedAccountsOnly changed.
            if (changes.accountsManagedByUser) {
                this.orgsFilter.clearSelection();
                this.orgsFilter.updateOptions();
                filteredQuery[this.orgsFilter.value] = '';
            }

            // Resets the locations filter if accountsManagedByUser or orgs filter changed.
            // Don't manually update options for location filter here. Clearing the org IDs
            // above will cause location filter options to be updated by virtue of the
            // selectedIDs() subscription created in the constructor.
            if (changes.accountsManagedByUser || changes.orgsFilterValue) {
                this.locationsFilter.clearSelection();
                filteredQuery[this.locationsFilter.value] = '';
            }
        }

        this.isInitialQuery = false;
        this.previousOrgsQueryParams = orgsFilterParam;
        this.previousAccountsManagedByUserFilterParam = accountsManagedByUser;

        return filteredQuery;
    }

    /*
     * accountsManagedByUser - extract the user ID for the accounts managed by
     * user param from a query object.
     */
    private accountsManagedByUser(query: any): string {
        const key = this.accountsManagedByUserFilterKey;

        return (key && query[key]) || '';
    }
}
