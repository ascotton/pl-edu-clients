import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { concat, forkJoin, BehaviorSubject, Observable } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';

import { IndividualConfig, ToastrService } from 'ngx-toastr';

import {
    PLLodashService,
    PLMayService,
    PLModalService,
    PLTableFilter,
    PLTableFrameworkService,
    PLTableFrameworkUrlService,
    PLTimezoneService,
    PLGQLProviderTypesService,
    PLGQLLanguagesService,
} from '@root/index';

import {
    PLLocationFilter,
    PLLocationFilterFactory,
    PLOrganizationFilter,
    PLOrganizationFilterFactory,
    PLMultiSelectApiFilter,
    PLLocationsOrganizationsLimiter,
} from '@common/filters';

import {
    PLClientReferralMatchComponent,
} from '../pl-client-referral-match/pl-client-referral-match.component';

import {
    PLClientReferralsProposeMatchesComponent,
    ProposeMatchesEvent,
} from '../pl-client-referrals-propose-matches/pl-client-referrals-propose-matches.component';

import { PLClientReferralsService } from '../pl-client-referrals.service';
import { CurrentUserService } from '@modules/user/current-user.service';
import { User } from '@modules/user/user.model';
import { PLSchoolYearsService, PLUtilService } from '@common/services/';
import { Option } from '@common/interfaces';
import { PLReferral, PLReferralsService } from '../pl-referrals.service';
import { PLClientReferralManagerService } from './pl-client-referral-manager.service';

import { CLINICAL_PRODUCT_TYPE } from '../../../common/constants/index';
import { PLReferralCyclesModalComponent } from '../pl-referral-cycles-modal/pl-referral-cycles-modal.component';
import { PlClientReferralUnmatchComponent } from '../pl-client-referral-unmatch/pl-client-referral-unmatch.component';
import { PLClientReferralReassignComponent } from '../pl-client-referral-reassign/pl-client-referral-reassign.component';

@Component({
    selector: 'pl-client-referral-manager',
    templateUrl: './pl-client-referral-manager.component.html',
    styleUrls: ['./pl-client-referral-manager.component.less'],
    providers: [PLClientReferralManagerService],
})

export class PLClientReferralManagerComponent implements OnInit {

    CLINICAL_PRODUCT = CLINICAL_PRODUCT_TYPE;
    DEFAULT_STATE = {
        P: 'PROPOSED',
        M: 'MATCHED',
        UM_OP_PRV: 'UNMATCHED_OPEN_TO_PROVIDERS',
        UM_PL_REV: 'UNMATCHED_PL_REVIEW',
    };

    private QUERY_SORT_DEFAULT = 'clientLastName';

    allChecked = false;
    currentPage: number;
    orderKey = 'orderBy';

    pageSizeKey = 'first';
    pageSize: number;

    referrals: PLReferral[] = [];
    gqlParamsForReferralSvc: any;

    showReassign = false;

    loading = false;
    loadingTableDependencies = true;

    selectedSchoolYearCode = '';

    total: number;
    tableStateName = 'crm';

    showSeparatingColumn = false;
    private cachedQuery: any = {};
    private selectedReferrals: string[] = [];

    // state codes that can be displayed in list view
    // known excludes (DELETED, DECLINED)
    // see https://presencelearning.atlassian.net/wiki/display/BE/Client+Referrals
    private defaultStateIn: string[] = [
        this.DEFAULT_STATE.UM_PL_REV, this.DEFAULT_STATE.UM_OP_PRV, this.DEFAULT_STATE.P, this.DEFAULT_STATE.M,
    ];

    private readonly olderThanFilterValues = {
        ONE_WEEK: 'one-week',
        TWO_WEEKS: 'two-weeks',
        ONE_MONTH: 'one-month',
        THREE_MONTHS: 'three-months',
        SIX_MONTHS: 'six-months',
        TWELVE_MONTHS: 'twelve-months',
    };

    // Formatted like 2020-03-05 04:05:01
    private readonly olderThanFormat = this.plTimezoneService.formatDateTimeNoTz;

    private readonly olderThanFilterTimes = {
        [this.olderThanFilterValues.ONE_WEEK]: moment().subtract({ days: 7 }).format(this.olderThanFormat),
        [this.olderThanFilterValues.TWO_WEEKS]: moment().subtract({ days: 14 }).format(this.olderThanFormat),
        [this.olderThanFilterValues.ONE_MONTH]: moment().subtract({ months: 1 }).format(this.olderThanFormat),
        [this.olderThanFilterValues.THREE_MONTHS]: moment().subtract({ months: 3 }).format(this.olderThanFormat),
        [this.olderThanFilterValues.SIX_MONTHS]: moment().subtract({ months: 6 }).format(this.olderThanFormat),
        [this.olderThanFilterValues.TWELVE_MONTHS]: moment().subtract({ months: 12 }).format(this.olderThanFormat),
    };

    private readonly olderThanFilterOptions: Option[] = [
        { value: this.olderThanFilterValues.ONE_WEEK, label: '1 week ago' },
        { value: this.olderThanFilterValues.TWO_WEEKS, label: '2 weeks ago' },
        { value: this.olderThanFilterValues.ONE_MONTH, label: '1 month ago' },
        { value: this.olderThanFilterValues.THREE_MONTHS, label: '3 months ago' },
        { value: this.olderThanFilterValues.SIX_MONTHS, label: '6 months ago' },
        { value: this.olderThanFilterValues.TWELVE_MONTHS, label: '12 months ago' },
    ];

    private readonly productTypeOptions: Option[] = [
        { value: this.CLINICAL_PRODUCT.CODE.DIR_SVC, label: this.CLINICAL_PRODUCT.NAME.TE },
        { value: this.CLINICAL_PRODUCT.CODE.EVAL, label: this.CLINICAL_PRODUCT.NAME.EVAL },
        { value: this.CLINICAL_PRODUCT.CODE.SV, label: this.CLINICAL_PRODUCT.NAME.SV },
        { value: this.CLINICAL_PRODUCT.CODE.BIG, label: this.CLINICAL_PRODUCT.NAME.BIG },
        { value: this.CLINICAL_PRODUCT.CODE.TG, label: this.CLINICAL_PRODUCT.NAME.TG },
    ];

    private readonly referralStateOptions: Option[] = [
        { value: 'UNMATCHED_PL_REVIEW', label: 'Unmatched' },
        { value: 'UNMATCHED_OPEN_TO_PROVIDERS', label: 'Open' },
        { value: 'PROPOSED', label: 'Proposed' },
        { value: 'MATCHED', label: 'Matched' },
        { value: 'CONVERTED+not_started', label: 'Converted - Not Started' },
        { value: 'CONVERTED+in_process', label: 'Converted - In Process' },
        { value: 'CONVERTED+completed', label: 'Converted - Complete' },
    ];

    filters: PLTableFilter[];
    private managedAccountsOnlyFilter: PLTableFilter = {
        value: 'accountCam',
        label: '',
        selectOptsCheckbox: [{ value: 'true', label: 'My Accounts Only' }],
        optionWidth: '100%',
        textArray: ['true'],
    };
    private separatingProvidersFilter: PLTableFilter = {
        value: 'hasProviderSeparationDate',
        label: '',
        selectOptsCheckbox: [{ value: 'true', label: 'Separating Provider Only' }],
        optionWidth: '100%',
        textArray: ['false'],
    };
    private stateInFilter: PLTableFilter = {
        value: 'state_In',
        label: 'Status',
        selectOptsMulti: this.referralStateOptions,
        textArray: this.defaultStateIn,
    };
    private locationFilter: PLLocationFilter;
    private orgFilter: PLOrganizationFilter;
    private locationFilterLimiter: PLLocationsOrganizationsLimiter;

    filtersVisible = true;
    userManagesAccounts = false;
    proposeMatchesButtonDisabled$: Observable<boolean>;
    // updated in onQuery
    private organizationOptions$ = new BehaviorSubject<Option[]>([]);
    private currentUserId: string;
    private currentUserEmail: string;
    private readonly toastrOptionsDefault: Partial<IndividualConfig> = {
        positionClass: 'toast-bottom-right',
        enableHtml: true,
    };
    private readonly toastrOptionsNoAutoHide = {
        ...this.toastrOptionsDefault,
        closeButton: true,
        disableTimeOut: true,
    };

    constructor(
        private plLodash: PLLodashService,
        private plMay: PLMayService,
        private plModal: PLModalService,
        private router: Router,
        private plClientReferrals: PLClientReferralsService,
        private plTableFramework: PLTableFrameworkService,
        private plTableFrameworkUrl: PLTableFrameworkUrlService,
        private plGQLProviderTypes: PLGQLProviderTypesService,
        private plGQLLanguages: PLGQLLanguagesService,
        private plYearsService: PLSchoolYearsService,
        private plLocationsFilterFactory: PLLocationFilterFactory,
        private plOrgFilterFactory: PLOrganizationFilterFactory,
        private plCurrentUserService: CurrentUserService,
        private plTimezoneService: PLTimezoneService,
        private plClientReferralManagerService: PLClientReferralManagerService,
        private plReferralsService: PLReferralsService,
        private toastr: ToastrService,
        private util: PLUtilService,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit() {
        this.proposeMatchesButtonDisabled$ = this.organizationOptions$.pipe(
            map(orgOptions => orgOptions.length === 0),
        );

        // Load all asynchronous table dependencies
        forkJoin([
            this.plCurrentUserService.getCurrentUser().pipe(first()),
            this.getSchoolYearCode(),
            this.util.fetchAll('Providers (REST)', 'providers', { user__is_active: true }),
            this.plGQLProviderTypes.get().pipe(first()),
            this.plGQLLanguages.get().pipe(first()),
        ]).subscribe(([currentUser, schoolYearCode, providers, ..._]: [User, string, any, any, any]) => {
            this.loadingTableDependencies = false;

            this.selectedSchoolYearCode = schoolYearCode;
            this.currentUserId = currentUser.uuid;
            this.currentUserEmail = currentUser.email;
            this.userManagesAccounts = this.plMay.isClinicalAccountManager(currentUser);

            this.locationFilter = this.plLocationsFilterFactory.create({
                value: 'clientLocationId_In',
                label: 'Locations',
            });
            this.orgFilter = this.plOrgFilterFactory.create({
                value: 'clientOrganizationId_In',
                label: 'Organizations',
            });
            this.locationFilterLimiter = new PLLocationsOrganizationsLimiter(
                this.locationFilter,
                this.orgFilter,
                {
                    accountsManagedByUser: this.currentUserId,
                    accountsManagedByUserFilterKey:
                        this.userManagesAccounts ? this.managedAccountsOnlyFilter.value : '',
                },
            );

            this.filters = [
                ...(this.userManagesAccounts ? [this.managedAccountsOnlyFilter] : []),
                this.orgFilter,
                this.locationFilter,
                {
                    value: 'providerId',
                    label: 'Provider',
                    selectOpts: providers.map((p: any) => ({
                        value: p.user,
                        label: `${p.first_name} ${p.last_name}`,
                    })),
                },
                this.separatingProvidersFilter,
                {
                    value: 'providerTypeCode_In',
                    label: 'Discipline',
                    selectOptsCheckbox: this.plGQLProviderTypes.formOpts(),
                    optionWidth: '75px',
                },
                {
                    value: 'productTypeCode_In',
                    label: 'Referral',
                    selectOptsCheckbox: this.productTypeOptions,
                },
                this.stateInFilter,
                {
                    value: 'missing_info',
                    label: 'Referral Details',
                    selectOptsCheckbox: [{ label: 'Missing Info', value: 'true' }],
                },
                {
                    value: 'scheduling',
                    label: 'Scheduling',
                    selectOptsMulti: [
                        { value: 'unscheduled', label: 'Needs Scheduling' },
                        { value: 'scheduled', label: 'Fully Scheduled' },
                    ],
                },
                { value: 'olderThan', label: 'Created Before', selectOpts: this.olderThanFilterOptions },
                { value: 'clientLastName_Icontains', label: 'Last Name' },
                { value: 'clientFirstName_Icontains', label: 'First Name' },
                {
                    value: 'clientPrimaryLanguageCode_In',
                    label: 'Service Language',
                    selectOpts: this.plGQLLanguages.formOpts(),
                },
            ];
            this.cdr.markForCheck();
        });
    }

    /**
     * getSchoolYearCode - sequentially try two sources for the current school
     * year code. First, check the URL for a current school year. If it's not
     * in the URL, then request the school year from the school service.
     */
    getSchoolYearCode(): Observable<string> {
        // Two sources of the initial school year value: route or school year service
        const route: Observable<string> = this.plTableFrameworkUrl.getStateFromUrl(this.tableStateName).pipe(
            first(), // complete to advance concat
            map((res: any) => res.query.schoolYearCode_In || ''),
        );

        const service: Observable<string> = this.plYearsService.getCurrentSchoolYearCode().pipe(first());

        // Sequentially, try the route first. If route does not include school year,
        // then fetch from the service.
        return concat(route, service).pipe(first(code => code.length > 0));
    }

    /**
     * Modal to show providers who previously rejected the referral
     * The propagation is stopped since the call of this function is within another click.
     */
    openCyclesModal(event: any, referral: PLReferral) {
        event.stopPropagation();

        const params = {
            referral,
            client: { firstName: referral.client.firstName, lastName: referral.client.lastName },
        };

        this.plModal.create(PLReferralCyclesModalComponent, params);
    }

    openUnmatchingModal(referral: PLReferral, action: string) {
        const params = { referral, action };

        this.plModal.create(PlClientReferralUnmatchComponent, params).subscribe((modalReference: any) => {
            const modal = modalReference.instance;

            modal.unmatch.subscribe((unmatchReference: any) => {
                if (unmatchReference.result === 'success') {
                    this.plReferralsService.getReferrals(this.gqlParamsForReferralSvc).subscribe({
                        next: ({ referrals, total }) => {
                            this.referrals = referrals;
                            this.total = total;
                            this.displaySuccessToast(unmatchReference.msgTitle, unmatchReference.msg);
                            modal.destroy();
                            this.cdr.markForCheck();
                        },
                    });
                } else {
                    this.displayFailedToast(unmatchReference.msgTitle, unmatchReference.msg);
                    modal.destroy();
                }
            });

            modal.cancel.subscribe(() => modal.destroy());
        });
    }

    /**
     * For unmatching first we need to unmatch and then get the referrals.
     * If unmatch is successful; then get the referrals for updating the buttons of each row
     *
     * @param referral PLReferral object
     * @param action Two buttons call this function, the action tells who is calling
     */
    undoProposedReferral(referral: PLReferral, action: string): void {
        const params = {
            referralId: referral.id,
            reasonToUnmatch: '',
        };
        const errorMsg = 'There was an error while trying to perform this action';
        const successMsg = action === 'Unmatch' ? 'Referral successfully unmatched' : 'Proposal successfuly undone';

        this.plReferralsService.unmatchReferral(params).subscribe({
            next: (unmatched) => {
                if (!unmatched.unmatchReferral.errors) {
                    this.plReferralsService.getReferrals(this.gqlParamsForReferralSvc).subscribe({
                        next: ({ referrals, total }) => {
                            this.referrals = referrals;
                            this.total = total;
                            this.displaySuccessToast('Confirmed', successMsg);
                            this.cdr.markForCheck();
                        },
                    });
                } else {
                    this.displayFailedToast(errorMsg, `Unable to ${action}`);
                }
            },
            error: () => this.displayFailedToast(errorMsg, `Unable to ${action}`),
        });
    }

    toggleFilters() {
        this.filtersVisible = !this.filtersVisible;
    }

    filtersSetModelOptions(event: { filterValue: string, modelValues: string[] }) {
        this.apiFilters().filter(f => f.value === event.filterValue).forEach((filter) => {
            filter.updateModelOptions(event.modelValues);
        });
    }

    filtersSearch(event: { value: string, filterValue: string }) {
        this.apiFilters().filter(f => f.value === event.filterValue).forEach((filter) => {
            filter.setOptionsSearchTerm(event.value);
            filter.updateOptions();
        });
    }

    handleSelectedSchoolYearChange(schoolYearCode: string) {
        this.selectedSchoolYearCode = schoolYearCode;

        this.reQuery();
    }

    isManagedAccountsOnly(): boolean {
        const filter = this.managedAccountsOnlyFilter;
        const isChecked = filter.textArray.includes('true');

        return isChecked && this.userManagesAccounts;
    }

    isProviderSeparating(): boolean {
        const filter = this.separatingProvidersFilter;
        return filter.textArray.includes('true');
    }

    reQuery(): void {
        this.onQuery({ query: this.cachedQuery });
    }

    onQuery(info: { query: any }): void {
        this.loading = true;

        const isProviderSeparating = this.isProviderSeparating();
        this.showSeparatingColumn = isProviderSeparating;

        // Filters query parameters to maintain relationship between
        // my accounts only, orgs, and locations filters.
        const managedAccountsFilterKey = this.managedAccountsOnlyFilter.value;
        const separatingFilterKey = this.separatingProvidersFilter.value;
        let statesArray = [...this.stateInFilter.textArray];
        const convertedFilter = statesArray.find(s => s.includes('CONVERTED'));
        if (isProviderSeparating) {
            if (!this.stateInFilter.textArray.length) {
                statesArray = [...this.defaultStateIn];
            }
            const STATES_TO_ADD = ['CONVERTED+not_started', 'CONVERTED+in_process'];
            if (!convertedFilter) {
                statesArray = [...this.defaultStateIn, ...STATES_TO_ADD];
            }
            this.stateInFilter.textArray = statesArray;
            info.query.state_In = statesArray.join(',');
        }
        const query = this.locationFilterLimiter.onQuery({
            // defaults; can be overwritten by query params below
            orderBy: this.QUERY_SORT_DEFAULT,
            state_In: this.defaultStateIn.join(','),

            // There are two reasons we need to check the managedAccountsOnly filter
            // value manually here:
            // 1) on the initial query, if the filter was set by _default_, then the table
            //    framework won't include that set filter value in the query object
            // 2) if the filter had been checked, and is now being unchecked, then we want to
            //    omit the filter param altogether from the query and the soon-to-be-updated URL
            ...this.plLodash.omit(info.query, [managedAccountsFilterKey, separatingFilterKey]),
            ...this.isManagedAccountsOnly() ? { [managedAccountsFilterKey]: this.currentUserId } : {},
            ...isProviderSeparating ? { [separatingFilterKey]: true } : {},

            // Not a table filter; include manually
            schoolYearCode_In: this.selectedSchoolYearCode === 'all_time' ? null : this.selectedSchoolYearCode,
        });

        // Cache the query _after_ applying locationFilterLimiter so the side-effects of
        // the limiter persist. (E.g., the limiter might clear the locations filter. In this
        // case we want to save the query object that does not have the location filter value.)
        this.cachedQuery = query;

        // The isManagedAccountsOnly url parameter is hacked here. In the absence of a URL parameter
        // in the URL, when the user is a CAM we check the filter ('true'). To persist an unchecked
        // filter checkbox, we force the parameter to 'false'. This serves as a kind of sentinel value;
        // when the table framework parses the URL, it will set the my accounts filter to 'false',
        // effectively unchecking it. (It could be any value other than 'true'; I chose 'false' for
        // what it conveys in the URL.)
        const urlParams = this.plTableFramework.getQueryParams({
            ...this.plLodash.omit(query, [managedAccountsFilterKey]),
            [managedAccountsFilterKey]: this.isManagedAccountsOnly() ? 'true' : 'false',
            [separatingFilterKey]: this.isProviderSeparating() ? 'true' : 'false',
        });
        this.plTableFrameworkUrl.updateUrl(this.tableStateName, urlParams);

        const schedulingParams = (value: string): { isScheduled?: boolean } => {
            const values = value.split(',');
            const unscheduled = values.includes('unscheduled');
            const scheduled = values.includes('scheduled');

            return {
                // If neither or both boxes are checked, then omit the isScheduled parameter.
                ...(unscheduled !== scheduled ? { isScheduled: scheduled } : {}),
            };
        };

        this.gqlParamsForReferralSvc = {
            ...this.plLodash.omit(query, ['missing_info', 'page', 'scheduling']),
            // Since the date is not canonical, add to query params after updating URL
            ...(query.olderThan in this.olderThanFilterTimes ?
                { created_Lt: this.olderThanFilterTimes[query.olderThan] } : {}
            ),
            ...(query.scheduling ? schedulingParams(query.scheduling) : {}),
            ...(query.missing_info ? { isMissingInformation: true } : {}),
        };

        const organizationOptionParams = this.isManagedAccountsOnly() ? { accountCam: this.currentUserId } : {};

        forkJoin([
            this.plReferralsService.getReferrals(this.gqlParamsForReferralSvc),
            // Update organizations options here because the query depends on the managed
            // accounts filter value, and we find out about changes to that value in onQuery.
            this.plClientReferralManagerService.getOrganizationOptions(organizationOptionParams),
        ]).subscribe(([{ referrals, total }, orgOptions]) => {
            this.referrals = referrals;
            this.selectedReferrals = this.selectedReferrals
                .filter(uuid => this.referrals.find(r => r.id === uuid));
            this.showReassign = this.canReassign();
            this.total = total;
            this.organizationOptions$.next(orgOptions);

            this.loading = false;
        });
    }

    providerName({ provider }: PLReferral): string {
        return provider ? `${provider.firstName} ${provider.lastName}` : '';
    }

    statusLabel({ state, isMissingInformation, isScheduled, clientService }: PLReferral): string {
        // Due to narrow space for table columns, these labels include
        // soft hyphens (\u00AD) indicating where to hyphenate when necessary.
        // Comments are to enable searching code for these terms.
        const stateLabels = {
            UNMATCHED_PL_REVIEW: 'Un\u00ADmatched', // Unmatched
            UNMATCHED_OPEN_TO_PROVIDERS: 'Open',
            PROPOSED: 'Proposed',
            MATCHED: 'Matched',
            CONVERTED: 'Con\u00ADverted', // Converted
        };

        const scheduledLabel = () => {
            if (isScheduled) {
                return 'Sched\u00ADuled'; // Scheduled
            }

            if (isMissingInformation) {
                return 'Missing Info';
            }

            if (isScheduled !== undefined && isScheduled !== null && !isScheduled) {
                return 'Un\u00ADsched\u00ADuled'; // Unscheduled
            }
        };
        let statusLabel: string = stateLabels[state];
        if (state === 'CONVERTED' && clientService) {
            const { status } = clientService;
            const statusLabels = {
                NOT_STARTED: 'Not Started',
                IN_PROCESS: 'In Progress',
                COMPLETED: 'Completed',
                CANCELLED: 'Cancelled',
            };
            statusLabel = statusLabels[status] || status;
        }

        if (scheduledLabel()) {
            statusLabel += `, ${scheduledLabel()}`;
        }

        return statusLabel;
    }

    tableCellClasses(referral: PLReferral): any {
        return { pointer: referral.permissions.updateReferral };
    }

    selectedProposedReferrals(): any[] {
        return this.selectedReferralsOnPage().filter(r => r.state === 'PROPOSED');
    }

    selectedReferralsOnPage(): PLReferral[] {
        return this.referrals.filter(r => this.selectedReferrals.includes(r.id));
    }

    showConfirmButton(): boolean {
        return this.selectedProposedReferrals().length > 0;
    }

    confirmButtonLabel(): string {
        const selectedCount = this.selectedProposedReferrals().length;

        return `Confirm ${selectedCount} ${selectedCount === 1 ? 'Match' : 'Matches'}`;
    }

    showConfirmEditButtons(referral: PLReferral): boolean {
        return referral.state === 'PROPOSED';
    }

    showMatchButton(referral: PLReferral): boolean {
        return referral.permissions.matchProvider
            && ['UNMATCHED_PL_REVIEW', 'UNMATCHED_OPEN_TO_PROVIDERS'].includes(referral.state);
    }

    showUnmatchButton(referral: PLReferral): boolean {
        return referral.permissions.unmatchReferral && referral.state === this.DEFAULT_STATE.M;
    }

    changeSelectRow(referral: PLReferral) {
        if (!this.isRowSelected(referral)) {
            this.selectedReferrals.push(referral.id);
        } else {
            const index = this.selectedReferrals.indexOf(referral.id);
            this.selectedReferrals.splice(index, 1);
            // Uncheck select all checkbox if it was selected.
            if (!this.selectedReferrals.length && this.allChecked) {
                this.allChecked = false;
            }
        }
        this.showReassign = this.canReassign();
    }

    isRowSelected(referral: PLReferral): boolean {
        return this.selectedReferrals.includes(referral.id);
    }

    countRowsSelected() {
        return this.selectedReferrals.length;
    }

    changeSelectAllPage() {
        if (this.allChecked) {
            this.selectAllPage();
        } else {
            this.unselectAllPage();
        }
        this.showReassign = this.canReassign();
    }

    selectAllPage() {
        this.referrals.forEach((referral: any) => {
            if (this.selectedReferrals.indexOf(referral.id) < 0) {
                this.selectedReferrals.push(referral.id);
            }
        });
    }

    unselectAllPage() {
        this.referrals.forEach((referral) => {
            const index = this.selectedReferrals.indexOf(referral.id);
            if (index > -1) {
                this.selectedReferrals.splice(index, 1);
            }
        });
    }

    unselectAllEverywhere() {
        this.selectedReferrals = [];
        this.allChecked = false;
    }

    canReassign() {
        // this.showReassignLink = (this.service.permissions.reassignEvaluation ||
        //     this.service.permissions.reassignEvaluationWithoutBillingImplicationCheck);
        if (!this.selectedReferrals.length) {
            return false;
        }
        const referrals = this.selectedReferralsOnPage();
        const organizations = [...new Set(referrals.map(r => r.organizationId))];
        if (organizations.length > 1) {
            return false;
        }
        const disciplines = [...new Set(referrals.map(r => r.discipline))];
        if (disciplines.length > 1) {
            return false;
        }
        const states = [...new Set(referrals.map(r => r.state))];
        const allowStates = ['UNMATCHED_PL_REVIEW', 'PROPOSED', 'MATCHED', 'CONVERTED'];
        if (!states.map(s => allowStates.includes(s))
            .reduce((p, c) => p && c, true)) {
            return false;
        }
        const status = [...new Set(referrals.filter(r => !!r.clientService)
            .map(r => r.clientService.status))];
        const notAllowStatus = ['COMPLETED', 'CANCELLED'];
        return status.map(s => !notAllowStatus.includes(s))
            .reduce((p, c) => p && c, true);
    }

    handleConfirmReferralMatchesClick(): void {
        const proposedReferrals = this.selectedProposedReferrals();
        const allReferrals = this.selectedReferralsOnPage();

        this.plReferralsService.confirmProposedMatches(proposedReferrals.map(r => r.id)).subscribe({
            error: () => {
                this.displayFailedToast('Unable to Confirm Matches', 'There was an error while trying to confirm these matches');
            },
            next: (newReferrals: PLReferral[]) => {
                this.referrals = newReferrals.reduce(this.updateReferral, this.referrals);
            },
            complete: () => {
                const quantifier = `${proposedReferrals.length} referral${proposedReferrals.length === 1 ? '' : 's'}`;

                this.displaySuccessToast('Confirmed', `Confirmed matches for ${quantifier}. Matched providers have been notified.`);

                if (proposedReferrals.length !== allReferrals.length) {
                    const otherReferrals = allReferrals.filter(r => !proposedReferrals.includes(r)).map((r) => {
                        const productType = r.productTypeName.toLowerCase();

                        return `<p>${r.client.lastName}, ${r.client.firstName} (${r.discipline} ${productType})</p>`;
                    });

                    const message = `<p>The following did not have proposed matches and were
                                    not confirmed: ${otherReferrals.join('')}`;

                    this.toastr.error(
                        message,
                        'Unable to Confirm',
                        {
                            enableHtml: true,
                            ...this.toastrOptionsDefault,
                        },
                    );
                }

                this.unselectAllPage();
            },
        });
    }

    handleConfirmReferralMatchClick(referral: PLReferral): void {
        const params = {
            referralId: referral.id,
            providerUserId: referral.provider.id,
        };

        this.plReferralsService.matchReferral(params).subscribe({
            next: (newReferral: PLReferral) => {
                const message = `Match confirmed. ${this.providerName(newReferral)} has been notified`;
                this.displaySuccessToast('Confirmed', message);

                this.referrals = this.updateReferral(this.referrals, newReferral);
                this.cdr.markForCheck();
            },
            error: () => this.displayFailedToast('Unable to Confirm Match', 'There was an error while trying to confirm this match'),
        });
    }

    handleReasingReferralsClick() {
        this.plModal.create(PLClientReferralReassignComponent)
            .pipe(
                switchMap((modalReference) => {
                    const modal: PLClientReferralReassignComponent = modalReference.instance;
                    modal.referrals = this.selectedReferralsOnPage();
                    modal.currentUserEmail = this.currentUserEmail;
                    return modal.closed$;
                }),
            ).subscribe(({ type, errors }) => {
                if (type === 'submit') {
                    const succeed = this.selectedReferrals.length - errors.length;
                    if (errors && errors.length) {
                        const t = errors.map(({ error }) => error).join('<br/>');
                        this.displayFailedToast('Unable to Reassign', t);
                    } else if (succeed) {
                        this.displaySuccessToast('Referrals Reassigned', `(${succeed}) referrals succesfully reassigned.`);
                        this.selectedReferrals = [];
                    }
                    this.reQuery();
                }
                this.plModal.destroyAll();
            });
    }

    handleEditReferralMatchClick(referral: PLReferral) {
        const params: any = {
            referral,
            client: referral.client,
            notesFromReferral: referral.notes,
        };

        this.plModal.create(PLClientReferralMatchComponent, params).subscribe((modalReference: any) => {
            const modal = modalReference.instance;

            modal.match.subscribe(({ referral: newReferral }: { referral: PLReferral }) => {
                const message = `Match confirmed. ${this.providerName(newReferral)} has been notified`;
                this.displaySuccessToast('Confirmed', message);

                this.referrals = this.updateReferral(this.referrals, newReferral);
                modal.destroy();
                this.cdr.markForCheck();
            });

            modal.proposeMatch.subscribe(({ referral: newReferral }: { referral: PLReferral }) => {
                const clientName = `${newReferral.client.firstName} ${newReferral.client.lastName}`;
                const message = `${this.providerName(newReferral)} has been proposed as a match for ${clientName}.`;
                this.displaySuccessToast('Proposed Match', message);

                this.referrals = this.updateReferral(this.referrals, newReferral);
                modal.destroy();
                this.cdr.markForCheck();
            });

            modal.cancel.subscribe(() => modal.destroy());
        });
    }

    showMoveToOpenButton(): boolean {
        return this.selectedReferrals.length > 0;
    }

    handleMoveReferralsToOpenClick() {
        const variables: any = {
            referralIds: this.selectedReferrals,
        };

        this.plReferralsService.sendToProviders(variables).subscribe((res: any) => {
            const data: any = res.sendToProviders;
            // handle top level errors
            if (data.errors && data.errors.length) {
                console.log('GQL: move to open referrals', data.errors);
                // TODO: how to represent multiple errors... For now, show the first one.
                this.displayFailedToast('Errors Moving Referrals to Open', data.errors[0].message);
            } else {
                // handle results
                this.handleMoveToOpenApiResponse(data);
            }

            this.unselectAllEverywhere();
        });
    }

    handleProposeMatchesClick(): void {
        forkJoin([
            this.plYearsService.getYearForCodeAsync(this.selectedSchoolYearCode),
            // This assumes that it's not possible to click the propose matches button
            // until there are organizations options in the first place.
            this.organizationOptions$.pipe(first()),
        ]).subscribe(([{ name: schoolYearLabel }, orgOptions]) => {
            const params = {
                schoolYearLabel,
                organizationOptions: orgOptions,
            };

            this.plModal.create(PLClientReferralsProposeMatchesComponent, params).subscribe((modalReference: any) => {
                const modal = modalReference.instance;

                modal.proposeMatches.subscribe((event: ProposeMatchesEvent) => {
                    const organizationId = event.organizationId;
                    const proposeMatchesParams = {
                        ...event,
                        schoolYearCode: this.selectedSchoolYearCode,
                    };

                    this.plReferralsService.proposeMatches(proposeMatchesParams).subscribe({
                        next: (newReferrals) => {
                            // proposeMatches emits all referrals in the organization. If any remain
                            // in an unmatched state, then we were not able to generate proposals for
                            // all of the referrals.
                            const unmatchedReferrals = newReferrals.filter(f => f.state === 'UNMATCHED_PL_REVIEW');

                            if (unmatchedReferrals.length > 0) {
                                const orgName = params.organizationOptions.find(o => o.value === organizationId).label;

                                const message = `We were able to propose matches for all but
                                                 ${unmatchedReferrals.length} referrals for ${orgName}.
                                                 Please review the referrals that still require a provider match
                                                 proposal and request additional providers if necessary.`;
                                this.toastr.info(message, 'Some Matches Proposed', this.toastrOptionsNoAutoHide);
                            } else {
                                const message = `We were able to propose matches for all of your referrals,
                                                 please go to the location profile to schedule these students.`;
                                this.displaySuccessToast('Matches Proposed', message);
                            }

                            this.referrals = newReferrals.reduce(this.updateReferral, this.referrals);

                            modal.destroy();
                        },
                        error: () => {
                            modal.destroy();
                        },
                    });
                });
                modal.cancel.subscribe(() => modal.destroy());
            });
        });
    }

    handleMoveToOpenApiResponse(data: any) {
        const results: any = data.results.reduce(
            (output: any, item: any) => {
                if (item.status === 'ok') {
                    output.ok.push(item);
                } else if (item.status === 'error') {
                    output.error.push(item);
                }
                return output;
            },
            { ok: [], error: [] },
        );

        if (results.error.length === 0) {
            // ALL successful
            const message = `(${results.ok.length}) referrals moved to Open`;
            this.displaySuccessToast('Referrals Moved', message);
            this.reQuery();
        } else if (results.ok.length) {
            // SOME successful
            const message = `(${results.ok.length}) referrals moved to Open and (${results.error.length}) were ineligible to be moved`;
            this.toastr.info(message, 'Some Referrals Moved', this.toastrOptionsNoAutoHide);
            this.reQuery();
        } else {
            // NONE successful
            const message = `All (${results.error.length}) referrals were ineligible to be moved`;
            this.toastr.warning(message, 'No Referrals Moved', this.toastrOptionsNoAutoHide);
        }
    }

    clickReferral(referral: any) {
        const notAllowStates = ['DELETED', 'CONVERTED'];
        if (notAllowStates.includes(referral.state)) {
            return;
        }
        if (referral.permissions.updateReferral) {
            this.router.navigate(['/client-referral-save'], {
                queryParams: { client: referral.client.id, referral: referral.id },
            });
        }
    }

    //#region Private Functions

    private apiFilters(): PLMultiSelectApiFilter[] {
        return [this.orgFilter, this.locationFilter];
    }

    private displayFailedToast(title: string, msg: string): void {
        this.toastr.error(msg, title, this.toastrOptionsDefault);
    }

    private displaySuccessToast(title: string, msg: string): void {
        this.toastr.success(msg, title, this.toastrOptionsDefault);
    }

    private updateReferral(referrals: PLReferral[], newReferral: PLReferral): PLReferral[] {
        return referrals.map(r => r.id === newReferral.id ? newReferral : r);
    }

    //#endregion Private Functions
}
