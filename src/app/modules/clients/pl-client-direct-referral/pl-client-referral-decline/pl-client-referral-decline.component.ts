import { Component } from '@angular/core';

@Component({
  selector: 'pl-client-referral-decline',
  templateUrl: './pl-client-referral-decline.component.html',
  styleUrls: ['./pl-client-referral-decline.component.less'],
  inputs: ['referral', 'onDecline', 'onCancel'],
})
export class PLClientReferralDeclineComponent {
    referral: any = {};
    onDecline: Function;
    onCancel: Function;

    public selectOptsReason: any[] = [
        { value: 'scheduling_conflict', label: 'Scheduling Conflict' },
        { value: 'clinical_reason', label: 'Clinical Reason' },
        { value: 'grouping', label: 'Grouping' },
        { value: 'language', label: 'Language' },
    ];

    constructor() {}

    decline() {
        if (this.referral.reason) {
            this.onDecline({ reason: this.referral.reason });
        }
    }

    cancel() {
        this.onCancel();
    }
}
