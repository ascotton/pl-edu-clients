import { animate, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PLMultiSelectApiFilter } from '@root/src/app/common/filters';
import { PLAssessmentsTableFilters, PLAssessmentsTableService } from '../pl-assessments-table.service';

@Component({
    selector: 'pl-assessments-filters',
    templateUrl: './pl-assessments-filters.component.html',
    styleUrls: ['./pl-assessments-filters.component.less'],
    animations: [
        trigger('inOutAnimation', [
            transition(':enter', [
                style({ height: '0px', opacity: 0 }),
                animate('150ms', style({ height: '*', opacity: 1 })),
            ]),
            transition(':leave', [
                style({ height: '*', opacity: 1 }),
                animate('150ms', style({ height: '0px', opacity: 0 })),
            ]),
        ]),
    ],
})
export class PLAssessmentsFiltersComponent implements OnInit {
    @Input() hasFiltersVisible = true;

    @Output() filtersChange = new EventEmitter<any>();
    @Output() closeFilters = new EventEmitter<any>();

    filters: PLAssessmentsTableFilters;

    constructor(private assessmentsTableService: PLAssessmentsTableService) {}

    ngOnInit(): void {
        this.filters = {...this.assessmentsTableService.filters};
    }

    onFilterChange(filter: any, event: any): void {
        if (filter === 'organization') {
            this.assessmentsTableService.setLimitLocationFilterbyOrgs(this.filters[filter].textArray);
        }

        if (filter === 'accountCam') {
            this.assessmentsTableService.setLimitOrgFilterByCAMAccount(this.filters[filter].textArray.length > 0);
        }

        const filtersChanges = this.assessmentsTableService.formFilterChangesText();
        this.filtersChange.emit(filtersChanges);
    }

    onFilterSearch(filterValue: string, event?: any): void {
        this.apiFilters().filter(f => f.value === filterValue).forEach((filter) => {
            filter.setOptionsSearchTerm(event.value);
            filter.updateOptions();
        });
    }

    clearAllFilters(): void {
        const filtersToText = this.assessmentsTableService.clearAllFilters();
        this.filtersChange.emit(filtersToText);
    }

    shouldDisplayFilter(filterName: string): boolean {
        return this.assessmentsTableService.visibleFilters.includes(filterName);
    }

    onCloseFilters(): void {
        this.closeFilters.emit();
    }

    private apiFilters(): PLMultiSelectApiFilter[] {
        return [this.filters.location, this.filters.organization];
    }
}
