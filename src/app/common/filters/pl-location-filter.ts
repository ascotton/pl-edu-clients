import { first } from 'rxjs/operators';
import { PLMultiSelectApiFilter } from './pl-multi-select-api-filter';
import {
    PLAssignedLocationsService,
    PLAssignedLocationsResults,
} from '../services/locations/pl-assigned-locations.service';
import { PLLocationsOrgsMapping } from '../services/locations/pl-locations-orgs-mapping';

export class PLLocationFilter implements PLMultiSelectApiFilter {
    value: string;
    label: string;

    modelOptions: any[] = [];
    optionsLimitedText = '';
    placeholder = '';
    searchLoading = false;
    selectOptsMultiApi: any[] = [];
    selectOptsMultiApiTotalCount: number;
    textArray: string[] = [];
    readonly type = 'multiSelectApi';

    private readonly maxSearchResults = 30;
    private accountsManagedByUser = '';
    private orgsDomain: string[] = [];
    private searchTerm = '';

    constructor(
        options: { value: string, label: string, placeholder?: string },
        private plLocationService: PLAssignedLocationsService,
    ) {
        this.value = options.value;
        this.label = options.label;

        this.placeholder = options.placeholder || this.placeholder;
    }

    clearSelection(): void {
        this.textArray = [];
    }

    /**
     * updateModelOptions - fetch locations by ID to show name of ID in filter
     * dropdown. Ignore accountsManagedByUser parameter: assume IDs are appropriate
     * since they are explicit.
     */
    updateModelOptions(modelValues: string[]): void {
        const vars: any = {
            id_In: modelValues.join(','),
        };

        this.plLocationService.getLocations(vars).pipe(first()).subscribe((results: PLAssignedLocationsResults) => {
            const locationsMapping = new PLLocationsOrgsMapping(results.locations);
            this.modelOptions = locationsMapping.getLocationOptions();
        });
    }

    limitByParentOrganizations(orgIDs: string[]) {
        this.orgsDomain = orgIDs;
    }

    /*
     * setAccountsManagedByUser - if a non-empty string, the query to the
     * locations service will include accountCam filter for this userId.
     */
    setAccountsManagedByUser(userId: string): void {
        this.accountsManagedByUser = userId;
    }

    setOptionsSearchTerm(searchTerm: string): void {
        this.searchTerm = searchTerm;
    }

    updateOptions(): void {
        this.searchLoading = true;

        const vars: any = {
            ...this.accountsManagedByUserParams(),
            name_Icontains: this.searchTerm,
            organizationId_In: this.orgsDomain.join(','),
            orderBy: 'name',
            first: this.maxSearchResults,
        };

        this.plLocationService.getLocations(vars).pipe(first()).subscribe((results: PLAssignedLocationsResults) => {
            const locationsMapping = new PLLocationsOrgsMapping(results.locations);

            this.selectOptsMultiApi = locationsMapping.getLocationOptions();
            this.selectOptsMultiApiTotalCount = results.filteredTotalCount;
            this.searchLoading = false;
        });
    }

    private accountsManagedByUserParams(): { accountCam?: string } {
        return this.accountsManagedByUser ? { accountCam: this.accountsManagedByUser } : {};
    }
}
