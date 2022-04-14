import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { first } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { PLUrlsService, PLModalService, PLConfirmDialogService, PLGraphQLService } from '@root/index';
import { PLUtilService, PLSchoolYearsService } from '@common/services';
import { PLFadeInAnimation, PLFadeInOutAnimation } from '@common/animations';
import { CurrentUserService } from '@modules/user/current-user.service';
import {
    PLAssignmentManagerService,
    PLAssignmentStatusEnum as Status,
    PLAssignmentRequirement,
    PLAssignmentInterface,
} from './pl-assignment-manager.service';
import * as moment from 'moment';

import { PLRejectAssignmentModalComponent } from './pl-reject-assignments-modal.component';
import { PLUpdateAssignmentErrorModalComponent } from './pl-update-assignment-error-modal.component';
import { PLSubNavigationTabs } from '../../common/interfaces/pl-sub-navigation-tabs';


@Component({
    selector: 'pl-provider-assignments',
    templateUrl: './pl-provider-assignments.component.html',
    styleUrls: ['./pl-provider-assignments.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [PLFadeInAnimation, PLFadeInOutAnimation],
})
export class PLProviderAssignmentsComponent implements OnInit, OnDestroy {

    // data
    assignments: any = {
        [Status.INITIATED]: [],
        [Status.PENDING]: [],
        [Status.ACTIVE]: [],
        unmatched: [],
    };
    currentUser: any;

    tabs: PLSubNavigationTabs[] = [];
    schoolYearName: string;
    loading = true;
    loadingAvailability = true;
    hasAssignments = false;
    checkChangesTimeout: any;
    saving = false;
    totalHoursProposed = 0;
    maxWeeklyHours = 0;

    constructor(
        public util: PLUtilService,
        private service: PLAssignmentManagerService,
        private currentUserService: CurrentUserService,
        private schoolYear: PLSchoolYearsService,
        private plModal: PLModalService,
        private plUrls: PLUrlsService,
        private cdr: ChangeDetectorRef,
        private toastr: ToastrService,
        private plConfirm: PLConfirmDialogService,
        private plGraphQL: PLGraphQLService,
    ) { }

    ngOnInit() {
        this.tabs = this.getTabs();
        this.schoolYear.getCurrentSchoolYear().subscribe((res: any) => {
            this.schoolYearName = res.name;
        });
        this.currentUserService.getCurrentUser().pipe(first()).subscribe((res: any) => {
            this.currentUser = res;
            this.loadAssignments();
            this.loadAvalability();
        });

        const fn = () => {
            this.checkChangesTimeout = setTimeout(() => {
                this.cdr.markForCheck();
                fn();
            }, 250);
        };
        fn();
    }

    // ----------------------------
    // PUBLIC METHODS
    // ----------------------------
    onClickAccept(assignment: any) {
        this.plConfirm.show({
            header: 'Accept Assignment',
            content: `
                <div class="margin-large-b">
                    Are you sure you want accept this assignment of <b>${assignment.estimatedHours}</b> hours at <b>${assignment.orgName}</b>?
                </div>
            `,
            primaryLabel: 'Confirm',
            secondaryLabel: 'Cancel',
            primaryCallback: () => {
                let modalRef: any;
                this.plConfirm.hide();
                this.service.updateProposalStatus(assignment.uuid, Status.PENDING).subscribe(
                    (res: any) => {
                        this.util.log('onClickAccept', { res, STATE: this });
                        this.toastr.success('Successfully accepted assignment', '🎉 SUCCESS', {
                            positionClass: 'toast-bottom-right',
                            timeOut: TOAST_TIMEOUT,
                        });
                        this.loadAssignments();
                        if(modalRef && modalRef.instance) {
                            modalRef.instance.destroy();
                        } 
                    },
                    (err: any) => {
                        this.saving = false;
                        this.util.errorLog('onClickAccept', { err, STATE: this });
                        this.toastr.error(`Unable to accept assignment`, '❌ FAILED', {
                            positionClass: 'toast-bottom-right',
                            timeOut: TOAST_TIMEOUT,
                        });
                        this.plModal.create(PLUpdateAssignmentErrorModalComponent, { saveErrors: err.error }).pipe(first())
                            .subscribe((ref: any) => {
                                modalRef = ref;
                            });
                    },
                );
                this.saving = true;
            },
            secondaryCallback: () => { },
        });
    }

    onClickDecline(assignment: any) {
        let modalRef: any;
        const params: any = {
            providerAssignment: assignment,
            rejectedReasonsOpts: this.service.PROVIDER_REJECTED_REASONS_OPTS,
            onCancel: () => {
                modalRef.instance.destroy();
            },
            onSaveSuccess: (res: any) => {
                this.saving = false;
                this.toastr.success(`Successfully declined assignment`, '🎉 SUCCESS', {
                    positionClass: 'toast-bottom-right',
                    timeOut: TOAST_TIMEOUT,
                });
                this.loadAssignments();
                modalRef.instance.destroy();
            },
            onSaveError: (err: any) => {
                this.saving = false;
                this.toastr.error(`Unable to decline assignment`, '❌ ERROR', {
                    positionClass: 'toast-bottom-right',
                    timeOut: TOAST_TIMEOUT,
                });
                this.plModal.create(PLUpdateAssignmentErrorModalComponent, { saveErrors: err.error }).pipe(first())
                    .subscribe((ref: any) => {
                        modalRef = ref;
                    });
            },
        };
        this.saving = true;
        this.plModal.create(PLRejectAssignmentModalComponent, params).pipe(first())
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }

    onChangeSchoolYear(event: any) {
        this.util.log('onChangeSchoolYear', { event, STATE: this });
    }

    onClickExpandRow(A: any) {
        A.expanded = !A.expanded;
    }

    isExpanded(A: any) {
        return A.expanded;
    }

    getAssignmentsCount(type: Status) {
        return (this.assignments[type] && this.assignments[type].length) || 0;
    }

    getTabs(): PLSubNavigationTabs[] {
        return [
            { label: 'Calendar', href: `/schedule`, replaceHistory: true },
            { label: 'Availability', href: `/availability`, replaceHistory: true },
            { label: 'Assignments', href: `/assignments`, replaceHistory: true },
        ];
    }

    classSingleLane() {
        const proposed = this.assignments[Status.INITIATED].length && 1;
        const pending = this.assignments[Status.PENDING].length && 1;
        const active = this.assignments[Status.ACTIVE].length && 1;
        const total = proposed + pending + active;
        return total === 1 ? 'single-lane' : '';
    }

    updateMaxAvailableHours() {
        this.plConfirm.show({
            header: 'Stop receiving new requests?',
            content: `
                <div class="margin-large-r">
                    Are you sure? Your total hours desired will be reduced and you will not receive additional assignment requests.
                </div>
            `,
            primaryLabel: 'Confirm',
            secondaryLabel: 'Cancel',
            primaryCallback: () => {
                this.plConfirm.hide();

                this.loadingAvailability = true;

                const payload: any = {
                    availabilityPreference: {
                        maxWeeklyHours: this.totalHoursProposed,
                    },
                };

                this.plGraphQL
                    .mutate(GQL_SET_AVAILABILITY, payload, {})
                    .pipe(first())
                    .subscribe((res: any) => {
                        this.maxWeeklyHours = res.setAvailabilityPreference.availabilityPreference.maxWeeklyHours;
                        this.loadingAvailability = false;
                    });
            },
        });
    }

    // ----------------------------
    ngOnDestroy() {
        clearTimeout(this.checkChangesTimeout);
    }

    // ----------------------------
    // PRIVATE METHODS
    // ----------------------------
    private loadAssignments() {
        this.loading = true;
        this.totalHoursProposed = 0;
        this.service.fetchAssignmentProposals().subscribe((resProposals: any) => {
            this.assignments = {
                [Status.INITIATED]: [],
                [Status.PENDING]: [],
                [Status.ACTIVE]: [],
                unmatched: [],
            };
            resProposals.forEach((proposalRaw: any) => {
                if (proposalRaw.user === this.currentUser.uuid) {
                    const metRequirements: any[] = proposalRaw.requirements
                        .filter((req: PLAssignmentRequirement) => this.service.isRequirementMet(req));
                    const unmetRequirements: any[] = proposalRaw.requirements
                        .filter((req: PLAssignmentRequirement) => !this.service.isRequirementMet(req)
                            && req.options.length);
                    const assignment: PLAssignmentInterface = {
                        metRequirements,
                        unmetRequirements,
                        requirements: proposalRaw.requirements,
                        uuid: proposalRaw.uuid,
                        orgName: proposalRaw.organization.name,
                        orgState: proposalRaw.organization.state,
                        orgTimezone: proposalRaw.organization.timezone,
                        orgSchoolType: proposalRaw.organization.organization_type || 'Brick & Mortar',
                        estimatedHours: this.service.durationToDecimalHours(proposalRaw.hours),
                        estimatedHoursDecimal: this.service.durationToDecimalHoursDecimal(proposalRaw.hours),
                        schoolYear: proposalRaw.school_year,
                        startDate: proposalRaw.start_date,
                        endDate: proposalRaw.end_date,
                        serviceLines: proposalRaw.service_lines,
                        isFTE: proposalRaw.is_fte,
                        isESY: proposalRaw.is_esy,
                        payRate: proposalRaw.pay_rate,
                    };
                    switch (proposalRaw.status) {
                            case Status.INITIATED:
                                this.assignments[Status.INITIATED].push(assignment);
                                this.totalHoursProposed += assignment.estimatedHoursDecimal;
                                break;
                            case Status.PENDING:
                                this.assignments[Status.PENDING].push(assignment);
                                this.totalHoursProposed += assignment.estimatedHoursDecimal;
                                break;
                            case Status.ACTIVE:
                                this.assignments[Status.ACTIVE].push(assignment);
                                this.totalHoursProposed += assignment.estimatedHoursDecimal;
                                break;
                            case Status.COMPLETED:
                                if (moment().diff(proposalRaw.end_date) < 0) {
                                    this.assignments[Status.ACTIVE].push(assignment);
                                    this.totalHoursProposed += assignment.estimatedHoursDecimal;
                                }
                                break;
                    }
                } else {
                    this.util.log('unmatched proposal', { proposalRaw, STATE: this });
                    this.assignments.unmatched.push({ proposalRaw });
                }
            });
            this.hasAssignments = this.assignments[Status.INITIATED].length
                || this.assignments[Status.PENDING].length
                || this.assignments[Status.ACTIVE].length;
            this.util.log('assignmentProposals', { STATE: this });
            this.loading = false;
            this.saving = false;
        });
    }

    private loadAvalability() {
        this.loadingAvailability = true;
        this.plGraphQL
            .query(GQL_GET_AVAILABILITY)
            .pipe(first())
            .subscribe((res: any) => {
                if (res.availabilityPreference) this.maxWeeklyHours = res.availabilityPreference.maxWeeklyHours;
                this.loadingAvailability = false;
            });
    }
}

const TOAST_TIMEOUT = 5000;

const GQL_GET_AVAILABILITY = `
  {
    availabilityPreference {
      maxWeeklyHours
    }
  }
`;

const GQL_SET_AVAILABILITY = `
  mutation SaveAvailabilityPreference($availabilityPreference: SetAvailabilityPreferenceInputData) {
    setAvailabilityPreference(input: {availabilityPreference: $availabilityPreference}) {
      availabilityPreference {
        maxWeeklyHours
      }
    }
  }
`;
