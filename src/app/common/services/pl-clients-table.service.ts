import { Injectable } from '@angular/core';
import * as moment from 'moment';

import { Observable } from 'rxjs';

import {
    PLApiClientsService,
    PLLodashService,
    PLGraphQLService,
    PLTableFrameworkService,
    PLTableFrameworkUrlService,
} from '@root/index';

import { PLClientIEPGoalsService } from '@modules/clients/pl-client-iep-goals/pl-client-iep-goals.service'

import {
     PLLocationFilter,
     PLLocationFilterFactory,
     PLOrganizationFilter,
     PLOrganizationFilterFactory,
     PLMultiSelectApiFilter,
     PLLocationsOrganizationsLimiter,
 } from '../filters';
import { first } from 'rxjs/operators';
import { PLSchoolYearsService } from './pl-school-years.service';
import { ActivatedRoute } from '@angular/router';

const clientListClientQuery = require('./queries/client-list-client.graphql');

@Injectable()
export class PLClientsTableService {

    clients: any[] = [];
    total: number = 0;

    filterSelectOpts: any[] = [];

    private locationFilter: PLLocationFilter;
    private orgFilter: PLOrganizationFilter;
    private locationFilterLimiter: PLLocationsOrganizationsLimiter;

    constructor(
        private plLodash: PLLodashService,
        private plGraphQL: PLGraphQLService,
        private activatedRoute: ActivatedRoute,
        private plApiClients: PLApiClientsService,
        private yearsService: PLSchoolYearsService,
        private plTableFramework: PLTableFrameworkService,
        private plOrgFilterFactory: PLOrganizationFilterFactory,
        private plTableFrameworkUrl: PLTableFrameworkUrlService,
        private plLocationsFilterFactory: PLLocationFilterFactory,
    ) {
        this.orgFilter = this.plOrgFilterFactory.create({ value: 'organizationId_In', label: 'Organizations' });
        this.locationFilter = this.plLocationsFilterFactory.create({ value: 'locationId_In', label: 'Locations' });

        this.locationFilterLimiter = new PLLocationsOrganizationsLimiter(this.locationFilter, this.orgFilter);

        this.activatedRoute.url.pipe(first()).subscribe((urlRoute) => {
            const inStudentsClientsSubTab = urlRoute[0].path === 'all-clients';
            this.formFiltersToDisplayForClients(inStudentsClientsSubTab);
        });
    }

    formFiltersToDisplayForClients(inStudentsClientsSubTab: boolean) {
        this.filterSelectOpts = [
            { value: 'fullName_Icontains', label: 'Name', defaultVisible: true, class: 'client-name'},
            this.orgFilter,
            this.locationFilter,
        ];

        this.formStatusSelectOpts();
        if (inStudentsClientsSubTab) this.formSchoolYearsSelectOptions(); 
    }

    formStatusSelectOpts() {
        this.filterSelectOpts.push( { value: 'status_In', label: 'Status', type: 'multiSelect' });
        const index = this.plLodash.findIndex(this.filterSelectOpts, 'value', 'status_In');

        this.filterSelectOpts[index].selectOptsMulti = this.plApiClients.formStatusSelectOpts();
    }


    private matchingFilters(filterValue: string): PLMultiSelectApiFilter[] {
        return [this.locationFilter, this.orgFilter].filter(f => f.value === filterValue);
    }

    filtersSetModelOptions(evt: { filterValue: string, modelValues: string[] }) {
        this.matchingFilters(evt.filterValue).forEach((filter: PLMultiSelectApiFilter) => {
            filter.updateModelOptions(evt.modelValues);
        });
    }

    filtersSearch(evt: { value: string, filterValue: string }) {
        this.matchingFilters(evt.filterValue).forEach((filter: PLMultiSelectApiFilter) => {
            filter.setOptionsSearchTerm(evt.value);
            filter.updateOptions();
        });
    }

    onQuery(info: { query: any }, providerId: string, tableStateName: string) {
        return new Observable((observer: any) => {
            const query = this.locationFilterLimiter.onQuery(info.query);
            const params: any = query;

            if (tableStateName) {
                const queryParams = this.plTableFramework.getQueryParams(query);
                this.plTableFrameworkUrl.updateUrl(tableStateName, queryParams);
            }

            params.providerId = providerId || '';

            // TODO - this query can be made more efficient by ommitting referralMatchedCount
            // for non-caseload queries. When we implement Fragments, we should change this.
            this.plGraphQL.query(clientListClientQuery, params, {})
                .subscribe((res: any) => {
                    const clients: any[] = res.clients;
                    this.clients = this.formatClients(clients);
                    this.total = res.clients_totalCount;
                    observer.next({ clients: this.clients, total: this.total });
                });
        });

    }

    formatClients(clients: any[]) {
        clients.forEach((client: any) => {
            const location = (client.locations && client.locations[0]) ? client.locations[0] : {};
            const organization = (location && location.parent) ? location.parent : {};
            client.organizationName = organization.name ? organization.name : '';
            client.locationName = location.name ? location.name : '';
            client.status = client.statusDisplay;
            client.xRecentProvider = client.recentProvider ?
             `${client.recentProvider.firstName} ${client.recentProvider.lastName}`
             : '--';
            const activeIep = (client.activeIep && client.activeIep.type === PLClientIEPGoalsService.IEP_TYPE_IEP) ? client.activeIep : null;
            const triennialEvaluationDueDate = (activeIep && activeIep.nextEvaluationDate && moment(activeIep.nextEvaluationDate,
             'YYYY-MM-DD').format('MM/DD/YYYY')) || '--';
            const annualIepDueDate = (activeIep && activeIep.nextAnnualIepDate && moment(client.activeIep.nextAnnualIepDate,
             'YYYY-MM-DD').format('MM/DD/YYYY')) || '--';
            client.xDueDates = `${annualIepDueDate}, ${triennialEvaluationDueDate}`;
        });
        return clients;
    }

    /**
     * Function for building the options of the filter in charge of the `School Year`
     * Gets the years of the school years + gets the current school year.
     * This works only when in the url `/clients/all-clients`
     */
     private formSchoolYearsSelectOptions() {
        this.filterSelectOpts.push({ value: 'schoolYearCode_In', label: 'School Year', type: 'multiSelect', defaultVisible: true });
        const index = this.plLodash.findIndex(this.filterSelectOpts, 'value', 'schoolYearCode_In');

        this.yearsService.getCurrentSchoolYearCode().pipe(first()).subscribe(
            (currentYear: string) => {
                this.filterSelectOpts[index].textArray = [currentYear];
                this.filterSelectOpts[index].selectOptsMulti = this.yearsService.getYearOptions().reverse().slice(0, 5);
                this.filterSelectOpts[index].displayOptsInCurrentLabel = { displayOpts: true, replaceWithBlank: '-regular' };
            }
        );
    }
}
