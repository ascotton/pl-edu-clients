import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { PLUtilService } from '@common/services';
import { Option } from '@common/interfaces';

import {
    PLAssignmentManagerService,
    PLAssignmentProposalRaw,
    PLOrgDemandItem,
    PLOpptyDemandItem,
    PLAssignmentProposalItem,
    PLAssignmentStatusEnum,
    PLRejectedReasonsEnum,
} from './pl-assignment-manager.service';

import { fadeInOnEnterAnimation } from 'angular-animations';

interface ModelFormat {
    provider?: string;
    selectedServiceType?: string;
    status?: PLAssignmentStatusEnum;
    weeklyHours?: string;
    therapyType?: string;
    reason?: string;
    notes?: string;
    esy?: any;
}

@Component({
    selector: 'pl-custom-assignment-modal',
    templateUrl: './pl-custom-assignment-modal.component.html',
    styleUrls: ['./pl-custom-assignment-modal.component.less'],
    providers: [DecimalPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        fadeInOnEnterAnimation({ anchor: 'fadeIn', duration: 500 }),
    ],
})
export class PLCustomAssignmentModalComponent implements OnInit, OnDestroy {
    @Input() headerText: string;
    @Input() schoolYear: any;
    @Input() includePending = false;
    @Input() opptyDemandItem: PLOpptyDemandItem;
    @Input() orgDemandItem: PLOrgDemandItem;
    @Input() proposalItem: PLAssignmentProposalItem; // for edit mode
    @Input() serviceTypeOpts: Option[]; // slt, ot, etc
    @Input() organizationOpts: Option[];
    @Input() providerOpts: Option[];
    @Input() therapyTypeOpts: Option[]; // direct therapy, evaluation
    @Input() onCancel: Function;
    @Input() onSaveSuccess: Function;
    @Input() onSaveError: Function;
    @Input() canLockOrReserve: Function;

    model: ModelFormat = {};

    assignmentFormGroup: FormGroup = new FormGroup({});
    inFlight = false;
    rejectedReasonsOpts: Option[] = this.service.PL_REJECTED_REASONS_OPTS;
    removedReasonsOpts: Option[] = this.service.REMOVED_REASONS_OPTS;
    declinedReasonsOpts: Option[] = this.service.PROVIDER_REJECTED_REASONS_OPTS;
    assignmentStatusOpts: Option[];
    saveErrors: any[] = [];
    checkChangesTimeout: any;
    providerOptsOrig: any;
    showNameSearch = false;
    searchInputValue = '';
    allowLockOrReserve = true;
    proposeNonQualifiedProvider = false;
    nonQualifiedProviders: Option[] = [];
    loading = false;

    // constrain the input to numbers between [ 1.0, 40.0 ], allowing only 1/4 hour increments
    // and allow for loosely formatted values, such as 1, 1., 1.0
    maxHoursPattern = '(^(([0-9]|[1,2,3]\\d)(\\.|\\.(0|25|5|75))?)$)|(^(40)(\\.|\\.(0))?$)';

    constructor(
        public util: PLUtilService,
        private service: PLAssignmentManagerService,
        private decimalPipe: DecimalPipe,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit() {
        this.allowLockOrReserve = this.canLockOrReserve(this.opptyDemandItem);
        this.providerOptsOrig = this.providerOpts;

        if (this.proposalItem) {
            this.model.provider = this.proposalItem.providerUuid;
            this.model.weeklyHours = this.decimalPipe.transform(this.proposalItem.supplyHours, '1.1');
            const status = this.model.status = this.proposalItem.statusCode;
            const allowedStatus = this.service.CAM_SETTABLE_STATUS;
            let opts = this.service.STATUS_TRANSITION_OPTS_MAP[this.model.status]
                .filter((opt: Option) => allowedStatus[`${opt.value}`]);
            if (!opts.find((opt: Option) => opt.value === status)) {
                opts.push({ value: status, label: this.service.ASSIGNMENT_STATUS[status] });
            }

            // if we're proposed, and we can't lock or reserve, still allow proposed => rejected_by_pl
            if (status === PLAssignmentStatusEnum.PROPOSED && !this.allowLockOrReserve) {
                opts = opts.filter((opt: any) =>
                    opt.value === PLAssignmentStatusEnum.PROPOSED ||
                    opt.value === PLAssignmentStatusEnum.PL_REJECTED);
            }

            this.assignmentStatusOpts = opts;
        }
        const fn = () => {
            this.checkChangesTimeout = setTimeout(() => {
                this.cdr.markForCheck();
                fn();
            }, 150);
        };
        fn();
    }

    onClickCancel() {
        this.onCancel();
    }

    canUpdateHours() {
        return this.model.status !== PLAssignmentStatusEnum.PL_REJECTED
            && this.model.status !== PLAssignmentStatusEnum.REMOVED;
    }

    onClickSave() {
        const reasons: any = {};
        if (this.model.reason) {
            switch (this.model.status) {
                    case PLAssignmentStatusEnum.PL_REJECTED:
                        reasons.pl_rejected_reason = this.model.reason;
                        if (this.model.reason === PLRejectedReasonsEnum.OTHER) {
                            reasons.pl_rejected_other_reason = this.model.notes;
                        }
                        break;
                    case PLAssignmentStatusEnum.REMOVED:
                        reasons.removed_reason = this.model.reason;
                        if (this.model.reason === PLRejectedReasonsEnum.OTHER) {
                            reasons.removed_other_reason = this.model.notes;
                        }
            }
        }

        const hours = this.canUpdateHours() ? this.model.weeklyHours : this.proposalItem.supplyHours;
        const data: PLAssignmentProposalRaw = {
            school_year: this.schoolYear.id,
            demand: this.opptyDemandItem.uuid,
            user: this.model.provider,
            status: this.model.status,
            hours: this.service.decimalHoursToDuration(hours),
            ...reasons,
        };
        if (this.proposalItem) {
            data.uuid = this.proposalItem.uuid;
        }
        if (this.includePending) {
            data.include_pending = true;
        }

        this.inFlight = true;

        // TODO: if editing and rejecting/removing, ignore changes to provider and hours
        // TODO: if editing and item is past proposal stage, ignore changes to provider and hours
        this.service.saveProposal(data).subscribe(
            (res: any) => {
                this.util.log('--- save proposal SUCCESS', { data, res, STATE: this });
                this.onSaveSuccess(res, data);
                this.inFlight = false;
            },
            (err: any) => {
                let ERRORS: any[] = [];
                if (`${err.status}`.startsWith('50')) {
                    ERRORS = [{
                        key: 'System Error',
                        text: 'Please contact support',
                    }];
                } else {
                    for (const ERR in err.error) {
                        ERRORS = [...ERRORS, { key: ERR, text: err.error[ERR] }];
                    }
                }
                this.saveErrors = ERRORS;
                this.onSaveError(err, data);
                this.inFlight = false;
                this.util.log('--- save proposal ERROR', { data, err, STATE: this });
            },
        );
    }

    getNotesChars() {
        return this.service.getCharsLength(this.model.notes);
    }

    isReasonOther() {
        return this.model.reason === PLRejectedReasonsEnum.OTHER;
    }

    isStatusRejectedPL() {
        return this.model.status === PLAssignmentStatusEnum.PL_REJECTED;
    }

    isStatusDeclinedByProvider() {
        return this.model.status === PLAssignmentStatusEnum.PROVIDER_REJECTED;
    }

    isStatusRemoved() {
        return this.model.status === PLAssignmentStatusEnum.REMOVED;
    }

    shouldShowReason() {
        return this.isStatusRejectedPL() || this.isStatusRemoved();
    }

    onQuery(info: { data: any }) {
        this.providerOpts
            .sort((a: any, b: any) => {
                // number sorts
                if (info.data.orderKey === 'match') {
                    const fitnessA = a.fitness || -99999;
                    const fitnessB = b.fitness || -99999;

                    return (info.data.orderDirection === 'descending') ?
                        fitnessA - fitnessB :
                        fitnessB - fitnessA;
                }
                if (info.data.orderKey === 'hours') {
                    return (info.data.orderDirection === 'descending') ?
                        a.remainingHours - b.remainingHours :
                        b.remainingHours - a.remainingHours;
                }

                // string sorts
                let itemA;
                let itemB;
                if (info.data.orderKey === 'name') {
                    itemA = a.name;
                    itemB = b.name;
                } else if (info.data.orderKey === 'other') {
                    itemA = a.isOnboarding + a.hasPendingReqs + a.removedReasons.substring(0, 3);
                    itemB = b.isOnboarding + b.hasPendingReqs + b.removedReasons.substring(0, 3);
                } else {
                    return;
                }

                return (info.data.orderDirection === 'descending') ?
                    itemB.localeCompare(itemA) :
                    itemA.localeCompare(itemB);
            });
    }

    onSearchClick(event: any) {
        event.stopPropagation();
        this.showNameSearch = !this.showNameSearch;
    }

    onSearchInputClick(event: any) {
        event.stopPropagation();
    }

    onSearchInputChange(event: any) {
        const name = event.target.value.toLowerCase();
        if (name === '') {
            this.providerOpts = this.providerOptsOrig;
        } else {
            this.providerOpts = this.providerOptsOrig.filter((a: any) => a.name.toLowerCase().includes(name));
        }
    }

    onClickProposeNonQualifiedProvider(event: any) {
        this.proposeNonQualifiedProvider = !this.proposeNonQualifiedProvider;

        this.model.provider = null;
        this.model.status = (this.proposeNonQualifiedProvider) ?
             PLAssignmentStatusEnum.CAPACITY_PLANNING_LOCKED :
             null;

        if (this.proposeNonQualifiedProvider && this.nonQualifiedProviders.length === 0) {
            this.loading = true;

            this.service.fetchProviderPool(
                this.opptyDemandItem.uuid,
                true,
                true,
            ).subscribe((pool: any) => {
                this.loading = false;

                const mapped = pool.providers.map((p: any) => {
                    const label =
                        `${p.first_name} ${p.last_name} (${this.service.durationToDecimalHoursDecimal(p.remaining_hours)} hours remaining)` +
                        `<br />`;

                    return {
                        label,
                        value: p.uuid,
                    };
                });

                this.nonQualifiedProviders = mapped;
            });
        }
    }

    ngOnDestroy() {
        clearInterval(this.checkChangesTimeout);
    }
}
