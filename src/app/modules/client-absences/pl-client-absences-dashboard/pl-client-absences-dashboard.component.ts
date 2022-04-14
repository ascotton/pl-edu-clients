import {
    Component,
    OnInit,
} from '@angular/core';
import * as moment from 'moment';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';

import {
    PLGraphQLService, PLLodashService, PLHttpService,
    PLUrlsService, PLTimezoneService, PLClientStudentDisplayService
} from '@root/index';

import { User } from '@modules/user/user.model';
import { PLSchoolYearsService, PLIndexSelectionService, PLUtilService, PLComponentStateInterface } from '@common/services';

const serviceTypesQuery = require('./queries/service-types.graphql');
const providerProfilesQuery = require('./queries/provider-profiles.graphql');
const searchProvidersQuery = require('./queries/search-providers.graphql');
const clientAbsencesQuery = require('./queries/client-absences.graphql');

import {
    PLLocationFilter,
    PLLocationFilterFactory,
} from '@common/filters';

import { PLClientAbsencesService } from './pl-client-absences.service';
import { PLClientAbsences } from './pl-client-absences';
import { PLClientAbsencesConsecutive } from './pl-client-absences-consecutive';
import { PLClientAbsencesYtd } from './pl-client-absences-ytd';
import { PLClientAbsencesRate } from './pl-client-absences-rate';
import { PLNotesReportService } from '@common/services/reports/pl-notes-report.service';

@Component({
    selector: 'pl-client-absences-dashboard',
    templateUrl: './pl-client-absences-dashboard.component.html',
    styleUrls: ['../../../common/less/app/client-absences.less', './pl-client-absences-dashboard.component.less'],
})

export class PLClientAbsencesDashboardComponent implements OnInit {
    _state: PLComponentStateInterface;
    componentName: string = 'PLClientAbsencesDashboardComponent';

    clientServices: any[] = [];
    selectedClientService: any = {};
    selectedClientRecords: any[] = [];

    loadingClientServices: boolean = true;
    loadingRecords: boolean = false;

    currentUser: User;
    private userTimezone: string;

    viewingDetails: boolean = false;
    viewType: 'consecutive';
    classes: any = {
        selectedClientService: false,
    };

    dataUpdatedDate: string = `${moment().format('MM/DD/YYYY')}, 12:00AM`;

    orderKey: string = 'orderBy';
    pageSizeKey: string = 'first';

    readonly orderAbsencesDescending: string = '-absences';

    sortOpts: any[] = [];
    filtersPrimary: any[] = [];

    filtersSecondary: any[];
    locationsFilter: PLLocationFilter;

    totalTable: number = 0
    summaryData: any = {};
    loadingSummaryData = false;
    currentPageTable: number = 1;
    pageSizeTable: number;

    private clientSummaryQuery: any = {};

    plClientAbsencesService: any;

    readonly absencesConsecutive = new PLClientAbsencesConsecutive();
    readonly absencesYtd = new PLClientAbsencesYtd();
    readonly absencesRate = new PLClientAbsencesRate();

    // model filters is the canonical representation for the selected priority
    // and the absences type visible to the user
    modelFilters: any = this.absencesConsecutive.queryParams(null);

    clientStudentCapital: string = '';

    constructor(
        public util: PLUtilService,
        private plGraphQL: PLGraphQLService,
        private plLodash: PLLodashService,
        private plHttp: PLHttpService,
        private plUrls: PLUrlsService,
        private plTimezone: PLTimezoneService,
        private route: ActivatedRoute,
        private plClientAbsencesService1: PLClientAbsencesService,
        private plSchoolYears: PLSchoolYearsService,
        private plLocationsFilterFactory: PLLocationFilterFactory,
        private plNotesReportService: PLNotesReportService,
      ) { }

    ngOnInit() {
        this._state = this.util.initComponent({
            name: this.componentName,
            params: {
                flags: {
                    //COMPONENT_INIT: 1,
                    //SHOW_DIVS: 1,
                }
            },
            fn: (state: PLComponentStateInterface, done) => {
                this.currentUser = state.currentUser;
                this.userTimezone = this.plTimezone.getUserZone(this.currentUser);
                this.clientStudentCapital = PLClientStudentDisplayService.get(this.currentUser, { capitalize: true });

                this.locationsFilter = this.plLocationsFilterFactory.create(
                    { value: 'locationId_In', label: 'Locations', placeholder: 'Locations' },
                );

                this.filtersSecondary = [
                    this.locationsFilter,
                    { value: 'serviceTypeCode_In', label: 'Services', type: 'multiSelect', selectOptsMulti: [], placeholder: 'Services' },
                    { value: 'servicedByProviderId_In', label: 'Providers', type: 'multiSelectApi', selectOptsMultiApi: [], searchLoading: false, placeholder: 'Providers' },
                ];

                this.plClientAbsencesService = this.plClientAbsencesService1;
                this.formSortOpts();
                this.formFiltersPrimary();

                this.route.queryParams.subscribe((routeParams: any) => {
                    if (!routeParams.clientService) {
                        this.viewingDetails = false;
                    }
                });
                this.formServiceTypesOpts();
                done();
            }
        })
    }

    formSortOpts() {
        this.sortOpts = [
            // to retain a one-way data flow for the order options for absences,
            // use a placeholder value to be swapped out prior to query
            { value: this.orderAbsencesDescending, label: 'Absences Highest', key: 'absences', direction: 'descending', },
            { value: 'clientFirstName', label: `${this.clientStudentCapital} First Name (A-Z)`, key: 'clientFirstName', direction: 'ascending', },
            { value: '-clientFirstName', label: `${this.clientStudentCapital} First Name (Z-A)`, key: 'clientFirstName', direction: 'descending', },
            { value: 'clientLastName', label: `${this.clientStudentCapital} Last Name (A-Z)`, key: 'clientLastName', direction: 'ascending', },
            { value: '-clientLastName', label: `${this.clientStudentCapital} Last Name (Z-A)`, key: 'clientLastName', direction: 'descending', },
        ];
    }

    formFiltersPrimary() {
        this.filtersPrimary = [
            { value: 'clientFullName_Icontains', label: `${this.clientStudentCapital} Name`, placeholder: `Search ${this.clientStudentCapital} Name` },
        ];
    }

    absencesParams(): string[] {
        const params = [
            ...this.absencesConsecutive.filtersParams(),
            ...this.absencesYtd.filtersParams(),
            ...this.absencesRate.filtersParams(),
        ];

        // strip out duplicate params
        return Array.from(new Set(params));
    }

    get filtersModel(): any[] {
        return this.absencesParams().map((param: string) => ({ value: param, label: '' }));
    }

    formServiceTypesOpts() {
        let index = this.plLodash.findIndex(this.filtersSecondary, 'value', 'serviceTypeCode_In');
        const vars = {
            first: 100,
        };
        this.plGraphQL.query(serviceTypesQuery, vars, {}).subscribe((res: any) => {
            this.filtersSecondary[index].selectOptsMulti = res.serviceTypes.map((serviceType: any) => ({
                value: serviceType.code,
                label: serviceType.longName,
            }));
        });
    }

    filtersSetModelOptions(evt: { filterValue: string, modelValues: string[] }) {
        if (evt.filterValue === this.locationsFilter.value) {
            this.locationsFilter.updateModelOptions(evt.modelValues);
        } else if (evt.filterValue === 'servicedByProviderId_In') {
            this.onSetModelOptionsProviders(evt);
        }
    }

    onSetModelOptionsProviders(evt: { filterValue: string, modelValues: string[] }) {
        let index = this.plLodash.findIndex(this.filtersSecondary, 'value', 'servicedByProviderId_In');
        const vars: any = {
            userId_In: evt.modelValues.join(','),
        };
        this.plGraphQL.query(providerProfilesQuery, vars, {}).subscribe((res: any) => {
            this.filtersSecondary[index].modelOptions = res.providerProfiles.map((providerProfile: any) => {
                let user = providerProfile.user;
                return { value: user.id, label: `${user.lastName}, ${user.firstName}` };
            });
        });
    }

    canDownloadReport(priority: number): boolean {
        const clientServicesCount = this.summaryData[`priority${priority}`] || 0;

        return (this.clientSummaryQuery !== {}) && (clientServicesCount > 0);
    }

    onDownloadReportClick(priority: number): void {
        const filterClientServices = Object.assign(
            {},
            this.clientSummaryQuery,
            this.absencesType.queryParams(priority),
        );

        const params = {
            filterClientServices: this.plLodash.omit(filterClientServices, ['absencesType']),
            filterRecords: {
                orderBy: '-appointmentStartDate',
                billingCodeCode_In: 'unplanned_student_absence, student_absence_no_notice',
            },
            reportFilenameTitle: this.absencesType.reportFileTitle(priority),
            reportTemplate: 'ABSENCE',
            reportTitle: 'Absences Report',
        };

        this.plNotesReportService.generateReport(params).subscribe();
    }

    filtersSearch(evt: { value: string, filterValue: string }) {
        if (evt.filterValue === this.locationsFilter.value) {
            this.locationsFilter.setOptionsSearchTerm(evt.value);
            this.locationsFilter.updateOptions();
        } else if (evt.filterValue === 'servicedByProviderId_In') {
            this.onSearchProviders(evt);
        }
    }

    onSearchProviders(evt: { value: string }) {
        let index = this.plLodash.findIndex(this.filtersSecondary, 'value', 'servicedByProviderId_In');
        this.filtersSecondary[index].searchLoading = true;

        const vars: any = {
            fullName_Icontains: evt.value,
            orderBy: 'lastName',
        };

        this.plGraphQL.query(searchProvidersQuery, vars, {}).subscribe((res: any) => {
                this.filtersSecondary[index].selectOptsMultiApi = res.providerProfiles.map((providerProfile: any) => {
                    let user = providerProfile.user;
                    return { value: user.id, label: `${user.lastName}, ${user.firstName}` };
                });
                this.filtersSecondary[index].searchLoading = false;
            });
    }

    onQueryTable(info: { query: any }) {
        // client services query requires the school year, so wait until
        // the school year loads.
        this.plSchoolYears
            .getCurrentSchoolYearCode()
            .pipe(first())
            .subscribe(yearCode => this.getClientServices(info.query, yearCode));
    }

    private clientServicesCommonQueryParams(filterParams: any, currentSchoolYearCode: string): any {
        const params: any = Object.assign(
            this.plLodash.omit(filterParams, ['page']),
            { status_NotIn: 'completed,cancelled' },
        );

        if (currentSchoolYearCode) {
            params.schoolYearCode_In = currentSchoolYearCode;
        }

        return params;
    }

    private clientServicesQueryParams(commonFilterParams: any): any {
        const params = Object.assign({}, commonFilterParams);

        // replace placeholder absences order value with apiKey of current absences type
        if (params[this.orderKey] === this.orderAbsencesDescending) {
            params[this.orderKey] = `-${this.absencesType.apiKey}`;
        }

        return params;
    }

    private clientServicesSummaryQueryParams(commonFilterParams: any): any {
        return this.plLodash.omit(commonFilterParams, [...this.absencesParams(), 'first', 'offset', 'orderBy']);
    }

    private getClientServices(query: any = {}, currentSchoolYearCode: string) {
        this.summaryData = {};
        this.viewingDetails = false;
        this.loadingSummaryData = true;
        this.selectedClientService = {};
        this.loadingClientServices = true;
        this.classes.selectedClientService = false;
        query.offset = query.first * (query.page - 1);
        
        const commonFilterParams = this.clientServicesCommonQueryParams(query, currentSchoolYearCode);
        this.clientSummaryQuery = this.clientServicesSummaryQueryParams(commonFilterParams);
        this.plClientAbsencesService
            .formSummaryData(this.absencesType, this.clientSummaryQuery)
            .subscribe((summaryData: any) => {
                this.summaryData = summaryData;
                this.loadingSummaryData = false;
            }
        );

        const clientServicesQueryParams = this.clientServicesQueryParams(commonFilterParams);
        this.plGraphQL.query(clientAbsencesQuery, clientServicesQueryParams, {}).subscribe((res: any) => {
            this.loadingClientServices = false;
            this.clientServices = this.formatClientServices(res.clientServices);
            this.totalTable = res.clientServices_totalCount;
        });
    }

    filterPriorityFilterAnalyticsClass(priority: number): string {
        return (this.isConsecutiveAbsences() && `x-qa-consecutive-absences-bucket-${priority}-filter`) ||
            (this.isYtdAbsences() && `x-qa-ytd-absences-bucket-${priority}-filter`) ||
            (this.isRateAbsences() && `x-qa-60-day-rate-absences-bucket-${priority}-filter`);
    }

    filterPriorityDownloadAnalyticsClass(priority: number): string {
        return (this.isConsecutiveAbsences() && `x-qa-consecutive-absences-bucket-${priority}-download`) ||
            (this.isYtdAbsences() && `x-qa-ytd-absences-bucket-${priority}-download`) ||
            (this.isRateAbsences() && `x-qa-60-day-rate-absences-bucket-${priority}-download`);
    }

    get prioritySelection(): PLIndexSelectionService {
        const priority = this.absencesType.priorityFromQueryParams(this.modelFilters);

        return new PLIndexSelectionService(priority);
    }

    get absencesType(): PLClientAbsences {
        const absencesType = [this.absencesConsecutive, this.absencesYtd, this.absencesRate].find((absencesType) => {
            return absencesType.matchesQueryParams(this.modelFilters);
        });

        // default to consecutive absences type
        return absencesType || this.absencesConsecutive;
    }

    public isConsecutiveAbsences(): boolean {
        return this.absencesType === this.absencesConsecutive;
    }

    public isRateAbsences(): boolean {
        return this.absencesType === this.absencesRate;
    }

    public isYtdAbsences(): boolean {
        return this.absencesType === this.absencesYtd;
    }

    showConsecutiveSummaryText(): boolean {
        return this.isConsecutiveAbsences() && !this.loadingSummaryData;
    }

    showRateSummaryText(): boolean {
        return this.isRateAbsences() && !this.loadingSummaryData;
    }

    showYtdSummaryText(): boolean {
        return this.isYtdAbsences() && !this.loadingSummaryData;
    }

    onAbsencesTypeClick(absencesType: PLClientAbsences) {
        if (this.absencesType !== absencesType) {
            this.modelFilters = absencesType.queryParams(null);
        }
    }

    toggleFilterAbsencesPriority(priority: number) {
        const newPriority = this.prioritySelection.toggle(priority).getSelection();

        this.modelFilters = this.absencesType.queryParams(newPriority);
    }

    formatClientServices(clientServices: any) {
        const serviceMap = {
            consultation: 'Eval - Consultation',
            evaluation_with_assessments: 'Eval - Assessment',
            records_review: 'Eval - Records Review',
            screening: 'Eval - Screening',
            direct_service: 'Direct Service',
        };

        const priorityClasses = (classes: any, priority: number): any => {
            classes[`priority-${priority}`] = true;
            return classes;
        };

        clientServices.forEach((clientService: any) => {
            clientService.xLocation = (clientService.client.locations.length &&
             clientService.client.locations[0].name) ? clientService.client.locations[0].name : '';
            clientService.xType = serviceMap[clientService.service.productType.code];

            const absences = clientService.statistics[this.absencesConsecutive.apiKey];
            const absencesStreakPriority = this.absencesConsecutive.priority(absences);
            clientService.xAbsencesStreak = this.absencesConsecutive.formattedString(absences);
            clientService.xAbsencesStreakClasses = priorityClasses({}, absencesStreakPriority);

            const absencesRatio = clientService.statistics[this.absencesRate.apiKey];
            const absencesRatePriority = this.absencesRate.priority(absencesRatio);
            clientService.xAbsencesRate = this.absencesRate.formattedString(absencesRatio);
            clientService.xAbsencesRateClasses = priorityClasses({}, absencesRatePriority);

            const absencesYtd = clientService.statistics[this.absencesYtd.apiKey];
            const absencesYtdPriority = this.absencesYtd.priority(absencesYtd);
            clientService.xAbsencesYtd = this.absencesYtd.formattedString(absencesYtd);
            clientService.xAbsencesYtdClasses = priorityClasses({}, absencesYtdPriority);

            const highestPriority = Math.min(absencesStreakPriority, absencesRatePriority);
            clientService.xClasses = priorityClasses({}, highestPriority);

            clientService.xAbsencesValue =
                (this.isConsecutiveAbsences() && clientService.xAbsencesStreak) ||
                (this.isYtdAbsences() && clientService.xAbsencesYtd) ||
                (this.isRateAbsences() && clientService.xAbsencesRate);

            clientService.xAbsencesValueClasses =
                (this.isConsecutiveAbsences() && clientService.xAbsencesStreakClasses) ||
                (this.isYtdAbsences() && clientService.xAbsencesYtdClasses) ||
                (this.isRateAbsences() && clientService.xAbsencesRateClasses);

        });

        return clientServices;
    }

    selectClientService(clientService: any) {
        this.selectedClientService = Object.assign({}, clientService, {
            xLocationName: (clientService.client.locations.length && clientService.client.locations[0])
             ? clientService.client.locations[0].name : '',
        });
        this.getClientRecords(clientService.id, clientService.statistics.consecutiveAbsenceStreak);
        this.getClientContacts(clientService.client.id);
        this.highlightSelectedClientService(clientService);
        this.classes.selectedClientService = true;
    }

    highlightSelectedClientService(clientService: any) {
        this.clientServices.forEach((clientService1: any) => {
            if (!clientService1.xClasses) {
                clientService1.xClasses = {};
            }
            if (clientService1.id === clientService.id) {
                clientService1.xClasses.selected = true;
                clientService1.xClasses.visited = true;
            } else {
                clientService1.xClasses.selected = false;
            }
        });
    }

    unhighlightSelectedClientService(clientService: any) {
        const index = this.plLodash.findIndex(this.clientServices, 'id', clientService.id);
        if (index > -1) {
            this.clientServices[index].xClasses.selected = false;
        }
    }

    closeSelected(evt: any) {
        this.unhighlightSelectedClientService(this.selectedClientService);
        this.selectedClientService = {};
        this.classes.selectedClientService = false;
    }

    getClientRecords(clientServiceId: string, consecutiveAbsences: number) {
        // Reset.
        this.selectedClientRecords = [];
        this.loadingRecords = true;
        let params: any = {
            client_service: clientServiceId,
            expand: ['appointment'],
            ordering: '-appointment__start',
            only_absences: true,
        };
        this.plHttp.get('records', params)
            .subscribe((res: any) => {
                this.selectedClientRecords = this.formatClientRecords((res.results ? res.results : []));
                this.loadingRecords = false;
            });
    }

    formatClientRecords(records: any[]) {
        records.forEach((record: any) => {
            record.xStart = this.plTimezone.toUserZone(record.appointment_expanded.start,
             null, this.userTimezone).format('M/D/YYYY, h:mm A');
            record.xStartDay = this.plTimezone.toUserZone(record.appointment_expanded.start,
             null, this.userTimezone).format('dddd');
            record.xEndTime = this.plTimezone.toUserZone(record.appointment_expanded.end,
             null, this.userTimezone).format('h:mm A');
            record.xNotes = record.notes ? JSON.parse(record.notes) : {};
            record.xAtLeastOneNote = record.notes;
        });
        return records;
    }

    getClientContacts(clientId: string) {
        const params: any = {};
        const url = `${this.plUrls.urls.clients}${clientId}/contacts/`;
        this.plHttp.get('', params, url)
            .subscribe((res: any) => {
                const contacts = res.results ? res.results : [];
                const contact = (contacts.length && contacts[0]) ? contacts[0] : null;
                this.selectedClientService.xContactInfo = this.formatContactInfoString(contact);
            });
    }

    formatContactInfoString(contact: any) {
        if (!contact) {
            return '';
        }
        let type = '';
        const typeMap = {
            is_responsible_party: 'LC',
            is_emergency: 'Emergency',
        };
        for (let typeKey in typeMap) {
            if (contact[typeKey]) {
                type = typeMap[typeKey];
            }
        }
        const contactMethod = contact[contact.contact_preference];
        return contact ? `${contact.first_name} ${contact.last_name}, ${type} ${contactMethod}` : '';
    }
}
