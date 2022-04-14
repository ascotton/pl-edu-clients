import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { first, tap, map, mergeMap, switchMap } from 'rxjs/operators';
import { PLHttpService, PLGraphQLService, PLApiUsStatesService, PLTimezoneService } from '@root/index';
import { PLUtilService, PLSchoolYearsService } from '@common/services';
import { Option } from '@common/interfaces';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';

// GENERAL NOTE: In the context of this feature code,
// "Opportunty Demand Item" is interchangeable with "Service Group"

export interface PLOrgDemandItem {
    // the org name
    orgName: string;
    // the org id
    uuid: string;
    // hours by service-type
    // e.g. { slt: "15.0", ot: "5.0" }
    hoursByServiceDemand: {};
    hoursByServiceSupply: {};
    opptyDemandList: PLOpptyDemandItem[];
    // tallies
    hoursTotalDemand: number;
    hoursTotalSupply: number;
    fulfillmentPercentNormalized: number;
    cam: string;
    _checked?: boolean;
}

export interface PLOpptyDemandItem {
    opptyName: string;
    uuid: string;
    serviceGroupName: string;
    hours: string;
    unfulfilledHours: string;
    totalHoursProposed: string;
    totalHoursCommitted: string;
    totalHoursCapacityPlanning: string;
    isESY: boolean;
    probability: number;
    pendingCompleteDate: any;
    providerSupplyList?: PLAssignmentProposalItem[];
    providerSupplyListOrig?: PLAssignmentProposalItem[];
}

export interface PLOpptyDemandItemRaw {
    uuid: string;
    hours: string;
    unfulfilled_hours: string;
    opportunity_name: string;
    service_group: string;
    total_hours_proposed: string;
    total_hours_committed: string;
    total_hours_capacity_planning: string;
    is_esy: boolean;
    probability: number;
    pending_complete_date: any;
    proposals: any[];
}

// An assignment proposal expresses an amount of supply (provder hours)
// allocated to meet some opportunity demand
export interface PLAssignmentProposalItem {
    uuid: string;
    opptyDemandUuid: string;
    provider: string;
    providerObj: any;
    providerUuid: string;
    statusLabel: string;
    statusLabelDetail: string;
    statusCode: PLAssignmentStatusEnum;
    supplyHours: string;
    directHours?: string;
    durationHours: string;
    metRequirements?: PLAssignmentRequirement[];
    unmetRequirements?: PLAssignmentRequirement[];
    numRequirements?: number;
    modified?: string;
    separationDate?: string;
    isSeparating?: boolean;
    isSeparated?: boolean;
    startDate?: string;
    endDate?: string;
    showEndDate?: boolean;
    showCompletingOnEndDate?: boolean;
    endDateRaw?: any;
    demandPendingCompleteDateRaw: any;
    unmetRequirementsCount: number;
    _checked?: boolean;
    _expanded?: boolean;
    _loading?: boolean;
}

export interface PLAssignmentProposalRaw {
    uuid?: string;
    school_year?: string;
    demand?: string;
    user?: string;
    user_first_name?: string;
    user_last_name?: string;
    status?: PLAssignmentStatusEnum;
    status_detail?: string;
    hours?: string;
    direct_hours?: string;
    fte?: boolean;
    start_date?: string;
    end_date?: string;
    pl_rejected_reason?: string;
    pl_rejected_other_reason?: string;
    provider_rejected_reason?: string;
    provider_rejected_other_reason?: string;
    requirements?: PLAssignmentRequirement[];
    removed_reason?: string;
    include_pending?: boolean;
    modified?: string;
    user_separation_date?: string;
    unmet_requirements_count?: number;
}

export interface PLAssignmentRequirement {
    estimated_met_date: string;
    qualification: string;
    met: boolean;
    options: string[];
    pending: boolean;
}

// TODO: why is this duped from PLAssignmentProposalItem?
export interface PLAssignmentInterface {
    uuid: string;
    orgName: string;
    orgState: string;
    orgSchoolType: string;
    orgTimezone: string;
    estimatedHours: string | number;
    estimatedHoursDecimal: number;
    schoolYear: string;
    startDate: string;
    endDate: string;
    metRequirements?: PLAssignmentRequirement[];
    unmetRequirements?: PLAssignmentRequirement[];
    requirements?: PLAssignmentRequirement[];
    serviceLines: string[];
    isFTE: boolean;
    isESY: boolean;
    payRate: number;
    modified?: string;
    status?: string;
    statusDetail?: string;
}

@Injectable()
export class PLAssignmentManagerService {
    ASSIGNMENT_STATUS: any = ASSIGNMENT_STATUS;
    ASSIGNMENT_STATUS_OPTS: any;
    CAM_SETTABLE_STATUS: any = CAM_SETTABLE_STATUS;
    PL_REJECTED_REASONS_OPTS: any;
    PROVIDER_REJECTED_REASONS_OPTS: any;
    REMOVED_REASONS_OPTS: any;
    STATUS_TRANSITION_OPTS_MAP = {};
    PROBABILITIES_OPTS: Option[];
    PROBABILITIES_MAX_OPTS: Option[];
    FilterKey = FILTER_KEY;

    constructor(
        private util: PLUtilService,
        private plHttp: PLHttpService,
        private plGraphQL: PLGraphQLService,
        private schoolYears: PLSchoolYearsService,
        private toastr: ToastrService,
        private states: PLApiUsStatesService,
    ) {
        this.ASSIGNMENT_STATUS_OPTS = Object.keys(ASSIGNMENT_STATUS)
            .map(key => ({ value: key, label: ASSIGNMENT_STATUS[key] }))
            .sort((a: Option, b: Option) => a.label.localeCompare(b.label));

        this.PL_REJECTED_REASONS_OPTS = Object.keys(PL_REJECTED_REASONS)
            .map(key => ({ value: key, label: PL_REJECTED_REASONS[key] }))
            .sort((a: Option, b: Option) => a.label.localeCompare(b.label));

        this.PROVIDER_REJECTED_REASONS_OPTS = Object.keys(PROVIDER_REJECTED_REASONS)
            .map(key => ({ value: key, label: PROVIDER_REJECTED_REASONS[key] }))
            .sort((a: Option, b: Option) => a.label.localeCompare(b.label));

        this.REMOVED_REASONS_OPTS = Object.keys(REMOVED_REASONS)
            .map(key => ({ value: key, label: REMOVED_REASONS[key] }))
            .sort((a: Option, b: Option) => a.label.localeCompare(b.label));

        Object.keys(STATUS_TRANSITION_MAP).forEach((statusKey: string) => {
            const options = Object.keys(STATUS_TRANSITION_MAP[statusKey])
                .map((item: any) => {
                    return { value: item, label: ASSIGNMENT_STATUS[item] };
                });
            this.STATUS_TRANSITION_OPTS_MAP[statusKey] = [
                { value: statusKey, label: ASSIGNMENT_STATUS[statusKey] },
                ...options,
            ];
        });
        this.PROBABILITIES_OPTS = PROBABILITIES_OPTS;
        this.PROBABILITIES_MAX_OPTS = PROBABILITIES_MAX_OPTS;
    }

    providers: any[];
    providerPool: any = {};

    fetchOrganizations(params?: any) {
        return this.util.fetchAll(
            'Organizations (GQL)',
            GQL_ORGANIZATIONS,
            params,
            (r: any) => r.organizations,
            (r: any) => r.organizations_totalCount);
    }

    fetchStates() {
        return this.states.formOpts();
    }

    fetchProviders() {
        return this.util.fetchAll('Providers (REST)','providers', { user__is_active: true }).pipe(
            tap((r: any) => this.providers = r),
        );
    }

    fetchProviderPool(demandUuid: string, includePending: boolean, ignoreQualifications: boolean) {
        const providers = this.providerPool[demandUuid];
        if (providers && providers.length) {
            return of(providers);
        }
        const params = { demand_uuid: demandUuid };
        if (includePending) {
            Object.assign(params, { include_pending: true });
        }

        if (ignoreQualifications) {
            Object.assign(params, { ignore_qualifications: true });
        }

        return this.plHttp.get('providerPool', params).pipe(
            tap((r: any) => this.providerPool[demandUuid] = r),
        );
    }

    fetchProviderTypes() {
        return this.plHttp.get('providerTypes', { limit: 1000 }).pipe(
            map((r: any) => r.results),
        );
    }

    fetchServiceTypes() {
        return this.plHttp.get('serviceTypes', { limit: 1000 }).pipe(
            map((r: any) => r.results),
        );
    }

    fetchSchoolYearsInfo() {
        return this.schoolYears.getSchoolYearsInfo();
    }

    fetchDemand(inParams: any) {
        return this.plHttp.get('demand', inParams);
    }

    // SEE https://presencelearning.atlassian.net/browse/PL-1885
    // Keep this code forever because it's awesome
    private fetchDemand_PL_1885(inParams: any, pageSize: number) {
        // Fine-grained control of the /demand query for performance reasons.
        // The user sees a full page size
        // but we divide the page query into multiple sub-queries
        const USER_PAGE = inParams.page || 1;
        const OFFSET = pageSize * USER_PAGE;
        const REQ_PAGE_SIZE = { 25: 5, 20: 5, 15: 5 }[pageSize] || pageSize;
        const REQ_PAGE = (USER_PAGE - 1) * (pageSize / REQ_PAGE_SIZE) + 1;
        // Since we track the page and page size, we don't need to compute an offset.
        const params = (({ offset, ...r } = inParams) => r)();
        if (pageSize !== 25 && pageSize !== 20 && pageSize !== 15 && pageSize !== 10) {
            return this.plHttp.get('demand', inParams);
        }
        return this.plHttp.get('demand', {
            ...params,
            page: REQ_PAGE,
            limit: 1,
        }).pipe(
            switchMap((r: any) => {
                if (r.count === 0 || r.count === 1) {
                    return of({ count: r.count, results: [...r.results] });
                }
                const ALL: any[] = [];
                const count = r.count > OFFSET ? pageSize : pageSize - (OFFSET - r.count);
                const pages = Math.floor(count / REQ_PAGE_SIZE) + ((count % REQ_PAGE_SIZE) && 1);

                for (let i = 0; i < pages; i++) {
                    ALL.push(this.plHttp.get('demand', { ...params, page: REQ_PAGE + i, limit: REQ_PAGE_SIZE }));
                }
                return forkJoin(ALL).pipe(
                    map((res: any) => ({ count: r.count, results: [...res.flatMap((_: any) => _.results)] })),
                );
            }),
        );
    }

    fetchAssignmentProposals(query: any = {}) {
        return this.plHttp.get('assignmentProposals', { ...query, limit: 1000 }).pipe(
            map((r: any) => {
                // TODO:
                // - refactor this to return PLAssignmentProposalItem object(s)
                // - remove PLAssignmentInterface
                // - remove duped logic on translation from raw data and met/unmet calculation:
                //   - pl-provider-assignments
                //   - pl-assignment-manager

                // when querying for a specific proposal, plHttp.get() pulls out the results for us
                if (query.uuid) return r;

                return r.results;
            }),
        );
    }

    saveProposal(data?: PLAssignmentProposalRaw) {
        return this.plHttp.save('assignmentProposals', data, '', { suppressError: true });
    }

    updateProposalStatus(uuid: string, status: PLAssignmentStatusEnum, reason?: any) {
        return this.saveProposal({ uuid, status, ...reason });
    }

    canUpdateProposal(currentStatus: PLAssignmentStatusEnum, newStatus: PLAssignmentStatusEnum) {
        return !!STATUS_TRANSITION_MAP[currentStatus][newStatus];
    }

    shouldProposalAffectCommittedFulfillment(item: PLAssignmentProposalItem) {
        const status = item.statusCode;
        return status === PLAssignmentStatusEnum.RESERVED
            || status === PLAssignmentStatusEnum.INITIATED
            || status === PLAssignmentStatusEnum.PENDING
            || status === PLAssignmentStatusEnum.ACTIVE
            || this.isCompletingAfterPendingCompletionDate(status, item.endDateRaw, item.demandPendingCompleteDateRaw)
        ;
    }

    shouldProposalAffectFulfillment(item: PLAssignmentProposalItem) {
        const status = item.statusCode;
        return status === PLAssignmentStatusEnum.PROPOSED
            || status === PLAssignmentStatusEnum.LOCKED
            || status === PLAssignmentStatusEnum.RESERVED
            || status === PLAssignmentStatusEnum.INITIATED
            || status === PLAssignmentStatusEnum.PENDING
            || status === PLAssignmentStatusEnum.ACTIVE
            || status === PLAssignmentStatusEnum.CAPACITY_PLANNING_LOCKED
            || this.isCompletingAfterPendingCompletionDate(status, item.endDateRaw, item.demandPendingCompleteDateRaw)
        ;
    }

    isEditable(proposal: PLAssignmentProposalItem) {
        return !proposal._checked && (
            this.shouldProposalAffectFulfillment(proposal) ||
            proposal.statusCode === PLAssignmentStatusEnum.CAPACITY_PLANNING
        );
    }

    rejectSingleProposal(
        orgDemandList: any[],
        selectedRows: any,
        proposalItem: PLAssignmentProposalItem,
        reason?: { pl_rejected_reason: string, pl_rejected_other_reason?: string },
    ): Observable<StatusUpdateResults> {
        return this.bulkUpdateProposals(
            orgDemandList,
            selectedRows,
            [proposalItem],
            PLAssignmentStatusEnum.PL_REJECTED,
            reason,
        );
    }

    // Used for Accept/Reject bulk updates
    bulkUpdateProposals(
        orgDemandList: any[],
        selectedRows: any,
        items: PLAssignmentProposalItem[],
        status: PLAssignmentStatusEnum,
        reason?: { pl_rejected_reason: string, pl_rejected_other_reason?: string },
    ): Observable<StatusUpdateResults> {
        // NOTE: the api does not accept a list, so we'll throttle the requests
        // and tally the responses
        const saved: any[] = [];
        const failed: any[] = [];
        const ignored: any[] = [];
        const isDone = () => (saved.length + failed.length + ignored.length) === items.length;
        let count = 0;

        return new Observable((observer: any) => {
            const finalizeIfDone = () => {
                if (isDone()) {
                    const results: StatusUpdateResults = { saved, failed, ignored };
                    observer.next(results);
                    observer.complete();
                }
            };
            items.forEach((supplyItem: PLAssignmentProposalItem) => {
                // restrict updates to valid transitions
                if (!this.canUpdateProposal(supplyItem.statusCode, status)) {
                    ignored.push(supplyItem);
                    supplyItem._checked = false;
                    delete selectedRows[supplyItem.uuid];
                    finalizeIfDone();
                } else {
                    // ORG-DEMAND / OPPTY-DEMAND / PROVIDER-SUPPLY
                    let orgDemand: PLOrgDemandItem;
                    let opptyDemand: PLOpptyDemandItem;

                    orgDemand = orgDemandList.find((_org: PLOrgDemandItem) => {
                        return _org.opptyDemandList.find((_oppty: PLOpptyDemandItem) => {
                            return _oppty.providerSupplyList.find((_supply: PLAssignmentProposalItem) => {
                                if (_supply.uuid === supplyItem.uuid) {
                                    opptyDemand = _oppty; // FYI: side-effect
                                    return true;
                                }
                            });
                        });
                    });
                    // batch 20 at a time, separate batches by 1s.
                    const ms = Math.floor(count++ / 20) * 1000;
                    setTimeout(() => {
                        this.updateProposalStatus(supplyItem.uuid, status, reason).subscribe(
                            (res: any) => {
                                saved.push(supplyItem);
                                supplyItem._checked = false;
                                supplyItem.statusCode = status;
                                supplyItem.statusLabel = this.getStatusLabel(status);
                                delete selectedRows[supplyItem.uuid];
                                const supplyHours: number = Number(supplyItem.supplyHours);
                                if (!this.shouldProposalAffectFulfillment(supplyItem)) {
                                    supplyItem.supplyHours = '0';
                                }
                                this.updateOrgDemandTallies(
                                    orgDemand,
                                    opptyDemand.uuid,
                                );
                                finalizeIfDone();
                            },
                            (err: any) => {
                                failed.push({ err, item: supplyItem });
                                supplyItem._checked = false;
                                delete selectedRows[supplyItem.uuid];
                                finalizeIfDone();
                            },
                        );
                    }, ms);
                }
            });
        });
    }

    getStatusLabel(statusCode: PLAssignmentStatusEnum): string {
        return ASSIGNMENT_STATUS[statusCode];
    }

    setProviderSupplyLists(obj: PLOpptyDemandItem, providerSupplyList: PLAssignmentProposalItem[], statuses: string) {
        obj.providerSupplyListOrig = providerSupplyList;
        obj.providerSupplyList = providerSupplyList
            .filter((x: PLAssignmentProposalItem) => !statuses || this.proposalMatchesFilter(x, statuses));
    }

    proposalMatchesFilter(p: PLAssignmentProposalItem, statuses: string) {
        if (statuses.includes(p.statusCode)) {
            return true;
        }

        // include pending complete when filtering for "active"
        if (statuses.includes(PLAssignmentStatusEnum.ACTIVE) &&
            this.isCompletingAfterPendingCompletionDate(p.statusCode, p.endDateRaw, p.demandPendingCompleteDateRaw)) {
            return true;
        }

        return false;
    }

    upsertProviderSupplyItem(item: PLAssignmentProposalItem, opptyDemandItem: PLOpptyDemandItem) {
        const lists = [opptyDemandItem.providerSupplyList, opptyDemandItem.providerSupplyListOrig];

        lists.forEach((supplyList: PLAssignmentProposalItem[]) => {
            const index = supplyList.findIndex((_: PLAssignmentProposalItem) => _.uuid === item.uuid);

            if (index === -1) {
                supplyList.push(item);
            } else {
                supplyList[index] = item;
            }
        });
    }

    buildProviderSupplyItem(
        opptyDemandUuid: string,
        proposalRaw: PLAssignmentProposalRaw,
        plTimezoneSvc: PLTimezoneService,
        timezone: string,
        pendingCompleteDate: any,
    ): PLAssignmentProposalItem {
        const separationDate = proposalRaw.user_separation_date ? moment(proposalRaw.user_separation_date) : null;

        const endDate = proposalRaw.end_date ? moment(proposalRaw.end_date) : null;

        return {
            opptyDemandUuid,
            unmetRequirementsCount: proposalRaw.unmet_requirements_count,
            uuid: proposalRaw.uuid,
            provider: `${proposalRaw.user_first_name} ${proposalRaw.user_last_name}`,
            providerObj: this.providers && this.providers.find((p: any) => p.user === proposalRaw.user),
            providerUuid: proposalRaw.user,
            supplyHours: this.durationToDecimalHours(proposalRaw.hours),
            directHours: proposalRaw.direct_hours && this.durationToDecimalHours(proposalRaw.direct_hours),
            durationHours: proposalRaw.hours,
            statusCode: proposalRaw.status,
            statusLabel: ASSIGNMENT_STATUS[proposalRaw.status],
            statusLabelDetail: proposalRaw.status_detail,
            modified: plTimezoneSvc.toUserZone(proposalRaw.modified, null, timezone).format('M/D/YY'),
            separationDate: (separationDate) ? separationDate.format('M/D/YY') : '',
            isSeparating: (separationDate) ? moment().diff(separationDate) < 0 : false,
            isSeparated: (separationDate) ? moment().diff(separationDate) >= 0 : false,
            showEndDate: (endDate) ? proposalRaw.status === PLAssignmentStatusEnum.COMPLETED : false,
            showCompletingOnEndDate: (endDate) ? this.isCompleting(proposalRaw.status, endDate) : false,
            startDate: plTimezoneSvc.toUserZone(proposalRaw.start_date, null, timezone).format('M/D/YY'),
            endDate: plTimezoneSvc.toUserZone(proposalRaw.end_date, null, timezone).format('M/D/YY'),
            endDateRaw: endDate,
            demandPendingCompleteDateRaw: pendingCompleteDate,
        };
    }

    isCompleting(status: string, endDate: any) {
        if (!endDate) return false;

        // completed, and proposal's end date after now
        return status === PLAssignmentStatusEnum.COMPLETED && moment().diff(endDate) < 0;
    }

    isCompletingAfterPendingCompletionDate(status: string, endDate: any, demandPendingCompletionDate: any) {
        if (!endDate || !demandPendingCompletionDate) return false;

        // completed, and proposal's end date after the demand's pending end date
        return status === PLAssignmentStatusEnum.COMPLETED && endDate.diff(demandPendingCompletionDate) >= 0;
    }

    sortProviderSupplyList(list: PLAssignmentProposalItem[]) {
        return list.sort((a: PLAssignmentProposalItem, b: PLAssignmentProposalItem) => {
            return a.provider.toLocaleLowerCase().localeCompare(b.provider.toLocaleLowerCase());
        });
    }

    updateOrgDemandTallies(orgDemand: PLOrgDemandItem, opptyDemandUuid: string) {
        // recalc proposed and committed
        const opptyDemandItem =
            orgDemand.opptyDemandList.find((x: PLOpptyDemandItem) => x.uuid === opptyDemandUuid);

        if (!opptyDemandItem) return;

        const totalProposedList = opptyDemandItem.providerSupplyListOrig
            .filter((x: PLAssignmentProposalItem) => this.shouldProposalAffectFulfillment(x));

        const totalProposed = (totalProposedList.length === 0) ? 0 :
            totalProposedList
                .map((x: PLAssignmentProposalItem) => Number(x.supplyHours))
                .reduce((hours: any, x: any) => hours + Number(x))
        ;

        const totalCommittedList = opptyDemandItem.providerSupplyListOrig
            .filter((x: PLAssignmentProposalItem) => this.shouldProposalAffectCommittedFulfillment(x));

        const totalCommitted = (totalCommittedList.length === 0) ? 0 :
            totalCommittedList
                .map((x: PLAssignmentProposalItem) => Number(x.supplyHours))
                .reduce((hours: any, x: any) => hours + Number(x))
        ;

        opptyDemandItem.totalHoursProposed = `${totalProposed}`;
        opptyDemandItem.totalHoursCommitted = `${totalCommitted}`;
    }

    buildDemandHours(orgDemand: any) {
        return orgDemand.demands.reduce((hours: any, opptyDemand: PLOpptyDemandItemRaw) => {
            hours[opptyDemand.uuid] = Number(this.durationToDecimalHours(opptyDemand.hours));
            return hours;
        }, {});
    }

    buildOrgDemandList(
        orgDemand: any,
        includeProposedInTotals: boolean,
        includeCapacityInTotals: boolean,
        statuses: string,
        plTimezoneSvc: PLTimezoneService,
        timezone: string,
    ): PLOrgDemandItem[] {
        /**
         * An orgDemandItem represents an order of demands for service by an organization
         *   uuid: "organization uuid"
         *   name: "organization name"
         *   demands: []
         */
        return orgDemand.map((orgDemandRaw: any) => {
            const opptyDemandList = this.buildOpptyDemandList(orgDemandRaw.demands, statuses, plTimezoneSvc, timezone);
            const hoursByServiceDemand = this.buildDemandHours(orgDemandRaw);
            const obj: PLOrgDemandItem = {
                opptyDemandList,
                hoursByServiceDemand,
                orgName: orgDemandRaw.name,
                uuid: orgDemandRaw.uuid,
                hoursTotalDemand: this.getTotalHours(hoursByServiceDemand),
                cam: orgDemandRaw.cam,
                hoursByServiceSupply: 0, // set below
                hoursTotalSupply: 0, // set below
                fulfillmentPercentNormalized: 0, // set below
            };

            this.setOrgDemandItemSupplyTotal(obj, includeProposedInTotals, includeCapacityInTotals);
            return obj;
        });
    }

    setOrgDemandItemSupplyTotal(
        orgDemand: PLOrgDemandItem,
        includeProposedInTotals: boolean,
        includeCapacityInTotals: boolean,
    ) {
        const hoursByServiceDemand = orgDemand.hoursByServiceDemand;
        const hoursByServiceSupply = this.getSupplyHours(
            orgDemand.opptyDemandList,
            includeProposedInTotals,
            includeCapacityInTotals,
        );

        orgDemand.hoursByServiceSupply = hoursByServiceSupply;
        orgDemand.hoursTotalSupply = this.getTotalHours(hoursByServiceSupply);
        orgDemand.fulfillmentPercentNormalized =
            this.getFulfillmentPercentNormalized(hoursByServiceDemand, hoursByServiceSupply);
    }

    buildOpptyDemandList(
        demandsRaw: any,
        statuses: string,
        plTimezoneSvc: PLTimezoneService,
        timezone: string,
    ): PLOpptyDemandItem[] {
        /**
         * An opptyDemandItem represents an order-item of demand for an amount of service
         *   uuid: "demand uuid"
         *   opptyName: "oppty name"
         *   serviceGroupName: "service group name"
         *   hours: "16.0"
         *   totalHoursProposed: "3 23:00:00"
         *   proposals: []
         */
        return demandsRaw.map((opptyDemandItemRaw: PLOpptyDemandItemRaw) => {
            const pendingCompleteDate = moment(opptyDemandItemRaw.pending_complete_date);

            const providerSupplyList = this.buildProposalList(
                opptyDemandItemRaw,
                plTimezoneSvc,
                timezone,
                pendingCompleteDate,
            );

            const obj: PLOpptyDemandItem = {
                opptyName: opptyDemandItemRaw.opportunity_name || '* missing opportunity name',
                uuid: opptyDemandItemRaw.uuid,
                hours: this.durationToDecimalHours(opptyDemandItemRaw.hours),
                unfulfilledHours: this.durationToDecimalHours(opptyDemandItemRaw.unfulfilled_hours),
                totalHoursProposed: this.durationToDecimalHours(opptyDemandItemRaw.total_hours_proposed),
                totalHoursCommitted: this.durationToDecimalHours(opptyDemandItemRaw.total_hours_committed),
                totalHoursCapacityPlanning:
                    this.durationToDecimalHours(opptyDemandItemRaw.total_hours_capacity_planning),
                serviceGroupName: opptyDemandItemRaw.service_group,
                isESY: opptyDemandItemRaw.is_esy,
                probability: opptyDemandItemRaw.probability,
                pendingCompleteDate: pendingCompleteDate,
            };

            this.setProviderSupplyLists(obj, providerSupplyList, statuses);
            return obj;
        });
    }

    buildProposalList(
        opptyDemandItemRaw: any,
        plTimezoneSvc: PLTimezoneService,
        timezone: string,
        pendingCompleteDate: any,
    ): PLAssignmentProposalItem[] {
        const proposalsRaw = opptyDemandItemRaw.proposals;
        const proposals = proposalsRaw.map((proposal: any) => {
            const opptyDemandUuid = opptyDemandItemRaw.uuid;
            const item: PLAssignmentProposalItem =
                this.buildProviderSupplyItem(opptyDemandUuid, proposal, plTimezoneSvc, timezone, pendingCompleteDate);
            return item;
        });

        return proposals
            .sort((a: PLAssignmentProposalItem, b: PLAssignmentProposalItem) => {
                const A = `${a.provider} ${a.statusCode}`.toLocaleLowerCase();
                const B = `${b.provider} ${b.statusCode}`.toLocaleLowerCase();
                return A.localeCompare(B);
            });
    }

    buildServiceTypeInfo(types: any) {
        const ids = {};
        const codes = {};
        const opts: Option[] = [];
        types.forEach((item: any) => {
            ids[item.uuid] = item;
            opts.push({ label: item.short_name, value: item.uuid });
            codes[item.code] = item.short_name;
        });
        return { types, ids, opts, codes };
    }

    buildOrganizationOpts(orgs: any) {
        return orgs.map((org: any) => ({ label: org.name, value: org.id }));
    }

    buildProviderOpts(providers: any[]): Option[] {
        return providers.map((p: any) => ({ label: `${p.first_name} ${p.last_name}`, value: p.user }));
    }

    buildProviderOptsWithType(pool: any[]): Option[] {
        return pool.map((p: any) => {
            const label =
                `<h3><a href="${this.getProviderDashboardUrl(p.uuid)}" target="_blank">${p.first_name} ${p.last_name}</a></h3>` +
                `${this.durationToDecimalHoursDecimal(p.remaining_hours)} hours remaining<br />`;

            const color =
                (p.rank === 4) ? 'red' :
                (p.rank === 1) ? 'green' :
                '';

            return {
                label,
                value: p.uuid,
                uuid: p.uuid,
                name: `${p.first_name} ${p.last_name}`,
                remainingHours: this.durationToDecimalHoursDecimal(p.remaining_hours),
                hasPendingReqs: p.has_pending_reqs,
                isOnboarding: p.provider_sub_status === 'Onboarding',
                fitness: p.fitness,
                rankColor: color,
                rankDescription: (p.rank) ? `${p.rank_description} percentile (${p.fitness})` : '',
                removedReasons: p.removed_reasons.join(', '),
                dashboardUrl: this.getProviderDashboardUrl(p.uuid),
                separationDate: (p.separation_date) ? moment(p.separation_date).format('M/D/YYYY') : '',
            };
        });
    }

    toastStatusResults(results: StatusUpdateResults) {
        if (results.saved.length) {
            const pluralized = results.saved.length === 1 ? 'item was' : 'items were';
            this.toastr.success(`${results.saved.length} ${pluralized} successfully updated`, '🎉 SUCCESS', {
                positionClass: 'toast-bottom-right',
                timeOut: TOAST_TIMEOUT,
                enableHtml: true,
            });
        }
        if (results.ignored.length) {
            const pluralized = results.ignored.length === 1 ? 'item' : 'items';
            this.toastr.info(`${results.ignored.length} ${pluralized} could not be changed`, '🔒 IGNORED', {
                positionClass: 'toast-bottom-right',
                timeOut: TOAST_TIMEOUT,
                enableHtml: true,
            });
        }
        if (results.failed.length) {
            const pluralized = results.ignored.length === 1 ? 'item' : 'items';
            this.toastr.error(`${results.failed.length} ${pluralized} failed with errors`, '❌ FAILED', {
                positionClass: 'toast-bottom-right',
                timeOut: TOAST_TIMEOUT,
            });
        }
    }

    // `1 05:19:12` (1 day, 5 hours, 19 minutes, 12 seconds) to decimal hours 29.32
    durationToDecimalHoursDecimal(duration: string): number {
        const hours = moment.duration(duration).asHours();
        return this.roundTwoDecimalPlaces(hours);
    }

    // duration format to decimal hours
    durationToDecimalHours(duration: string): string {
        const HOURS = this.durationToDecimalHoursDecimal(duration);
        return `${HOURS}`;
    }

    // decimal hours to duration format
    decimalHoursToDuration(decimalHours: string) {
        const d = moment.duration(Number(decimalHours), 'h');
        const _days = d.get('days');
        const DAYS = (_days && `${_days} `) || '';
        const HOURS = `${d.get('hours')}`.padStart(2, '0');
        const MINUTES = `${d.get('minutes')}`.padStart(2, '0');
        const SECONDS = `${d.get('seconds')}`.padStart(2, '0');
        return `${DAYS}${HOURS}:${MINUTES}:${SECONDS}`;
    }

    roundTwoDecimalPlaces(num: number) {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    getCharsLength(text: string) {
        return text && text.length;
    }

    isRequirementMet(requirement: PLAssignmentRequirement) {
        return requirement.met && requirement.qualification && requirement.qualification.length;
    }

    getProviderDashboardUrl(providerUuid: any) {
        return `https://metabase.presencelearning.com/dashboard/110?uuid=${this.stripHyphens(providerUuid)}`;
    }

    getAccountDashboardUrl(accountName: any) {
        return `https://metabase.presencelearning.com/dashboard/119?account=${encodeURIComponent(accountName)}`;
    }

    private stripHyphens(s: string) {
        return s.replace(/-/g, '');
    }

    private getSupplyHours(
        opptyDemandList: PLOpptyDemandItem[],
        includeProposed: boolean,
        includeCapacity: boolean,
    ): any {
        const hours = {};
        opptyDemandList.forEach((opptyDemandItem: PLOpptyDemandItem) => {
            let supply = (includeProposed) ?
                Number(opptyDemandItem.totalHoursProposed) :
                Number(opptyDemandItem.totalHoursCommitted);

            if (includeCapacity) {
                supply += Number(opptyDemandItem.totalHoursCapacityPlanning);
            }

            hours[opptyDemandItem.uuid] = this.roundTwoDecimalPlaces(supply);
        });
        return hours;
    }

    private getTotalHours(hoursMap: any): number {
        const total = Object.values(hoursMap)
            .reduce<number>((sum: number, h: string) => sum + Number(h), 0);
        return this.roundTwoDecimalPlaces(total);
    }

    // return a whole number value weighted/normalized/capped at 100%
    private getFulfillmentPercentNormalized(hoursByServiceDemand: any, hoursByServiceSupply: any) {
        let totalSupply = 0;
        let totalDemand = 0;
        const keys = Object.keys(hoursByServiceDemand);
        keys.forEach((serviceGroupUuid: string) => {
            const demandHours = hoursByServiceDemand[serviceGroupUuid];
            const supplyHours = hoursByServiceSupply[serviceGroupUuid] || 0;
            const normalizedSupply = Math.min(supplyHours, demandHours);
            totalSupply += normalizedSupply;
            totalDemand += demandHours;
        });
        const percent = totalSupply / totalDemand * 100;

        // round up if the float represents 100.
        if (100 - percent < 0.9999) {
            return 100;
        }
        // otherwise round down (not completely fulfilled)
        return Math.floor(percent);
    }
}

const flag = (key: string) => localStorage.getItem(key);
export interface StatusUpdateResults {
    saved: any[];
    failed: any[];
    ignored: any[];
}

export enum PLAssignmentStatusEnum {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    INITIATED = 'initiated',
    LOCKED = 'locked',
    PENDING = 'pending',
    PL_REJECTED = 'pl_rejected',
    PROPOSED = 'proposed',
    PROVIDER_REJECTED = 'provider_declined',
    REMOVED = 'removed',
    RESERVED = 'reserved',
    CAPACITY_PLANNING = 'capacity_planning',
    CAPACITY_PLANNING_LOCKED = 'capacity_planning_locked',
}

const ASSIGNMENT_STATUS = {
    [PLAssignmentStatusEnum.ACTIVE]: 'Active',
    [PLAssignmentStatusEnum.COMPLETED]: 'Completed',
    [PLAssignmentStatusEnum.INITIATED]: 'Initiated',
    [PLAssignmentStatusEnum.LOCKED]: 'Locked',
    [PLAssignmentStatusEnum.PENDING]: 'Pending',
    [PLAssignmentStatusEnum.PL_REJECTED]: 'Rejected by PL',
    [PLAssignmentStatusEnum.PROPOSED]: 'Proposed',
    [PLAssignmentStatusEnum.PROVIDER_REJECTED]: 'Declined by Provider',
    [PLAssignmentStatusEnum.REMOVED]: 'Removed',
    [PLAssignmentStatusEnum.RESERVED]: 'Reserved',
    [PLAssignmentStatusEnum.CAPACITY_PLANNING]: 'Proposed - Capacity Planning',
    [PLAssignmentStatusEnum.CAPACITY_PLANNING_LOCKED]: 'Locked - Capacity Planning',
};

const CAM_SETTABLE_STATUS = {
    [PLAssignmentStatusEnum.CAPACITY_PLANNING]: 1,
    [PLAssignmentStatusEnum.CAPACITY_PLANNING_LOCKED]: 1,
    [PLAssignmentStatusEnum.PROPOSED]: 1,
    [PLAssignmentStatusEnum.LOCKED]: 1,
    [PLAssignmentStatusEnum.RESERVED]: 1,
    [PLAssignmentStatusEnum.PL_REJECTED]: 1,
    [PLAssignmentStatusEnum.REMOVED]: 1,
    [PLAssignmentStatusEnum.COMPLETED]: 1,
};

const STATUS_TRANSITION_MAP = {
    [PLAssignmentStatusEnum.CAPACITY_PLANNING]: {
        [PLAssignmentStatusEnum.CAPACITY_PLANNING_LOCKED]: 1,
        [PLAssignmentStatusEnum.LOCKED]: 1,
        [PLAssignmentStatusEnum.RESERVED]: 1,
        [PLAssignmentStatusEnum.PL_REJECTED]: 1,
    },
    [PLAssignmentStatusEnum.CAPACITY_PLANNING_LOCKED]: {
        [PLAssignmentStatusEnum.LOCKED]: 1,
        [PLAssignmentStatusEnum.RESERVED]: 1,
        [PLAssignmentStatusEnum.PL_REJECTED]: 1,
    },
    [PLAssignmentStatusEnum.PROPOSED]: {
        [PLAssignmentStatusEnum.LOCKED]: 1,
        [PLAssignmentStatusEnum.RESERVED]: 1,
        [PLAssignmentStatusEnum.PL_REJECTED]: 1,
    },
    [PLAssignmentStatusEnum.LOCKED]: {
        [PLAssignmentStatusEnum.PROPOSED]: 1,
        [PLAssignmentStatusEnum.RESERVED]: 1,
        [PLAssignmentStatusEnum.PL_REJECTED]: 1,
    },
    [PLAssignmentStatusEnum.RESERVED]: {
        [PLAssignmentStatusEnum.PROPOSED]: 1,
        [PLAssignmentStatusEnum.LOCKED]: 1,
        [PLAssignmentStatusEnum.INITIATED]: 1,
        [PLAssignmentStatusEnum.PL_REJECTED]: 1,
    },
    [PLAssignmentStatusEnum.INITIATED]: {
        [PLAssignmentStatusEnum.PENDING]: 1,
        [PLAssignmentStatusEnum.PROVIDER_REJECTED]: 1,
        [PLAssignmentStatusEnum.REMOVED]: 1,
    },
    [PLAssignmentStatusEnum.PENDING]: {
        [PLAssignmentStatusEnum.ACTIVE]: 1,
        [PLAssignmentStatusEnum.REMOVED]: 1,
    },
    [PLAssignmentStatusEnum.ACTIVE]: {
        [PLAssignmentStatusEnum.COMPLETED]: 1,
    },
    [PLAssignmentStatusEnum.PROVIDER_REJECTED]: {
        [PLAssignmentStatusEnum.PROPOSED]: 1,
        [PLAssignmentStatusEnum.LOCKED]: 1,
        [PLAssignmentStatusEnum.RESERVED]: 1,
    },
    [PLAssignmentStatusEnum.PL_REJECTED]: {
    },
    [PLAssignmentStatusEnum.REMOVED]: {
    },
    [PLAssignmentStatusEnum.COMPLETED]: {
    },
};

const FILTER_KEY = {
    // Supported by /demand API
    PROVIDER: 'provider',
    ORGANIZATION: 'organization',
    SERVICE_TYPE: 'service_type',
    SCHOOL_YEAR: 'school_year',
    STATE: 'state',
    PROBABILITY: 'probability',
    PROBABILITY_MAX: 'probability_max',
    START_DATE_GTE: 'start_date__gte',  // equal or greater than a start date
    START_DATE_LT: 'start_date__lt',  // less than a start date

    // NOTE: orgFilters_In 'my_accounts' => send logged in cam ID.
    ORG_FILTERS: 'orgFilters_In', // string[]:  'my_accounts', 'unfilled_accounts'
    // values for ORG_FILTERS
    MY_ACCOUNTS: 'my_accounts',
    UNFILLED_ACCOUNTS: 'unfilled_accounts',

    CAM: 'cam',
    UNMET_DEMAND: 'unmet_demand',

    // NOT currently supported by /demand API
    STATUS: 'status',
};

export enum PLRejectedReasonsEnum {
    WEAK_MATCH = 'weak_match',
    WEAK_AVAILABILITY = 'weak_availability',
    MANUAL_OVERRIDE = 'manual_override',
    OTHER = 'other',
}

const PL_REJECTED_REASONS = {
    [PLRejectedReasonsEnum.WEAK_MATCH]: 'Clinical requirements not enough of a match',
    [PLRejectedReasonsEnum.WEAK_AVAILABILITY]: 'Availability not a match',
    [PLRejectedReasonsEnum.MANUAL_OVERRIDE]: 'Manually selected different provider',
    [PLRejectedReasonsEnum.OTHER]: 'Other',
};

export enum ProviderRejectedReasonsEnum {
    CAPACITY = 'capacity',
    SCHEDULE = 'schedule',
    DISTRICT = 'district',
    NOT_ENOUGH = 'not_enough',
    TOO_MANY = 'too_many',
    OTHER = 'other',
}

const PROVIDER_REJECTED_REASONS = {
    [ProviderRejectedReasonsEnum.CAPACITY]: 'No more capacity for more students',
    [ProviderRejectedReasonsEnum.SCHEDULE]: 'Schedule not a match',
    [ProviderRejectedReasonsEnum.DISTRICT]: 'I don\'t want to work at that district',
    [ProviderRejectedReasonsEnum.NOT_ENOUGH]: 'Not enough hours',
    [ProviderRejectedReasonsEnum.TOO_MANY]: 'Too many hours',
    [ProviderRejectedReasonsEnum.OTHER]: 'Other',
};

export enum RemovedReasonsEnum {
    NO_MATCH = 'no_match',
    DECLINED_BY_PROVIDER = 'declined_by_provider',
    OVER_ASSIGNED = 'over_assigned',
    SCHEDULE_NO_MATCH = 'schedule_no_match',
    CONTRACT_CHANGED = 'contract_changed',
    RESIGNED = 'resigned',
    NO_ANSWER = 'no_answer',
}

const REMOVED_REASONS = {
    [RemovedReasonsEnum.NO_MATCH]: 'Clinical requirements not a match',
    [RemovedReasonsEnum.DECLINED_BY_PROVIDER]: 'Declined by provider',
    [RemovedReasonsEnum.OVER_ASSIGNED]: 'Over assigned',
    [RemovedReasonsEnum.SCHEDULE_NO_MATCH]: 'Schedules not a match',
    [RemovedReasonsEnum.CONTRACT_CHANGED]: 'Contract status changed',
    [RemovedReasonsEnum.RESIGNED]: 'Resigned',
    [RemovedReasonsEnum.NO_ANSWER]: 'Provider did not reply',
};


const PROBABILITIES_OPTS: Option[] = [70, 80, 90, 100].map(probability => {
    return { value: probability, label: probability.toString() };
});

const PROBABILITIES_MAX_OPTS: Option[] = [79, 89, 99, 100].map(probability_max => {
    return { value: probability_max, label: probability_max.toString() };
});

const TOAST_TIMEOUT = 5000;

const GQL_ORGANIZATIONS = `
    query organizations($first: Int!, $offset: Int!, $orderBy: String) {
        organizations(includeProspects: true, opportunityHoldersOnly: true, first: $first, offset: $offset, orderBy: $orderBy) {
            totalCount
            pageInfo {
                endCursor
                hasNextPage
            }
            edges {
                node {
                    id
                    name
                    state
                    timezone
                }
            }
        }
    }
`;
