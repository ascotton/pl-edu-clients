import { PLBillingErrors } from './pl-billing';

export interface PLTimesheetPreview {
    uuid: string;
    total_hours: string;
    work_period: string;
    work_period_expanded: {
        start_date: string;
        end_date: string;
        pay_date: string;
        due_date: string;
        exported_on: string;
    };
    provider: string;
    provider_expanded: {
        uuid: string;
        created: string;
        modified: string;
        is_active: boolean;
        user: string;
        salesforce_id: string;
        provider_types: string[];
        phone: string;
        billing_street: string;
        billing_city: string;
        billing_postal_code: string;
        billing_state: string;
        billing_country: string;
        first_name: string;
        last_name: string;
        timezone: string;
        username: string;
        email: string;
        caseload_clients_count: string;
        in_retainer_program: boolean;
        bill_as_employee: boolean;
        is_onboarding_wizard_complete: boolean;
    };
    status: string;
    submitted_on: string;
    approved_on: string;
    exported_on: string;
    locked_for_provider: boolean;
    locked_for_cam: boolean;
    has_error: boolean;
    timeblocks: any[];
    errors: PLBillingErrors;
    catchedError?: boolean; // Only used when server errors are thrown
}
