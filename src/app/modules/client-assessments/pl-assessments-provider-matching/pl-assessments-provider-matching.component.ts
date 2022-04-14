import { Component, Input } from '@angular/core';
import { PLModalService } from '@root/index';
import { ToastrService } from 'ngx-toastr';
import { PLClientReferralMatchComponent } from '../../client-referrals/pl-client-referral-match/pl-client-referral-match.component';
import { PlClientReferralUnmatchComponent } from '../../client-referrals/pl-client-referral-unmatch/pl-client-referral-unmatch.component';
import { PLReferral, PLReferralsService } from '../../client-referrals/pl-referrals.service';
import { PLAssessmentRow } from '../models';
import { PLAssessmentsTableService } from '../pl-assessments-table.service';

@Component({
    selector: 'pl-assessments-provider-matching',
    templateUrl: './pl-assessments-provider-matching.component.html',
})
export class PLAssessmentsProviderMatchingComponent {
    @Input() assessment: PLAssessmentRow;

    TOAST_TIMEOUT = 5000;

    assessmentsTableService: PLAssessmentsTableService;

    constructor(
        private plModal: PLModalService,
        private plReferralsService: PLReferralsService,
        private toastr: ToastrService,
        assessmentsTableService: PLAssessmentsTableService,
    ) {
        this.assessmentsTableService = assessmentsTableService;
    }

    shouldShowMatchButton(assessment: PLAssessmentRow): boolean {
        return assessment.permissions.matchProvider
            && ['UNMATCHED_PL_REVIEW', 'UNMATCHED_OPEN_TO_PROVIDERS'].includes(assessment.status)
            && assessment.providerName === '';
    }

    shouldShowUnmatchButton(assessment: PLAssessmentRow): boolean {
        return assessment.permissions.unmatchReferral
            && assessment.status === 'MATCHED'
            && assessment.providerName !== '';
    }

    showConfirmEditButtons(assessment: PLAssessmentRow): boolean {
        const referral = this.assessmentsTableService.getAssessmentReferralById(assessment.id);
        return referral && referral.state === 'PROPOSED';
    }

    undoProposedReferral(assessment: PLAssessmentRow, action: string): void {
        const referral = this.assessmentsTableService.getAssessmentReferralById(assessment.id);
        if (referral) {
            const params = {
                referralId: referral.id,
                reasonToUnmatch: '',
            };
            const successMsg = action === 'Unmatch' ? 'Referral successfully unmatched' : 'Proposal successfuly undone';
            this.plReferralsService.unmatchReferral(params).subscribe({
                next: (unmatched) => {
                    if (!unmatched.unmatchReferral.errors) {
                        this.assessmentsTableService.loadAssessmentReferralById(assessment.id);
                        this.toastr.success(successMsg, '🎉 SUCCESS', {
                            positionClass: 'toast-bottom-right',
                            timeOut: this.TOAST_TIMEOUT,
                        });
                    } else {
                        this.toastr.error(`Unable to ${action}`, '❌ FAILED', {
                            positionClass: 'toast-bottom-right',
                            timeOut: this.TOAST_TIMEOUT,
                        });
                    }
                },
                error: () => {
                    this.toastr.error(`Unable to ${action}`, '❌ FAILED', {
                        positionClass: 'toast-bottom-right',
                        timeOut: this.TOAST_TIMEOUT,
                    });
                }
            });
        }
    }

    handleConfirmReferralMatchClick(assessment: PLAssessmentRow): void {
        const referral = this.assessmentsTableService.getAssessmentReferralById(assessment.id);
        if (referral) {
            const params = {
                referralId: referral.id,
                providerUserId: referral.provider.id,
            };

            this.plReferralsService.matchReferral(params).subscribe({
                next: (newReferral: PLReferral) => {
                    this.assessmentsTableService.loadAssessmentReferralById(assessment.id);
                    const message = `Match confirmed. ${this.assessmentsTableService.getProviderFullName(newReferral)} has been notified`;
                    this.toastr.success(message, '🎉 SUCCESS', {
                        positionClass: 'toast-bottom-right',
                        timeOut: this.TOAST_TIMEOUT,
                    });
                },
                error: () => {
                    this.toastr.error('There was an error while trying to confirm this match', '❌ FAILED', {
                        positionClass: 'toast-bottom-right',
                        timeOut: this.TOAST_TIMEOUT,
                    });
                }
            });
        }
    }

    handleEditReferralMatchClick(assessment: PLAssessmentRow): void {
        const referral = this.assessmentsTableService.getAssessmentReferralById(assessment.id);
        if (referral) {
            const plReferral = this.assessmentsTableService.mapToPlReferral(referral);
            const params: any = {
                referral: plReferral,
                client: plReferral.client
            };
            this.plModal.create(PLClientReferralMatchComponent, params).subscribe((modalReference: any) => {
                const modal = modalReference.instance;

                modal.match.subscribe(({ referral: newReferral }: { referral: PLReferral }) => {
                    this.assessmentsTableService.loadAssessmentReferralById(assessment.id);
                    const providerName = this.assessmentsTableService.getProviderFullName(newReferral.provider);
                    const message = `Match confirmed. ${providerName} has been notified`;
                    this.toastr.success(message, '🎉 SUCCESS', {
                        positionClass: 'toast-bottom-right',
                        timeOut: this.TOAST_TIMEOUT,
                    });

                    modal.destroy();
                });

                modal.proposeMatch.subscribe(({ referral: newReferral }: { referral: PLReferral }) => {
                    this.assessmentsTableService.loadAssessmentReferralById(assessment.id);
                    const clientName = `${newReferral.client.firstName} ${newReferral.client.lastName}`;
                    const providerName = this.assessmentsTableService.getProviderFullName(newReferral.provider);
                    const message = `${providerName} has been proposed as a match for ${clientName}.`;
                    this.toastr.success(message, '🎉 SUCCESS', {
                        positionClass: 'toast-bottom-right',
                        timeOut: this.TOAST_TIMEOUT,
                    });


                    modal.destroy();
                });

                modal.cancel.subscribe(() => modal.destroy());
            });
        }
    }

    openUnmatchingModal(assessment: PLAssessmentRow, action: string): void {
        const referral = this.assessmentsTableService.getAssessmentReferralById(assessment.id);
        if (referral) {
            const plReferral = this.assessmentsTableService.mapToPlReferral(referral);
            const params = { referral: plReferral, action };
            this.plModal.create(PlClientReferralUnmatchComponent, params).subscribe((modalReference: any) => {
                const modal = modalReference.instance;

                modal.unmatch.subscribe((unmatchReference: any) => {
                    if (unmatchReference.result === 'success') {
                        this.assessmentsTableService.loadAssessmentReferralById(assessment.id);
                        this.toastr.success(unmatchReference.msg, '🎉 SUCCESS', {
                            positionClass: 'toast-bottom-right',
                            timeOut: this.TOAST_TIMEOUT,
                        });
                        modal.destroy();
                    } else {
                        this.toastr.error(unmatchReference.msg, '❌ FAILED', {
                            positionClass: 'toast-bottom-right',
                            timeOut: this.TOAST_TIMEOUT,
                        });
                        modal.destroy();
                    }
                });

                modal.cancel.subscribe(() => modal.destroy());
            });
        }
    }
}
