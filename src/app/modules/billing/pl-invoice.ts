import { PLBillingErrors, PLBillingInfo, PLProviderBillingInfo } from './pl-billing';

export interface PLInvoicePeriod {
    start: string;
    end: string;
    dueDate: Date;
    submitStatus: any;
    monthName?: string;
    lastRefresh?: string;
    lastRefreshSource?: string;
    userId?: string;
}

export interface PLInvoice {
    uuid: string;
    invoice_number: any;
    provider: string;
    provider_expanded: PLProviderBillingInfo;
    submitted_on: any;
    submitted_by: any;
    period: string;
    period_expanded: {
        name: string;
        start: string;
        end: string;
        locked: false;
        due_date: Date
    };
    status: string;
    amount: number;
    created: any;
    modified: any;
    created_by: any;
    modified_by: any;
    payer_expanded: PLBillingInfo;
    errors: PLBillingErrors;
    summary_expanded: any[];
}
