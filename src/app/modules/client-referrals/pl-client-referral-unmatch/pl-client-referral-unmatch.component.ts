import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { PLReferral } from '@root/src/app/common/interfaces/pl-referral';
import { PLReferralsService } from '../pl-referrals.service';

@Component({
    selector: 'pl-client-referral-unmatch',
    templateUrl: './pl-client-referral-unmatch.component.html',
    styleUrls: ['./pl-client-referral-unmatch.component.less'],
})
export class PlClientReferralUnmatchComponent implements OnInit {

    @Input() referral: PLReferral;
    @Input() action: string;

    @Output() readonly unmatch: EventEmitter<any> = new EventEmitter();
    @Output() readonly cancel: EventEmitter<any> = new EventEmitter();

    declineReason = [
        { value: '', label: '--' },
        { value: 'clinical_reason', label: 'Clinical Reason' },
        { value: 'duplicate_referral', label: 'Duplicate Referral' },
        { value: 'duplicate_of_service_in_progress', label: 'Duplicate of Service in Progress' },
        { value: 'grouping', label: 'Grouping' },
        { value: 'incorrect_referral', label: 'Incorrect Referral' },
        { value: 'language', label: 'Language' },
        { value: 'scheduling_conflict', label: 'Scheduling Conflict' },
    ];
    isUnmatching = false;
    unmatchingReasonId = '';

    constructor(
        private plReferralsService: PLReferralsService,
    ) { }

    ngOnInit() {
    }

    onCancel() {
        this.cancel.emit();
    }

    /**
     * For unmatching first we need to unmatch and then get the referrals.
     * If unmatch is successful; then get the referrals for updating the buttons of each row
     *
     * @param referral PLReferral object
     * @param action Two buttons call this function, the action tells who is calling
     */
    onUnmatchReferral(): void {
        this.isUnmatching = true;

        const params = {
            referralId: this.referral.id,
            reasonToUnmatch: this.unmatchingReasonId,
        };
        const errorMsg = 'There was an error while trying to perform this action';
        const successMsg = this.action === 'Unmatch' ?
            'Referral successfully unmatched' : 'Proposal successfuly undone';

        this.plReferralsService.unmatchReferral(params).subscribe({
            next: (unmatched) => {
                if (!unmatched.unmatchReferral.errors) {
                    this.unmatch.emit({
                        result: 'success',
                        msgTitle: 'Confirmed',
                        msg: successMsg,
                    });
                } else {
                    this.unmatch.emit({
                        result: 'fail',
                        msgTitle: unmatched.unmatchReferral.errors.message || errorMsg,
                        msg: `Unable to ${this.action}`,
                    });
                }
            },
            error: () => this.unmatch.emit({
                result: 'fail',
                msgTitle: errorMsg,
                msg: `Unable to ${this.action}`,
            }),
        });
    }

}
