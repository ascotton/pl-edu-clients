import { Injectable } from '@angular/core';
import { serviceEvalStageOptions } from '@common/services/pl-client-service';
import { Store } from '@ngrx/store';
import {
    PLApiContactTypesService,
    PLApiLanguagesService,
    PLConfirmDialogService,
    PLGQLClientServiceService,
    PLGQLProviderTypesService,
    PLGraphQLService,
    PLLodashService,
    PLMayService,
    PLTableFilter,
} from '@root/index';
import { AppStore } from '@root/src/app/appstore.model';
import {
    PLLocationFilter,
    PLLocationFilterFactory,
    PLOrganizationFilter,
    PLOrganizationFilterFactory
} from '@root/src/app/common/filters';
import { Option, PLReferral } from '@root/src/app/common/interfaces';
import { pick } from 'lodash';
import * as moment from 'moment';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { PLUtilService } from '../../common/services';
import { PLClientServicesService } from '../clients/pl-client-services.service';
import { User } from '../user/user.model';
import { createOrUpdateReferralQuery } from './queries/create-or-update-referral.graphql';
import {
    PLAssessmentRow,
    PLEvaluationResponse,
    PLEvaluationsResponse,
    PLAssessmentCaseManager,
    PLClientContactResponse,
    PLClientContactType,
    PLClientContactLanguage,
    PLAssessmentsTableColumn,
} from './models';

export interface PLAssessmentsTableFilter extends PLTableFilter {
    defaultValue?: string[] | string;
}

export interface PLAssessmentsTableFilters {
    provider: PLAssessmentsTableFilter;
    student: PLAssessmentsTableFilter;
    status: PLAssessmentsTableFilter;
    stage: PLAssessmentsTableFilter;
    service: PLAssessmentsTableFilter;
    organization: PLOrganizationFilter;
    location: PLLocationFilter;
    accountCam: PLAssessmentsTableFilter;
}

@Injectable()
export class PLAssessmentsTableService {
    DEFAULT_STATUS_FILTERS = ['in_process', 'not_started', 'matched', 'proposed'];
    DEFAULT_NON_EDITABLE_STATUS = ['completed', 'cancelled'];

    filtersLoaded$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    assessments$: BehaviorSubject<PLAssessmentRow[]> = new BehaviorSubject([]);
    currentUserLoaded$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    currentUser: User;
    userCanAddSingleReferral = false;
    userCanAddReferrals = false;

    customerLocation: any;
    customerOrganization: any;

    filters: PLAssessmentsTableFilters = {
        provider: {
            value: 'providerId',
            label: 'Provider',
            selectOpts: [],
            text: '',
            defaultVisible: true,
        },
        student: {
            value: 'clientFullName_Icontains',
            label: 'Student Name',
            type: 'text',
            defaultVisible: true,
            text: ''
        },
        status: {
            value: 'status_In',
            label: 'Status',
            type: 'multiSelect',
            selectOptsMulti: [],
            defaultVisible: true,
            textArray: this.DEFAULT_STATUS_FILTERS,
            defaultValue: this.DEFAULT_STATUS_FILTERS
        },
        stage: {
            value: 'evaluationStage_In',
            label: 'Stage',
            type: 'multiSelect',
            selectOptsMulti: [],
            defaultVisible: true,
            textArray: []
        },
        service: {
            value: 'providerTypeCode_In',
            label: 'Service',
            type: 'multiSelect',
            selectOptsMulti: [],
            defaultVisible: true,
            textArray: []
        },
        organization: this.plOrgFilterFactory.create({
            value: 'clientOrganizationId_In',
            label: 'Organizations',
        }),
        location: this.plLocationsFilterFactory.create({
            value: 'clientLocationId_In',
            label: 'Locations',
        }),
        accountCam: {
            value: 'accountCam',
            label: '',
            selectOptsCheckbox: [{ value: 'true', label: 'My Accounts Only' }],
            optionWidth: '100%',
            textArray: [],
            defaultValue: [],
        }
    };
    filterReferralStateOptions: Option[] = [
        { value: 'UNMATCHED_PL_REVIEW', label: 'Unmatched' },
        { value: 'UNMATCHED_OPEN_TO_PROVIDERS', label: 'Unmatched (Open)' },
        { value: 'PROPOSED', label: 'Provider Proposed' },
        { value: 'MATCHED', label: 'Matched' },
        { value: 'CONVERTED+NOT_STARTED', label: 'Service Not Started' },
        { value: 'CONVERTED+IN_PROCESS', label: 'Service In Process' },
        { value: 'CONVERTED+COMPLETED', label: 'Completed' },
        { value: 'CONVERTED+CANCELLED', label: 'Cancelled' },
    ];
    defaultFilters: { [key: string]: string } = {};
    visibleFilters = ['organization', 'location', 'stage', 'status', 'provider', 'student', 'service'];
    spProviderViewFilters = ['organization', 'location', 'stage', 'status', 'student', 'service'];
    nonSPProviderViewFilters = ['organization', 'location', 'stage', 'status', 'student'];
    camViewFilters = ['organization', 'location', 'stage', 'status', 'provider', 'student', 'service', 'accountCam'];
    custAdminLocationFilters = ['stage', 'status', 'provider', 'student', 'service'];
    custAdminOrgFilters = ['location', 'stage', 'status', 'provider', 'student', 'service'];
    spProviderTypeOpts = ['mhp', 'pa'];

    contactTypes: PLClientContactType[] = [];
    contactLanguages: PLClientContactLanguage[] = [];

    alwaysVisibleColumns = [
        'location',
        'studentName',
        'serviceType',
        'status',
        'stage',
        'providerName',
        'matchingDate',
    ];
    defaultVisibleColumns = [
        'assessmentPlanSignedOn',
        'dueDate',
        'meetingDate',
        'caseManager'
    ];
    tableColumnsToggle = {
        value: this.defaultVisibleColumns,
        selectOptsMulti: [
            { value: 'assessmentPlanSignedOn', label: 'Assessment Plan Signature Date' },
            { value: 'dueDate', label: 'Due Date' },
            { value: 'meetingDate', label: 'Meeting Date' },
            { value: 'caseManager', label: 'Case Manager' },
        ],
    };
    tableColumns: PLAssessmentsTableColumn[] = [
        { header: { key: 'location', orderKey: 'locationName', value: 'Location / Organization' } },
        { header: { key: 'studentName', orderKey: 'studentName', value: 'Student Name'} },
        { header: { key: 'serviceType', orderKey: 'serviceType', value: 'Service Type'} },
        { header: { key: 'status', orderKey: 'status', value: 'Status' } },
        { header: { key: 'providerName', orderKey: 'providerName', value: 'Provider Name' } },
        { header: { key: 'matchingDate', orderKey: 'matchingDate', value: 'Matched Date' } },
        { header: { key: 'stage', orderKey: 'stage', value: 'Stage' } },
        { header: { key: 'assessmentPlanSignedOn', orderKey: 'assessmentPlanSignedOn', value: 'Assessment Plan Signature Date' } },
        { header: { key: 'dueDate', orderKey: 'dueDate', value: 'Due Date', defaultOrdering: 'ascending' } },
        { header: { key: 'meetingDate', orderKey: 'meetingDate', value: 'Meeting Date' } },
        { header: { key: 'caseManager', value: 'Case Manager' } },
    ];
    assessmentsTableOrderings = {
        dueDate: ['dueDate', 'evaluationDueDate'],
        locationName: ['clientLocationName'],
        studentName: ['clientFirstName', 'clientLastName'],
        serviceType: ['providerTypeLongName', 'evaluationTypeDisplay'],
        status: ['state', 'evaluationStatus'],
        stage: ['evaluationStage'],
        matchingDate: ['matchingDate', 'evaluationMatchingDate'],
        providerName: ['providerFirstName', 'evaluationAssignedToFirstName', 'providerLastName', 'evaluationAssignedToLastName'],
        assessmentPlanSignedOn: ['assessmentPlanSignedOn', 'evaluationAssessmentPlanSignedOn'],
        meetingDate: ['meetingDate', 'evaluationMeetingDate'],
    };
    userColumns: string[] = [
        'location', 'studentName', 'serviceType', 'status', 'stage', 'assessmentPlanSignedOn', 'dueDate', 'meetingDate', 'caseManager'
    ];
    spProviderColumns: string[] = [
        'location', 'studentName', 'serviceType', 'status', 'stage', 'assessmentPlanSignedOn', 'dueDate', 'meetingDate', 'caseManager'
    ];
    nonSPProviderColumns: string[] = [
        'location', 'studentName', 'serviceType', 'status', 'stage', 'assessmentPlanSignedOn', 'dueDate', 'meetingDate', 'caseManager'
    ];
    camColumns: string[] = [
        'location', 'studentName', 'serviceType', 'status', 'providerName', 'matchingDate', 'stage', 'assessmentPlanSignedOn', 'dueDate', 'meetingDate', 'caseManager'
    ];
    customerColumns: string[] = [
        'location', 'studentName', 'serviceType', 'status', 'providerName', 'matchingDate', 'stage', 'assessmentPlanSignedOn', 'dueDate', 'meetingDate', 'caseManager'
    ];

    querySubscription = new Subscription();
    loadingAssessments = false;
    assessments: PLAssessmentRow[] = [];
    evaluations: PLEvaluationResponse[] = [];
    totalAssessments = 0;
    hasNextPage = false;
    isEditingNotes = false;
    tableQuery = {
        first: '25',
        offset: '0',
    };
    lastQuery: any = {};
    defaultOrdering = this.assessmentsTableOrderings.dueDate.join(',');

    readonly TABLE_STATE_NAME = 'at';

    constructor(
        private store: Store<AppStore>,
        private plLocationsFilterFactory: PLLocationFilterFactory,
        private plOrgFilterFactory: PLOrganizationFilterFactory,
        private plGQLProviderTypes: PLGQLProviderTypesService,
        private plMayService: PLMayService,
        private plContactTypesService: PLApiContactTypesService,
        private plLanguagesService: PLApiLanguagesService,
        private plClientServices: PLClientServicesService,
        private plGQLClientService: PLGQLClientServiceService,
        private plGraphQL: PLGraphQLService,
        private plLodash: PLLodashService,
        private confirmDialogService: PLConfirmDialogService,
        private util: PLUtilService,
    ) {
        this.store.select('currentUser').subscribe((user: User) => {
            this.currentUser = user;
            if (!this.currentUserLoaded$.value) {
                this.currentUserLoaded$.next(true);
                this.setFilters();
                this.setCaseManagerOpts();
                this.setVisibleFiltersForUser();
                this.setUserTableColumns();
                this.userCanAddSingleReferral = this.plMayService.addSingleReferral(this.currentUser);
                this.userCanAddReferrals = this.plMayService.addReferrals(this.currentUser);
            }
        });
    }

    setFiltersValuesFromUrl(queryParams): void {
        for (const key in this.filters) {
            if (this.filters[key]) {
                const filter = this.filters[key];
                const paramValue = queryParams[filter.value];
                if (filter.hasOwnProperty('text') && typeof paramValue === 'string') {
                    filter.text = paramValue;
                } else if (filter.hasOwnProperty('textArray') && typeof paramValue === 'string') {
                    filter.textArray = paramValue ? paramValue.split(',') : [];
                }
            }
        }
    }

    clearAllFilters(): any {
        const filtersToText = {};
        for (const key in this.filters) {
            if (this.filters[key]) {
                const filter = this.filters[key];
                if (filter.text) {
                    filter.text = filter.defaultValue || '';
                    filtersToText[filter.value] = filter.text;
                } else if (filter.textArray) {
                    filter.textArray = filter.defaultValue || [];
                    filtersToText[filter.value] = filter.textArray.join(',').toLowerCase();
                }
            }
        }
        return filtersToText;
    }

    setFilters(): void {
        this.setAssessmentsStatusOpts();
        this.setProviderTypesOpts();
        this.setAssessmentsStageFilterOpts();
        this.setOrgAndLocationFilters();
        this.setDefaultFilterValues();

        if (this.plMayService.isClinicalAccountManager(this.currentUser) || this.plMayService.isCustomer(this.currentUser)) {
            this.setProvidersOpts();
        }
    }

    setDefaultFilterValues(): void {
        if (this.plMayService.isProvider(this.currentUser)) {
            const defaultStatus = ['converted+in_process', 'converted+not_started', 'matched'];
            this.defaultFilters = {
                ...this.defaultFilters,
                status_In: defaultStatus.join(',')
            };
            this.filters.status.textArray = defaultStatus;
            this.filters.status.defaultValue = defaultStatus;
        }

        if (this.plMayService.isClinicalAccountManager(this.currentUser)) {
            const defaultStatus = ['converted+in_process', 'converted+not_started', 'matched', 'proposed', 'unmatched_pl_review', 'unmatched_open_to_providers'];
            this.defaultFilters = {
                accountCam: 'true',
                status_In: defaultStatus.join(',')
            };
            this.filters.accountCam = {...this.filters.accountCam, textArray: ['true'], defaultValue: ['true']};
            this.filters.status = {...this.filters.status, textArray: defaultStatus, defaultValue: defaultStatus};
            this.setLimitOrgFilterByCAMAccount(this.filters.accountCam.textArray.length > 0);
        }

        if (this.plMayService.isCustomer(this.currentUser)) {
            const defaultStatus = ['converted+in_process', 'converted+not_started', 'matched', 'proposed', 'unmatched_pl_review', 'unmatched_open_to_providers'];
            this.defaultFilters = {
                status_In: defaultStatus.join(',')
            };
            this.filters.status.textArray = defaultStatus;
            this.filters.status.defaultValue = defaultStatus;
        }
    }

    setVisibleFiltersForUser(): void {
        if (this.plMayService.isProvider(this.currentUser) && !this.isSPUser(this.currentUser)) {
            this.visibleFilters = this.nonSPProviderViewFilters;
        } else if (this.isSPUser(this.currentUser)) {
            this.visibleFilters = this.spProviderViewFilters;
        }

        if (this.plMayService.isClinicalAccountManager(this.currentUser)) {
            this.visibleFilters = this.camViewFilters;
        }

        if (this.plMayService.isCustomer(this.currentUser) && this.customerLocation) {
            this.visibleFilters = this.custAdminLocationFilters;
        }

        if (this.plMayService.isCustomer(this.currentUser) && this.customerOrganization) {
            this.visibleFilters = this.custAdminOrgFilters;
        }
    }

    setUserTableColumns(): void {
        if (this.plMayService.isProvider(this.currentUser) && !this.isSPUser(this.currentUser)) {
            this.userColumns = this.nonSPProviderColumns;
        } else if (this.isSPUser(this.currentUser)) {
            this.userColumns = this.spProviderColumns;
        }

        if (this.plMayService.isClinicalAccountManager(this.currentUser)) {
            this.userColumns = this.camColumns;
        }

        if (this.plMayService.isCustomer(this.currentUser)) {
            this.userColumns = this.customerColumns;
        }

        this.tableColumns = this.tableColumns.filter(col => this.userColumns.includes(col.header.key));
    }

    setAssessmentsStatusOpts(): void {
        this.filters.status.selectOptsMulti = this.getUserAssessmentsStatusOpts();
    }

    setProviderTypesOpts(): void {
        this.plGQLProviderTypes.get()
            .pipe(first())
            .subscribe(() => {
                const allProviderTypeOpts = this.plGQLProviderTypes.formOpts(null, { labelKey: 'longName' });
                this.filters.service.selectOptsMulti = this.getUserProviderTypeOpts(allProviderTypeOpts);
            });
    }

    setProvidersOpts(): void {
        this.util.fetchAll('Providers (REST)', 'providers', { user__is_active: true }).subscribe(providers => {
            this.filters.provider.selectOpts = providers.map((p: any) => ({
                value: p.user,
                label: `${p.first_name} ${p.last_name}`,
            }));
        });
    }

    getUserAssessmentsStatusOpts(): Option[] {
        let statusOpts = this.filterReferralStateOptions.map(opt => ({...opt, value: `${opt.value}`.toLowerCase()}));
        if (this.plMayService.isProvider(this.currentUser)) {
            statusOpts = statusOpts.filter(opt => !['proposed', 'unmatched_pl_review', 'unmatched_open_to_providers'].includes(opt.value));
        }
        return statusOpts;
    }

    getUserProviderTypeOpts(opts: any[]): any[] {
        let userOpts = [...opts];
        if (this.isSPUser(this.currentUser)) {
            userOpts = userOpts.filter(opt => this.spProviderTypeOpts.includes(opt.value));
        }
        return userOpts;
    }

    setAssessmentsStageFilterOpts(): void {
        this.filters.stage.selectOptsMulti = serviceEvalStageOptions.map(opt => ({...opt, value: `${opt.value}`.toLowerCase()}));
    }

    setOrgAndLocationFilters(): void {
        this.filters.organization.updateOptions();
        this.filters.location.updateOptions();
    }

    setLimitLocationOrgFilters(): void {
        this.setLimitLocationFilterbyOrgs(this.filters.organization.textArray);
        this.setLimitOrgFilterByCAMAccount(this.filters.accountCam.textArray.length > 0);
    }

    setLimitLocationFilterbyOrgs(orgIds: string[]): void {
        this.filters.location.limitByParentOrganizations(orgIds);
        this.filters.location.updateOptions();
    }

    setLimitOrgFilterByCAMAccount(shouldFilter: boolean): void {
        const accountsManagedByUser = shouldFilter ? this.currentUser.uuid : '';
        this.filters.location.setAccountsManagedByUser(accountsManagedByUser);
        this.filters.organization.setAccountsManagedByUser(accountsManagedByUser);
        this.setOrgAndLocationFilters();
    }

    updateCustomerLocation(locationId: string): void {
        this.customerLocation = locationId;
        this.setVisibleFiltersForUser();
        this.setCustomerLocationView();
        this.defaultFilters = {
            ...this.defaultFilters,
            clientLocationId_In: this.customerLocation,
        };
    }

    updateCustomerOrganization(orgId: string): void {
        this.customerOrganization = orgId;
        this.setVisibleFiltersForUser();
        this.setLimitLocationFilterbyOrgs([orgId]);
        this.setCustomerOrgView();
        this.defaultFilters = {
            ...this.defaultFilters,
            clientOrganizationId_In: this.customerOrganization,
        };
    }

    setCustomerLocationView(): void {
        this.tableColumns = this.tableColumns.filter(col => col.header.key !== 'location');
        this.userColumns = this.userColumns.filter(col => col !== 'location');
    }

    setCustomerOrgView(): void {
        if (this.isCustomerOrgView()) {
            this.tableColumns = this.tableColumns.map(col => {
                if (col.header.key === 'location') {
                    col.header.value = 'Location';
                }
                return col;
            });
        }
    }

    setCaseManagerOpts(): void {
        this.getContactTypes();
        this.getContactLanguages();
    }

    getContactTypes(): void {
        this.plContactTypesService.get()
            .subscribe((res: PLClientContactType[]) => {
                this.contactTypes = res;
            });
    }

    getContactLanguages(): void {
        this.plLanguagesService.get()
            .subscribe((res: PLClientContactLanguage[]) => {
                this.contactLanguages = res;
            });
    }

    addTypeUserQueryParams(query: any): any {
        let result = {...query};
        if (this.plMayService.isProvider(this.currentUser)) {
            result = {
                ...result,
                assignedToId: this.currentUser.uuid,
                providerId: this.currentUser.uuid,
            };
        }

        if (this.plMayService.isClinicalAccountManager(this.currentUser)) {
            result = {
                ...result
            };
        }

        if (this.plMayService.isCustomer(this.currentUser) && this.customerLocation) {
            result = {
                ...result,
                clientLocationId_In: this.customerLocation,
            };
        }

        if (this.plMayService.isCustomer(this.currentUser) && this.customerOrganization) {
            result = {
                ...result,
                clientOrganizationId_In: this.customerOrganization,
            };
        }
        return result;
    }

    updateAssessmentLocally(updates: any): any {
        this.assessments = this.assessments.map(assessment => {
            if (assessment.id === updates.id) {
                assessment = {
                    ...assessment,
                    ...updates
                };
            }
            return assessment;
        });
        this.assessments$.next(this.assessments);
    }

    loadAssessmentReferralById(referralId: string): void {
        this.plClientServices.getAssessmentReferralById(referralId)
            .pipe(first())
            .subscribe((res: PLEvaluationResponse) => {
                this.evaluations = this.evaluations.map(evaluation => {
                    if (evaluation.id === referralId) {
                        return { ...res };
                    }
                    return evaluation;
                });
                this.assessments = this.assessments.map((assessment: any) => {
                    if (assessment.id === referralId) {
                        return {
                            ...assessment,
                            ...this.mapEvaluationToTableRows(res)
                        };
                    }
                    return assessment;
                });
                this.assessments$.next(this.assessments);
            });
    }

    loadAssessments(query: any): void {
        this.setLoadingState();
        this.querySubscription = this.plClientServices.getAssessmentsReferrals(query)
            .subscribe((res: PLEvaluationsResponse) => {
                this.setAssessmentsTableFromResults(res);
                this.loadingAssessments = false;
            });
    }

    setAssessmentsTableFromResults(res: PLEvaluationsResponse): void {
        const allAssessments: PLEvaluationResponse[] = res.referrals;
        this.totalAssessments = res.totalCount;
        this.hasNextPage = res.hasNextPage;
        this.evaluations = [...this.evaluations, ...this.filterAssessmentsByUserType(allAssessments)];
        if (this.evaluations.length) {
            this.evaluations = this.addClientCaseManagerToEvaluations();
            this.assessments = this.evaluations.map((evaluation: any) => this.mapEvaluationToTableRows(evaluation));
            this.assessments$.next(this.assessments);
        } else {
            this.assessments$.next([]);
        }
    }

    prepareQuery(query: any): any {
        let preparedQuery = {...query};
        preparedQuery = this.addTypeUserQueryParams(preparedQuery);
        preparedQuery = this.mapReferralsAndServicesFilters(preparedQuery);
        return preparedQuery;
    }

    setLoadingState(): void {
        this.assessments = [];
        this.evaluations = [];
        this.assessments$.next(this.assessments);
        this.loadingAssessments = true;
        this.querySubscription.unsubscribe();
    }

    resetAssessments(): void {
        this.loadingAssessments = false;
        this.assessments = [];
        this.evaluations = [];
        this.totalAssessments = 0;
        this.hasNextPage = false;
        this.isEditingNotes = false;
        this.assessments$.next(this.assessments);
        this.tableColumnsToggle.value = this.defaultVisibleColumns;
    }

    addClientCaseManagerToEvaluations(): PLEvaluationResponse[] {
        return this.evaluations.map(evaluation => {
            const caseManagerContactType = this.contactTypes.find(cm => cm.name === 'Case Manager');
            const caseManagers = evaluation.client.contacts
                .filter((contact) => contact.contactType === caseManagerContactType.name);
            const currentCaseManager = caseManagers.length
                ? this.plLodash.sort2d(caseManagers, 'created', 'descending')[0]
                : null;
            return {
                ...evaluation,
                caseManager: currentCaseManager ? this.mapToSnakeCaseContact(currentCaseManager) : null,
            };
        });
    }

    mapToSnakeCaseContact(contact: PLClientContactResponse): PLAssessmentCaseManager {
        return {
            uuid: contact.uuid,
            last_name: contact.lastName,
            first_name: contact.firstName,
            contact_type: contact.contactType,
            primary_language: contact.primaryLanguage.code,
            street: contact.street,
            city: contact.city,
            state: contact.state,
            postal_code: contact.postalCode,
            contact_preference: contact.contactPreference.toLowerCase(),
            email: contact.email,
            phone: contact.phone,
            is_emergency: contact.isEmergency,
            is_responsible_party: contact.isResponsibleParty,
            created: contact.created,
        };
    }

    mapEvaluationToTableRows(evaluation: PLEvaluationResponse): PLAssessmentRow {
        const evaluationService = evaluation.clientService && evaluation.clientService.evaluation ?
            evaluation.clientService.evaluation : null;
        evaluation.clientService = evaluationService;
        const isService = !!(evaluationService && evaluationService.id);
        const provider = isService ? evaluationService.assignedTo : evaluation.provider;
        const isAssessment = this.getProdutType(evaluation) === 'evaluation_with_assessments';
        const clientLocation = evaluation.client.locations[0];
        return {
            isService,
            isAssessment,
            id: isService ? evaluationService.id : evaluation.id,
            referralId: evaluation.id,
            location: clientLocation,
            locationName: this.getLocationAndOrgDisplayName(clientLocation),
            client: evaluation.client,
            studentName: `${evaluation.client.firstName} ${evaluation.client.lastName}`,
            studentProfileURL: `/client/${evaluation.client.id}/services/`,
            serviceType: isService ? this.getServiceTypeDisplay(evaluation) : this.getServiceType(evaluation),
            status: isService ? evaluationService.status : evaluation.state,
            statusDisplay: this.getStatusDisplay(evaluation),
            stage: isService ? evaluationService.evaluationStage : '',
            assessmentPlanSignedOn: isService
                ? (evaluationService.assessmentPlanSignedOn ? moment(evaluationService.assessmentPlanSignedOn, 'YYYY-MM-DD') : '')
                : (evaluation.assessmentPlanSignedOn ? moment(evaluation.assessmentPlanSignedOn, 'YYYY-MM-DD') : ''),
            dueDate: isService
                ? (evaluationService.dueDate ? moment(evaluationService.dueDate, 'YYYY-MM-DD') : '')
                : (evaluation.dueDate ? moment(evaluation.dueDate, 'YYYY-MM-DD') : ''),
            meetingDate: isService
                ? (evaluationService.meetingDate ? moment(evaluationService.meetingDate, 'YYYY-MM-DD') : '')
                : (evaluation.meetingDate ? moment(evaluation.meetingDate, 'YYYY-MM-DD') : ''),
            caseManager: evaluation.caseManager,
            caseManagerDisplay: evaluation.caseManager
                ? `${evaluation.caseManager.first_name} ${evaluation.caseManager.last_name}, ${evaluation.caseManager.email}`
                : 'None',
            hasNotes: evaluation.hasNotes,
            providerName: this.getProviderFullName(provider),
            permissions: isService ? evaluationService.permissions : evaluation.permissions,
            matchingDate: isService ? evaluationService.matchingDate : evaluation.matchingDate,
        };
    }

    mapReferralsAndServicesFilters(allFilters: any): any {
        const accountCamId = allFilters.accountCam && this.plMayService.isClinicalAccountManager(this.currentUser)
            ? this.currentUser.uuid : undefined;
        const referralStates = allFilters.status_In || this.filterReferralStateOptions.map(opt => opt.value).join(',').toLocaleLowerCase();
        return {
            ...allFilters,
            accountCamId,
            state_In: referralStates,
            assignedToId: allFilters.providerId,
            providerId: allFilters.providerId
        };
    }

    filterAssessmentsByUserType(assessements: PLEvaluationResponse[]): PLEvaluationResponse[] {
        let result = [...assessements];
        if (this.plMayService.isProvider(this.currentUser)) {
            result = result.filter(assessment => {
                return (assessment.provider && assessment.provider.id)
                    || (assessment.referringProvider && assessment.referringProvider.id);
            });
        }
        return result;
    }

    getProviderFullName(provider: any): string {
        return provider ? `${provider.firstName} ${provider.lastName}` : '';
    }

    isCustomerOrgView(): boolean {
        return this.plMayService.isCustomer(this.currentUser) && !!this.customerOrganization;
    }

    getLocationAndOrgDisplayName(clientLocation: any): string {
        let clientOrganization = clientLocation.organization;
        if (this.isCustomerOrgView()) {
            clientOrganization = null;
        }
        return `${clientLocation.name}${clientOrganization ? ', ' + clientOrganization.name : ''}`;
    }

    updateAssessmentsClientContacts(updates: any): void {
        this.assessments.forEach((assessment) => {
            if (updates.save && updates.save.client === assessment.client.id) {
                assessment.caseManager = updates.save;
                assessment.caseManagerDisplay =
                    `${assessment.caseManager.first_name} ${assessment.caseManager.last_name}, ${assessment.caseManager.email}`;
            } else if (updates.delete && updates.delete.client === assessment.client.id) {
                assessment.caseManager = undefined;
                assessment.caseManagerDisplay = 'None';
            }
        });
        this.assessments$.next(this.assessments);
    }

    getStatusDisplay(assessment: any): string {
        if (assessment.clientService && assessment.clientService.status) {
            assessment.state = `CONVERTED+${assessment.clientService.status}`;
        }
        const referralState = this.filterReferralStateOptions.find(stateOpt => stateOpt.value === assessment.state);
        return referralState ? referralState.label : '';
    }

    getServiceType(evaluation: any): string {
        if (evaluation.providerType && evaluation.providerType.longName) {
            return evaluation.providerType.longName;
        }
        return '';
    }

    getServiceTypeDisplay(evaluation: any): string {
        const evaluationTypeDisplay =
            evaluation.clientService.evaluationTypeDisplay ? `— ${evaluation.clientService.evaluationTypeDisplay}` : '';
        return `${evaluation.clientService.service.name} ${evaluationTypeDisplay}`;
    }

    getProdutType(evaluation: any): string {
        if (evaluation.clientService && evaluation.clientService.service && evaluation.clientService.service.productType) {
            return evaluation.clientService.service.productType.code;
        }

        if (evaluation.productType) {
            return evaluation.productType.code;
        }

        return '';
    }

    saveAssessment(evaluation: any, isService: boolean): Observable<any> {
        const assessmentSave$ = isService
            ? this.plGQLClientService.save({ evaluation }, '', {}, '')
            : this.plGraphQL.mutate(createOrUpdateReferralQuery, evaluation);
        return assessmentSave$;
    }

    prepareReferralForSave(evaluation: any): any {
        const referral = this.evaluations.find(obj => obj.id === evaluation.id);
        const client = pick(referral.client, [
            'id', 'birthday', 'externalId', 'firstName', 'lastName',
            'englishLanguageLearnerStatus',
        ]);
        const referralRequestBody = {
            client,
            referral: {
                ...evaluation,
            }
        };
        return referralRequestBody;
    }

    getAssessmentReferralById(assessmentId: string): any {
        return this.evaluations.find(evaluation => evaluation.id === assessmentId);
    }

    mapToPlReferral(referral: any): PLReferral {
        const client = referral.client;
        const emptyLocation = { name: '', parent: { name: '', id: '' } };
        const location = client.locations.length ? client.locations[0] : emptyLocation;

        return {
            ...referral,
            createdAtFromNow: moment(referral.created, 'YYYY-MM-DD').fromNow(),
            discipline: referral.providerType.shortName.toUpperCase(),
            isMissingInformation: referral.isMissingInformation,
            isScheduled: referral.isScheduled,
            locationName: location.name || '',
            productTypeCode: referral.productType.code,
            organizationName: location.organization ? location.organization.name : '',
            organizationId: location.parent ? location.parent.id : '',
            recycledCount: referral.declinedByProvidersCount || 0,
        };
    }

    userCanMatchOrUnmatchProvider(): boolean {
        return this.plMayService.isClinicalAccountManager(this.currentUser);
    }

    userCanAddOrEditClientContact(client): boolean {
        return this.plMayService.addContact(this.currentUser, client);
    }

    isSPUser(user: User): boolean {
        return user.groups.includes('SP');
    }

    hasUnsavedNotes(): boolean {
        if (this.isEditingNotes) {
            this.confirmDialogService.show({
                header: 'Notes being edited',
                content: 'There are notes that have not being saved yet. Save or cancel notes editing to proceed',
                primaryLabel: 'Close',
                primaryCallback: () => {},
            });
        }
        return this.isEditingNotes;
    }

    formFilterChangesText(): any {
        const filtersToText = {};
        for (const key in this.filters) {
            if (this.filters[key]) {
                const filter = this.filters[key];
                if (filter.text) {
                    filtersToText[filter.value] = filter.text;
                } else if (filter.textArray && filter.textArray.length) {
                    filtersToText[filter.value] = filter.textArray.join(',').toLowerCase();
                }
            }
        }
        return filtersToText;
    }
}
