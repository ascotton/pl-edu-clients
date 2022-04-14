import { Component } from '@angular/core';

@Component({
  selector: 'pl-client-referral-delete',
  templateUrl: './pl-client-referral-delete.component.html',
  styleUrls: ['./pl-client-referral-delete.component.less'],
  inputs: ['referral', 'onDelete', 'onCancel'],
})
export class PLClientReferralDeleteComponent {
    referral: any = {};
    onDelete: Function;
    onCancel: Function;

    public selectOptsReason: any[] = [
        { value: 'DUPLICATE_REFERRAL', label: 'Duplicate Referral' },
        { value: 'DUPLICATE_OF_SERVICE_IN_PROGRESS', label: 'Duplicate of service in progress' },
        { value: 'INCORRECT_REFERRAL', label: 'Incorrect referral' },
    ];

    constructor() {}

    delete() {
        if (this.referral.reason) {
            this.onDelete({ reason: this.referral.reason });
        }
    }

    cancel() {
        this.onCancel();
    }
}
