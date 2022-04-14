import { Component, Input } from '@angular/core';
import { BILLING_TYPE } from '../../pl-billing';

interface SummaryDetails {
    name?: string,
    rate?: string,
    count?: number,
    amount?: string,
    duration: string,
    billing_code?: string
}

interface Summary {
    subtotal: string;
    rate_holder: string;
    details: SummaryDetails[];
}

@Component({
    selector: 'pl-billing-preview-summary',
    templateUrl: './pl-billing-preview-summary.component.html',
    styleUrls: ['./pl-billing-preview-summary.component.less'],
})
export class PLBillingPreviewSummaryComponent {
    @Input() summary: Summary[];
    @Input() totalAmount: any;
    @Input() type: string;

    get billingTypeEnum() { return BILLING_TYPE; };
}
