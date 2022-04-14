import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { PLTableFilter } from '@root/index';
import { User } from '@modules/user/user.model';
import { PLOrganizationFilter, PLOrganizationFilterFactory } from '@common/filters';
import { PLAccountHealthSummaryResults, PLCamAccountsService } from './pl-cam-accounts.service';
import { PLAccountHealthSummary } from './pl-account-health-summary';

@Component({
    selector: 'pl-cam-accounts',
    templateUrl: './pl-cam-accounts.component.html',
    styleUrls: ['./pl-cam-accounts.component.less'],
    providers: [PLCamAccountsService],
})
export class PLCamAccountsComponent implements OnChanges {
    @Input() schoolYearCode: string;
    @Input() currentUser: User;

    filterSelectOpts: PLTableFilter[] = [];
    // Values for hidden filters (e.g., School Year); updated by the table framework or this component
    readonly hiddenFilters: PLTableFilter[] = [{ value: 'schoolYearCode', label: '' }];

    // When resetting the org filter, use this counter to give it a new, unique value/key. (see resetFilters)
    orgFilterCount = 0;

    hiddenFilterValues: any = {};
    loading = true;
    accountSummaries: PLAccountHealthSummary[] = [];
    total = 0;

    private rowsExpanded: Set<PLAccountHealthSummary> = new Set();
    private rowsInDom: Set<PLAccountHealthSummary> = new Set();
    private rowsLoaded: Set<PLAccountHealthSummary> = new Set();
    private orgFilter: PLOrganizationFilter;

    constructor(
        private camAccountsService: PLCamAccountsService,
        private orgFilterFactory: PLOrganizationFilterFactory,
    ) {}

    ngOnChanges() {
        this.resetFilters();
    }

    filtersSetModelOptions({ filterValue, modelValues }: { filterValue: string, modelValues: string[] }) {
        if (filterValue === this.orgFilter.value) {
            this.orgFilter.updateModelOptions(modelValues);
        }
    }

    filtersSearch({ value, filterValue }: { value: string, filterValue: string }) {
        if (filterValue === this.orgFilter.value) {
            this.orgFilter.setOptionsSearchTerm(value);
            this.orgFilter.updateOptions();
        }
    }

    isRowLoaded(summary: PLAccountHealthSummary): boolean {
        return this.rowsLoaded.has(summary);
    }

    isRowExpanded(summary: PLAccountHealthSummary): boolean {
        return this.rowsExpanded.has(summary);
    }

    isRowInDom(summary: PLAccountHealthSummary): boolean {
        return this.rowsInDom.has(summary);
    }

    onAccountDetailsLoaded(summary: PLAccountHealthSummary): void {
        this.rowsLoaded.add(summary);
    }

    toggleExpanded(summary: PLAccountHealthSummary): void {
        if (this.isRowExpanded(summary)) {
            this.rowsExpanded.delete(summary);
        } else {
            this.rowsExpanded.add(summary);
            this.rowsInDom.add(summary);
        }
    }

    private resetFilters(): void {
        // Changing this value will trigger an onQuery event from the table framework; it's
        // like a filter was updated through the UI.
        this.hiddenFilterValues = { schoolYearCode: this.schoolYearCode };

        /*
            Generate a new key for the org filter.

            PLTableFiltersTopComponent stores the previous values for each filter in its
            initedFilterValues field. When we change the filters from within this method,
            it detects a change to its Inputs (as we would expect). As a part of responding to that
            change, through PLTableFiltersTopComponent.setFiltersFromUpdate, it triggers the
            event that calls filtersSetModelOptions with the previous value for each selectApiFilter.

            By changing the name of the org filter, we prevent calls to filtersSetModelOptions from
            re-setting the filter value when it should remain cleared.
        */
        this.orgFilter = Object.assign(
            this.orgFilterFactory.create({
                value: `org-filter-${this.orgFilterCount++}`,
                label: 'Organizations',
            }),
            { defaultVisible: true },
        );

        // Only include organizations managed by this CAM
        this.orgFilter.setAccountsManagedByUser(this.currentUser.uuid);

        this.filterSelectOpts = [
            this.orgFilter,
            {
                value: 'fulfillmentPercentageLte',
                label: 'Fulfillment Upper Limit',
                text: '', // value of filter selection defaults to no filter
                defaultVisible: true,
                selectOpts: [
                    { value: '70', label: '70%' },
                    { value: '80', label: '80%' },
                    { value: '90', label: '90%' },
                    { value: '100', label: '100%' },
                ],
            },
        ];
    }

    onQuery(params: any): void {
        this.loading = true;

        const queryParams = {
            schoolYearCode: this.schoolYearCode,
            // Exclude fulfillmentPercentageLte if value is empty
            ...(params.fulfillmentPercentageLte ? { fulfillmentPercentageLte: +params.fulfillmentPercentageLte } : {}),
            // Exclude org filter if value is empty; use dynamic key to access parameter
            ...(params[this.orgFilter.value] ? { organizationIds: params[this.orgFilter.value].split(',') } : {}),
        };

        this.camAccountsService.getHealthSummaries(queryParams).subscribe((results) => {
            this.accountSummaries = results.summaries;
            this.rowsExpanded = new Set();
            this.rowsInDom = new Set();
            this.rowsLoaded = new Set();
            this.total = results.total;
            this.loading = false;
        });
    }
}
