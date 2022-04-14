import { Observable, ReplaySubject } from 'rxjs';
import { first } from 'rxjs/operators';

import {
    PLAssignedLocationsService,
    PLLocationsOrgsMapping,
} from '../services/';
import { PLMultiSelectApiFilter } from './pl-multi-select-api-filter';

export class PLOrganizationFilter implements PLMultiSelectApiFilter {
    value: string;
    label: string;

    modelOptions: any[] = [];
    searchLoading = false;
    selectOptsMultiApi: any[] = [];
    selectOptsMultiApiTotalCount: number;
    textArray: string[] = [];
    readonly type: 'multiSelectApi';

    private accountsManagedByUser = '';
    private organizations: any[] = [];
    private searchTerm = '';

    private selectedIDsSubject: ReplaySubject<string[]> = new ReplaySubject(1);

    constructor(options: { value: string, label: string }, private locationsService: PLAssignedLocationsService) {
        this.value = options.value;
        this.label = options.label;
    }

    /**
     * Returns obervable that emits location mapping and then completes.
     */
    private locationsMapping(params: any = {}): Observable<PLLocationsOrgsMapping> {
        return this.locationsService.getAllLocationsOnceAsMapping(params).pipe(first());
    }

    clearSelection(): void {
        this.textArray = [];
        this.selectedIDsSubject.next([]);
    }

    selectedIDs(): Observable<string[]> {
        return this.selectedIDsSubject;
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

    updateOptions() {
        const maxOrgCount = 30;
        const searchTerm = this.searchTerm;

        this.searchLoading = true;

        this.locationsMapping(this.accountsManagedByUserParams()).subscribe((locations) => {
            const orgs = locations.getOrganizationOptionsByLabel(searchTerm.trim());

            this.selectOptsMultiApi = orgs.slice(0, maxOrgCount);
            this.selectOptsMultiApiTotalCount = orgs.length;

            this.searchLoading = false;
        });
    }

    updateModelOptions(modelValues: string[]): void {
        this.locationsMapping().subscribe((locations) => {
            this.modelOptions = locations.getOrganizationOptionsByIDs(modelValues);

            this.selectedIDsSubject.next(modelValues);
        });
    }

    private accountsManagedByUserParams(): { accountCam?: string } {
        return this.accountsManagedByUser ? { accountCam: this.accountsManagedByUser } : {};
    }
}
