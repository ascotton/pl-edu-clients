export enum BILLING_TYPE {
    Invoice = 'invoice',
    Timesheet = 'timesheet',
}

export interface PLBillingInfo {
    first_name: string;
    last_name: string;
    billing_street: string;
    billing_city: string;
    billing_state: string;
    billing_postal_code: string;
    billing_country: string;
    phone: string;
}

export interface PLBillingErrors {
    appointments_without_records: {
        appointments_without_records_count: number;
        missing_record_count: number
    };
    unsigned_records_exist: {
        unsigned_records_count: number;
    };
    no_records_exist: boolean;
}

export interface BillingTypeResponse {
    count: number;
    next: any;
    previous: any;
    results: any[];
}

export interface PLProviderBillingInfo extends PLBillingInfo {
    uuid: string;
    created: Date;
    modified: Date;
    is_active: boolean;
    user: string;
    salesforce_id: string;
    provider_types: string[];
    timezone: string;
    username: string;
    email: string;
    caseload_clients_count: any;
    in_retainer_program: boolean;
}
