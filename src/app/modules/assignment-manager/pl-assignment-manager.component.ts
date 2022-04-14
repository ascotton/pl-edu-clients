import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject, forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import {
    PLModalService,
    PLConfirmDialogService,
    PLTableFrameworkService,
    PLTableFrameworkUrlService,
    PLStylesService,
    PLTimezoneService,
} from '@root/index';

import { PLUtilService } from '@common/services';
import { CurrentUserService } from '@modules/user/current-user.service';
import { Option } from '@common/interfaces';
import { PLFadeInAnimation, PLFadeInOutAnimation } from '@common/animations';
import { fadeOutOnLeaveAnimation, zoomInDownOnEnterAnimation } from 'angular-animations';
import { PLCamDashboardTabsService } from '../cam-dashboard';

import {
    PLAssignmentManagerService,
    PLOrgDemandItem,
    PLOpptyDemandItem,
    PLAssignmentProposalItem,
    PLAssignmentProposalRaw,
    StatusUpdateResults,
    PLAssignmentStatusEnum,
    PLAssignmentRequirement,
} from './pl-assignment-manager.service';

import { PLCustomAssignmentModalComponent } from './pl-custom-assignment-modal.component';
import { PLRejectAssignmentModalComponent } from './pl-reject-assignments-modal.component';
import { PLUserService } from '../users/pl-user.service';
import { PLSubNavigationTabs } from '../../common/interfaces/pl-sub-navigation-tabs';

@Component({
    selector: 'pl-assignment-manager',
    templateUrl: './pl-assignment-manager.component.html',
    styleUrls: ['./pl-assignment-manager.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DecimalPipe],
    animations: [
        PLFadeInAnimation,
        PLFadeInOutAnimation,
        zoomInDownOnEnterAnimation({ anchor: 'zoomInDown', duration: 750 }),
        fadeOutOnLeaveAnimation({ anchor: 'fadeOut', duration: 500 }),
    ],
})
export class PLAssignmentManagerComponent implements OnInit, OnDestroy {

    // data
    user: any;
    orgDemandList: PLOrgDemandItem[] = [];
    serviceTypeInfo: any;
    schoolYearInfo: any;
    organizationOpts: Option[];
    stateOpts: Option[];
    providers: any[];
    providerOpts: Option[];
    providerOptsWithType: Option[];
    assignmentStatusOpts = this.service.ASSIGNMENT_STATUS_OPTS;
    camOpts: Option[];
    isDataLoaded = false;

    // model and state
    selectedSchoolYear: string;
    selectedRows: any = {};

    // track whether a query is in flight
    loading = true;
    lastQueryId: number;

    // if a query is in flight, track whether another query has been requested
    // e.g. if another filter has been applied
    reQueryRequestedWhileInFlight = false;

    initialized = false;
    lastQuery: any = {};
    filtersVisible = true;
    lastSelectedRow: {
        proposalItem: PLAssignmentProposalItem,
        orgDemandItem: PLOrgDemandItem,
        opptyDemandItem: PLOpptyDemandItem,
    };
    routeParams: any;

    // table framework related
    total: number;
    currentPage: number;
    pageSize = 10;
    useFixedPageSize = true;
    tableStateName = 'cam';

    // filter related
    DEFAULT_ORG_FILTERS = ['my_accounts', 'unfilled_accounts'];
    DEFAULT_STATUS_FILTERS = [
        'proposed',
        'locked',
        'reserved',
        'initiated',
        'pending',
        'active',
        'capacity_planning',
        'capacity_planning_locked',
    ];
    QUERY_SORT_DEFAULT = 'name';
    FilterKey = this.service.FilterKey;

    // other
    meterColor: string;
    meterBackgroundColor: string;
    checkChangesTimeout: any;
    initialUrlParams: any;
    onQueryElapsed = 0;
    buttonRefresh = false;
    includeProposedInTotals = true;
    includeCapacityInTotals = false;

    tabs: PLSubNavigationTabs[] = [];

    filtersMap: any = {
        [this.FilterKey.ORGANIZATION]: {
            label: 'Organizations',
            value: this.FilterKey.ORGANIZATION,
            selectOptsMulti: [],
        },
        [this.FilterKey.STATE]: {
            label: 'State',
            value: this.FilterKey.STATE,
            selectOptsMulti: [],
        },
        [this.FilterKey.PROBABILITY]: {
            label: 'Minimum Probability',
            value: this.FilterKey.PROBABILITY,
            selectOptsBigFilter: this.service.PROBABILITIES_OPTS,
        },
        [this.FilterKey.PROBABILITY_MAX]: {
            label: 'Maximum Probability',
            value: this.FilterKey.PROBABILITY_MAX,
            selectOptsBigFilter: this.service.PROBABILITIES_MAX_OPTS,
        },
        [this.FilterKey.START_DATE_GTE]: {
            label: 'Start Date Between',
            value: this.FilterKey.START_DATE_GTE,
            datepicker: true,
        },
        [this.FilterKey.START_DATE_LT]: {
            value: this.FilterKey.START_DATE_LT,
            datepicker: true,
        },
        [this.FilterKey.SERVICE_TYPE]: {
            label: 'Service Types',
            value: this.FilterKey.SERVICE_TYPE,
            selectOptsMulti: [],
        },
        [this.FilterKey.STATUS]: {
            label: 'Assignment Status',
            value: this.FilterKey.STATUS,
            selectOptsMulti: this.service.ASSIGNMENT_STATUS_OPTS,
        },
        [this.FilterKey.PROVIDER]: {
            label: 'Provider',
            value: this.FilterKey.PROVIDER,
            selectOptsBigFilter: [],
        },
        [this.FilterKey.CAM]: {
            label: 'CAM',
            value: this.FilterKey.CAM,
            selectOptsBigFilter: [],
        },
        [this.FilterKey.ORG_FILTERS]: {
            value: this.FilterKey.ORG_FILTERS,
            optionWidth: '200px',
            selectOptsCheckbox: [
                { value: 'my_accounts', label: 'My Accounts Only' },
                { value: 'unfilled_accounts', label: 'Needs Attention Only' },
            ],
        },
    };

    filters: any[] = [
        this.filtersMap[this.FilterKey.ORG_FILTERS],
        this.filtersMap[this.FilterKey.ORGANIZATION],
        this.filtersMap[this.FilterKey.STATE],
        this.filtersMap[this.FilterKey.PROBABILITY],
        this.filtersMap[this.FilterKey.PROBABILITY_MAX],
        this.filtersMap[this.FilterKey.START_DATE_GTE],
        this.filtersMap[this.FilterKey.START_DATE_LT],
        this.filtersMap[this.FilterKey.SERVICE_TYPE],
        this.filtersMap[this.FilterKey.STATUS],
        this.filtersMap[this.FilterKey.PROVIDER],
        this.filtersMap[this.FilterKey.CAM],
    ];

    destroyed$ = new Subject<boolean>();

    constructor(
        public util: PLUtilService,
        private decimalPipe: DecimalPipe,
        private toastr: ToastrService,
        private plStyles: PLStylesService,
        private tabService: PLCamDashboardTabsService,
        private plModal: PLModalService,
        private plConfirm: PLConfirmDialogService,
        private service: PLAssignmentManagerService,
        private tableService: PLTableFrameworkService,
        private tableUrlService: PLTableFrameworkUrlService,
        private currentUserService: CurrentUserService,
        private cdr: ChangeDetectorRef,
        private plTimezoneSvc: PLTimezoneService,
        private plUserService: PLUserService,
    ) { }

    ngOnInit() {
        this.tabs = this.tabService.tabs();

        this.meterColor = `#${this.plStyles.getColorForName('blue-light')}`;
        this.meterBackgroundColor = `#${this.plStyles.getColorForName('white')}`;

        this.initStates();

        forkJoin([
            this.initUserObservable(),
            this.initOrganizationsObservable(),
            this.initServiceTypesObservable(),
            this.initProvidersObservable(),
            this.initSchoolYearsObservable(),
            this.initCamsListObservable(),
        ]).subscribe(([
            user,
            orgsResult,
            serviceTypesResult,
            providersResult,
            schoolYearsResult,
            camsListResult,
        ]: [
            any,
            any,
            any,
            any,
            any,
            any,
        ]) => {
            // getStateFromUrl() does not work in forkJoin
            this.tableUrlService.getStateFromUrl(this.tableStateName).subscribe((res: any) => {
                this.initialUrlParams = res.query;
                this.util.log('initial url params', { urlParams: this.initialUrlParams, STATE: this });
                if (localStorage.getItem('PL_DEBUG_QUERY') && this.initialUrlParams.limit) {
                    this.pageSize = Number(this.initialUrlParams.limit);
                }

                this.initFilters();
                this.initUser(user);
                this.initOrganizations(orgsResult);
                this.initServiceTypes(serviceTypesResult);
                this.initProviders(providersResult);
                this.initSchoolYears(schoolYearsResult);
                this.initCamsList(camsListResult);

                this.isDataLoaded = true;
            });
        });

        const fn = () => {
            this.checkChangesTimeout = setTimeout(() => {
                this.cdr.markForCheck();
                fn();
            }, 150);
        };
        fn();
    }

    initFilters() {
        const params = this.initialUrlParams;
        if (!params.INIT) {
            this.filtersMap[this.FilterKey.ORG_FILTERS].textArray = this.DEFAULT_ORG_FILTERS;
            this.filtersMap[this.FilterKey.STATUS].textArray = this.DEFAULT_STATUS_FILTERS;
            this.updateFilters();
        } else {
            this.initFiltersFromUrlParams(params);
        }
    }

    initFiltersFromUrlParams(params: any) {
        for (const key in params) {
            if (this.filtersMap[key] && params[key]) {
                this.filtersMap[key].textArray = params[key].split(',');
            }
        }
        this.updateFilters();
    }

    initUserObservable() {
        return this.currentUserService.getCurrentUser().pipe(first());
    }

    initUser(user: any) {
        this.user = user;
    }

    initServiceTypesObservable() {
        return this.service.fetchServiceTypes();
    }

    initServiceTypes(res: any) {
        this.serviceTypeInfo = this.service.buildServiceTypeInfo(res);
        this.filtersMap[this.FilterKey.SERVICE_TYPE].selectOptsMulti = this.serviceTypeInfo.opts;
    }

    initOrganizationsObservable() {
        return this.service.fetchOrganizations({ orderBy: 'name' });
    }

    initOrganizations(res: any) {
        this.organizationOpts = this.service.buildOrganizationOpts(res);
        this.filtersMap[this.FilterKey.ORGANIZATION].selectOptsMulti = this.organizationOpts;
    }

    initStates() {
        this.stateOpts = this.service.fetchStates();
        this.filtersMap[this.FilterKey.STATE].selectOptsMulti = this.stateOpts;
    }

    initProvidersObservable() {
        const providers$ = this.service.fetchProviders();

        return forkJoin([providers$]).pipe(first());
    }

    initProviders(res: any) {
        const providers = this.providers = res[0];
        this.providerOpts = this.service.buildProviderOpts(providers);
        this.filtersMap[this.FilterKey.PROVIDER].selectOptsBigFilter = this.providerOpts;
    }

    initSchoolYearsObservable() {
        return this.service.fetchSchoolYearsInfo();
    }

    initSchoolYears(res: any) {
        this.schoolYearInfo =  res;
        const params = this.initialUrlParams;
        const sy = params.school_year;
        if (sy) {
            this.selectedSchoolYear = sy;
        } else {
            this.selectedSchoolYear = res.currentSchoolYear.id;
        }
    }

    initCamsListObservable() {
        const params = {
            group__in: 'Clinical Account Manager',
            is_active: true,
            limit: 100,
        };

        return this.plUserService.getUsersOnce(params);
    }

    initCamsList(results: any) {
        this.camOpts = results.users.map((user: any) => ({
            label: `${user.user.firstName} ${user.user.lastName}`,
            value: user.user.id,
        }));
        this.filtersMap[this.FilterKey.CAM].selectOptsBigFilter = this.camOpts;
    }

    onQuery(inParams: { query: any }) {
        // ignore untl we're ready
        if (!this.isDataLoaded) return;

        // Prepare values to store as "lastQuery"
        const lastQuery = { ...this.lastQuery };
        const params = this.lastQuery = inParams.query;

        if (!params.orderBy) {
            params.orderBy = this.QUERY_SORT_DEFAULT;
        }
        const init = this.initialUrlParams.INIT || lastQuery.INIT;
        params.INIT = 1;

        // Any filter action should reset to page 1
        // SY is a custom filter and requires this treatment
        if (this.selectedSchoolYear !== lastQuery.school_year) {
            this.currentPage = params.page = 1;
        }

        params.school_year = this.selectedSchoolYear;

        // build up query for /demand
        let query = {
            ...params,
        };

        // handle param defaults and transformations
        if (!init) {
            params[this.FilterKey.ORG_FILTERS] = [this.FilterKey.MY_ACCOUNTS, this.FilterKey.UNFILLED_ACCOUNTS];
            query.cam = this.user.uuid;
            query.unmet_demand = true;
            const statusFilters = this.filtersMap[this.FilterKey.STATUS].textArray;
            params[this.FilterKey.STATUS] = query[this.FilterKey.STATUS] = statusFilters.join(',');
            query.limit = params['limit'] = this.pageSize;
        } else {
            // defaults
            const orgFilters = params[this.FilterKey.ORG_FILTERS];
            if (orgFilters && orgFilters.indexOf(this.FilterKey.MY_ACCOUNTS) > -1) {
                query.cam = this.user.uuid;
            }
            if (orgFilters && orgFilters.indexOf(this.FilterKey.UNFILLED_ACCOUNTS) > -1) {
                query.unmet_demand = true;
            }
        }

        // to prevent out of order data, block requests while in flight.
        if (this.initialized && this.loading) {
            this.reQueryRequestedWhileInFlight = true;
            this.util.log(`re-query blocked... while in flight`);
            return;
        }

        // update url
        const queryParams = this.tableService.getQueryParams(params);
        this.tableUrlService.updateUrl(this.tableStateName, queryParams);

        // finalize query for /demand
        query = (({ INIT, orgFilters_In, ...r } = query) => r)();

        // scroll to the top of the view to see new data
        document.querySelectorAll('#pageTop')[0].scrollIntoView({ behavior: 'auto', block: 'end' });

        // timing
        const start = new Date().getTime();

        this.loading = true;
        const queryId = this.lastQueryId = Math.round(Math.random() * 1000);
        this.pageSize = query.limit || this.pageSize;
        this.util.log(`start query`, { __queryId: queryId });

        // TODO: change this to use a long lived observable for better control flow
        this.service.fetchDemand(query).subscribe(
            (res: any) => {
                this.loading = false;

                // timing
                const elapsed = Math.round(new Date().getTime() - start);

                // Single-flight serialization (not queued)
                if (this.reQueryRequestedWhileInFlight) {
                    this.util.log(`re-query requested after ${elapsed}ms`);
                    this.reQueryRequestedWhileInFlight = false;
                    this.onQuery({ query: this.lastQuery });
                    return;
                }

                // NOTE: if single-flight (above) is removed, make sure the last concurrent query wins.
                if (queryId !== this.lastQueryId) {
                    this.util.log(`multi-flight detected... skipping`, {
                        __queryId: queryId,
                        _params: params,
                        _query: query,
                    });
                    return;
                }

                if (this.util.flagLocalStorage('PL_DEBUG_QUERY')) {
                    this.onQueryElapsed = elapsed;
                }

                this.total = res.count;
                this.orgDemandList = this.service.buildOrgDemandList(
                    res.results,
                    this.includeProposedInTotals,
                    this.includeCapacityInTotals,
                    this.lastQuery.status,
                    this.plTimezoneSvc,
                    this.user.timezone,
                );
                this.resetAllOpptyDemands();
                this.initialized = true;

                this.util.log(`end query`, {
                    __queryId: queryId,
                    _elapsed: elapsed,
                    _params: params,
                    _query: query,
                    orgDemandList: this.orgDemandList,
                    orgDemandRaw: res.results,
                    STATE: this,
                });
            },
            (err: any) => {
                this.util.elog('/demand onQuery ERROR', { err, params, query, STATE: this });
                this.loading = false;
            });
    }

    onClickApprove() {
        const APPROVED = PLAssignmentStatusEnum.RESERVED;
        const items: PLAssignmentProposalItem[] = Object.values(this.selectedRows);
        this.service
            .bulkUpdateProposals(this.orgDemandList, this.selectedRows, items, APPROVED)
            .pipe(first())
            .subscribe((res: StatusUpdateResults) => {
                this.util.log('approved proposals', { res, STATE: this });
                this.service.toastStatusResults(res);

                this.updateFulfillmentTotals();
            });
        this.resetAllOpptyDemands();
    }

    onClickReject() {
        let modalRef: any;
        // Reject UI is constrained to 1 proposal
        const selectedProposals = Object.values(this.selectedRows);
        const camProposal = selectedProposals && selectedProposals[0];

        const params: any = {
            camProposal,
            orgDemandList: this.orgDemandList,
            selectedRows: this.selectedRows,
            rejectedReasonsOpts: this.service.PL_REJECTED_REASONS_OPTS,
            onCancel: () => {
                modalRef.instance.destroy();
            },
            onSaveSuccess: (res: PLAssignmentProposalItem) => {
                this.toastr.success(`Successfully rejected assignment`, '🎉 SUCCESS', {
                    positionClass: 'toast-bottom-right',
                    timeOut: TOAST_TIMEOUT,
                });
                modalRef.instance.destroy();

                this.updateFulfillmentTotals();
            },
            onSaveError: (err: any) => {
                this.toastr.success(`Unable to reject assignment`, '🎉 SUCCESS', {
                    positionClass: 'toast-bottom-right',
                    timeOut: TOAST_TIMEOUT,
                });
            },
        };
        this.plModal.create(PLRejectAssignmentModalComponent, params)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }

    onClickAddEdit(
        opptyDemandItem: PLOpptyDemandItem,
        orgDemandItem: PLOrgDemandItem,
        proposalItem?: PLAssignmentProposalItem,
    ) {
        this.util.log('-- item', { proposalItem, opptyDemandItem, orgDemandItem, STATE: this });
        let modalRef: any;

        const includePending = this.includeCapacityInTotals;
        this.loading = true;

        this.service.fetchProviderPool(opptyDemandItem.uuid, includePending, false).subscribe((pool: any) => {
            this.loading = false;
            this.providerOptsWithType = this.service.buildProviderOptsWithType(pool.providers);

            this.util.log('providerPool', { pool, providerOpts: this.providerOptsWithType, STATE: this });
            if (!pool.providers.length && !proposalItem) {
                this.plConfirm.show({
                    header: 'Provider List',
                    content: `No eligible providers available`,
                    primaryLabel: 'OK',
                    primaryCallback: () => {
                        this.plConfirm.hide();
                    },
                });
                return;
            }
            const providerPoolOpts =
                pool.providers.map((p: any) => this.providerOptsWithType.find((po: any) => p.uuid === po.value));
            const params: any = {
                opptyDemandItem,
                orgDemandItem,
                includePending,
                proposalItem, // for edit mode
                headerText: `${proposalItem ? 'Edit' : 'Add'} Assignment`,
                organizationOpts: this.organizationOpts,
                providerOpts: providerPoolOpts,
                schoolYear: this.schoolYearInfo.schoolYears.find((item: any) => {
                    return item.id === this.selectedSchoolYear;
                }),
                therapyTypeOpts: [
                    { label: 'Direct Therapy', value: 1 },
                    { label: 'Evaluation', value: 2 },
                ],
                isBackgroundClickDisabled: true,
                onCancel: () => {
                    modalRef._component.destroy();
                },
                onSaveSuccess: (res: PLAssignmentProposalRaw, data: any) => {
                    this.util.log('onSave', { res, data, STATE: this });
                    const supplyItem: PLAssignmentProposalItem
                        = this.service.buildProviderSupplyItem(
                            opptyDemandItem.uuid,
                            res,
                            this.plTimezoneSvc,
                            this.user.timezone,
                            opptyDemandItem.pendingCompleteDate,
                        );

                    this.service.upsertProviderSupplyItem(supplyItem, opptyDemandItem);
                    this.service.updateOrgDemandTallies(orgDemandItem, opptyDemandItem.uuid);
                    this.updateFulfillmentTotals();

                    const text = proposalItem ? 'Updated' : 'Created new';
                    this.toastr.success(`${text} assignment for<br/><b>${supplyItem.provider}</b>`, '🎉 SUCCESS', {
                        positionClass: 'toast-bottom-right',
                        timeOut: TOAST_TIMEOUT,
                        enableHtml: true,
                    });
                    modalRef._component.destroy();
                },
                onSaveError: (err: any, data: any) => {
                    this.util.errorLog('onSave', { err, data, STATE: this });
                },
                canLockOrReserve: this.canLockOrReserve.bind(this),
            };
            this.plModal.create(PLCustomAssignmentModalComponent, params)
                .subscribe((ref: any) => {
                    modalRef = ref;
                });
        });

    }

    onClickTotalsType() {
        setTimeout(() => {
            this.updateFulfillmentTotals();
        });
    }

    canToggleCapacityPlanning() {
        if (this.lastQuery.status && !this.lastQuery.status.includes(PLAssignmentStatusEnum.CAPACITY_PLANNING)) {
            return false;
        }

        return true;
    }

    onClickRefreshPage() {
        this.buttonRefresh = true;
        setTimeout(() => {
            this.buttonRefresh = false;
            this.onQuery({ query: this.lastQuery });
        }, 500);
    }

    // NOTE: row selection ONLY applies to actionable items with status 'proposed'
    // NOTE: this is a toggle, SELECT-ALL <-> DE-SELECT-ALL
    onClickSelectAllPage() {
        const shouldSelectAll = !this.isSelectAllPage();
        this.orgDemandList.forEach((orgDemandItem: PLOrgDemandItem) => {
            if (this.hasProposedItem(orgDemandItem)) {
                orgDemandItem._checked = shouldSelectAll;
            }
            orgDemandItem.opptyDemandList.forEach((opptyDemandItem: PLOpptyDemandItem) => {
                opptyDemandItem.providerSupplyList.forEach((row: PLAssignmentProposalItem) => {
                    if (row.statusCode === PLAssignmentStatusEnum.PROPOSED) {
                        row._checked = shouldSelectAll;
                        if (shouldSelectAll) {
                            this.selectedRows[row.uuid] = row;
                        } else {
                            delete this.selectedRows[row.uuid];
                        }
                    }
                });
            });
        });
        this.util.log('onClick select all page', {
            is_select_all: shouldSelectAll,
            rows: this.selectedRows,
            STATE: this,
        });
    }

    // NOTE: row selection ONLY applies to actionable items with status 'proposed'
    onChangeSelectRow(
        proposalItem: PLAssignmentProposalItem,
        orgDemandItem: PLOrgDemandItem,
        opptyDemandItem: PLOpptyDemandItem,
    ) {
        this.lastSelectedRow = {
            proposalItem,
            orgDemandItem,
            opptyDemandItem,
        };

        if (proposalItem._checked) {
            this.selectedRows[proposalItem.uuid] = proposalItem;
        } else {
            delete this.selectedRows[proposalItem.uuid];
        }
        orgDemandItem._checked = this.isSelectedAllInOrg(orgDemandItem);
        this.util.log('onChangeSelectRow', { proposalItem, STATE: this });
    }

    // NOTE: row selection ONLY applies to actionable items with status 'proposed'
    onChangeSelectAllInOrg(orgDemand: PLOrgDemandItem) {
        const checked = orgDemand._checked;
        orgDemand.opptyDemandList.forEach((oppty: PLOpptyDemandItem) => {
            oppty.providerSupplyList.map((item: PLAssignmentProposalItem) => {
                if (item.statusCode === PLAssignmentStatusEnum.PROPOSED && this.canLockOrReserve(oppty)) {
                    item._checked = checked;
                    if (checked) {
                        this.selectedRows[item.uuid] = item;
                    } else {
                        delete this.selectedRows[item.uuid];
                    }
                }
                return item;
            });
        });
    }

    onChangeSchoolYear(event: any) {
        if (event.model === this.lastQuery.school_year) {
            return;
        }
        this.util.log('onChangeSchoolYear', { event, STATE: this });
        this.onQuery({ query: this.lastQuery });
    }

    hasOpptyDemand(orgDemandItem: PLOrgDemandItem) {
        return orgDemandItem.opptyDemandList.length;
    }

    hasProposedItem(orgDemandItem: PLOrgDemandItem) {
        return orgDemandItem.opptyDemandList.find((_oppty: PLOpptyDemandItem) => {
            return _oppty.providerSupplyList.find((_supply: PLAssignmentProposalItem) => {
                return _supply.statusCode === PLAssignmentStatusEnum.PROPOSED && this.canLockOrReserve(_oppty);
            });
        });
    }

    // NOTE: row selection ONLY applies to actionable items with status 'proposed'
    isSelectedAllInOrg(orgDemandItem: PLOrgDemandItem) {
        return !orgDemandItem.opptyDemandList.find((_oppty: PLOpptyDemandItem) => {
            return _oppty.providerSupplyList.find((_supply: PLAssignmentProposalItem) => {
                return _supply.statusCode === PLAssignmentStatusEnum.PROPOSED && !_supply._checked;
            });
        });
    }

    // TODO: fix expand checks to compare page data to selected data
    isExpanded(row: any) {
        return row._expanded;
    }

    selectedCount() {
        return Object.keys(this.selectedRows).length;
    }

    // NOTE: row selection ONLY applies to actionable items with status 'proposed'
    isSelectAllPage() {
        // NOTE: empty vs hasUnchecked..
        //    * empty means there are no Proposed checkboxes in the list
        //    * hasUnchecked means that there is at least one Proposed checkbox that is not checked
        let empty = true;
        const hasUnchecked = !this.orgDemandList.find((orgDemandItem: PLOrgDemandItem) => {
            return orgDemandItem.opptyDemandList.find((opptyDemandItem: PLOpptyDemandItem) => {
                return opptyDemandItem.providerSupplyList.find((supply: PLAssignmentProposalItem) => {
                    if (supply.statusCode === PLAssignmentStatusEnum.PROPOSED) {
                        empty = false;
                        return (supply.statusCode === PLAssignmentStatusEnum.PROPOSED) && !supply._checked;
                    }
                });
            });
        });
        if (empty) {
            return false;
        }
        return hasUnchecked;
    }

    isNoneSelected() {
        return Object.keys(this.selectedRows).length === 0;
    }

    isOneSelected() {
        return Object.keys(this.selectedRows).length === 1;
    }

    isEnhancedUI() {
        return localStorage.getItem('DEBUG_ADMIN') && localStorage.getItem('ENHANCED_UI');
    }

    canClickApprove() {
        return !this.loading && !this.isNoneSelected();
    }

    canClickReject() {
        return !this.loading && this.isOneSelected();
    }

    canLockOrReserve(opptyDemandItem: PLOpptyDemandItem) {
        return opptyDemandItem.probability >= MIN_PROBABILITY || this.user.groups.includes('Super CAM');
    }

    expandCollapseRow(event: any, supply: PLAssignmentProposalItem) {
        event.stopPropagation();
        event.preventDefault();
        supply._expanded = !this.isExpanded(supply);

        if (supply._expanded && !supply.numRequirements) {
            // fetch data
            supply._loading = true;

            const query = {
                uuid: supply.uuid,
            };
            this.service
                .fetchAssignmentProposals(query)
                .subscribe((proposalRaw: any) => {
                    // attach requirement fulfillment details
                    supply.metRequirements = proposalRaw.requirements
                        .filter((req: PLAssignmentRequirement) => this.service.isRequirementMet(req));

                    supply.unmetRequirements = proposalRaw.requirements
                        .filter((req: PLAssignmentRequirement) => !this.service.isRequirementMet(req));

                    supply.numRequirements = supply.metRequirements.length + supply.unmetRequirements.length;

                    supply._loading = false;
                });
        }
    }

    getFulfillmentPercent(item: PLOrgDemandItem): string {
        return item.fulfillmentPercentNormalized.toFixed(0);
    }

    getMeterInfo(orgDemandItem: PLOrgDemandItem, opptyDemandItem: PLOpptyDemandItem) {
        const supply = orgDemandItem.hoursByServiceSupply[opptyDemandItem.uuid];
        const demand = orgDemandItem.hoursByServiceDemand[opptyDemandItem.uuid];
        const percent = demand === 0 ? 0 : Math.floor(supply / demand * 100);
        return {
            percent: `${percent}`,
            ratio: `${this.decimalPipe.transform(supply, '1.1')} / ${this.decimalPipe.transform(demand, '1.1')}`,
            value: Math.min(100, percent),
        };
    }

    updateFilters() {
        this.filters = [
            this.filtersMap[this.FilterKey.ORG_FILTERS],
            this.filtersMap[this.FilterKey.ORGANIZATION],
            this.filtersMap[this.FilterKey.STATE],
            this.filtersMap[this.FilterKey.PROBABILITY],
            this.filtersMap[this.FilterKey.PROBABILITY_MAX],
            this.filtersMap[this.FilterKey.START_DATE_GTE],
            this.filtersMap[this.FilterKey.START_DATE_LT],
            this.filtersMap[this.FilterKey.SERVICE_TYPE],
            this.filtersMap[this.FilterKey.STATUS],
            this.filtersMap[this.FilterKey.PROVIDER],
            this.filtersMap[this.FilterKey.CAM],
        ];
    }

    // --------------------------
    // ------ PRIVATE METHODS
    // --------------------------

    private resetAllOpptyDemands() {
        this.orgDemandList.forEach((orgDemand: PLOrgDemandItem) => {
            orgDemand._checked = false;
            this.orgDemandList.forEach((orgDemandItem: PLOrgDemandItem) => {
                orgDemandItem.opptyDemandList.forEach((opptyDemandItem: PLOpptyDemandItem) => {
                    opptyDemandItem.providerSupplyList.forEach((row: PLAssignmentProposalItem) => {
                        row._checked = false;
                    });
                });
            });
        });
        this.selectedRows = {};
    }

    private updateFulfillmentTotals() {
        this.orgDemandList.forEach((d: PLOrgDemandItem) => {
            this.service.setOrgDemandItemSupplyTotal(
                d,
                this.includeProposedInTotals,
                this.includeCapacityInTotals,
            );
        });
    }

    ngOnDestroy() {
        clearTimeout(this.checkChangesTimeout);
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }
}

const TOAST_TIMEOUT = 10000;
const MIN_PROBABILITY = 100;

interface FilterTextArrayItem {
    textArray?: string[];
}
interface FilterTextItem {
    text?: string;
}
export interface PLAssignmentFilterValuesInterface {
    orgFiltersTextArray?: FilterTextArrayItem;
    organizationsTextArray?: FilterTextArrayItem;
    serviceTypeTextArray?: FilterTextArrayItem;
    assignmentStatusTextArray?: FilterTextArrayItem;
    providerText?: FilterTextItem;
}
