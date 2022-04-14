import { PLMetadataCatalog } from './metadata-catalog.model';
import { PLBillingInfo } from '../../billing/pl-billing';
import { PLBillingCode } from '@common/interfaces';
import { PLClient } from './pl-client.model';

export enum PLEventRepeatMode {
    One = 'one',
    All = 'all', /* TODO Marco: is this used? */
    Following = 'following',
}

export interface PLRepeatingRuleValue {
    recurrence_frequency?: string;
    recurrence_params?: string;
    end_recurring_period?: string;
}

export interface IPLEvent extends PLRepeatingRuleValue {
    billing_code: string;
    event_type: string;
    location?: any;
    provider?: string;
    start: string;
    end: string;
    repeating?: boolean;
    title?: string;
    uuid?: string;
    locations?: any[];
    clients?: any[];
}

// TODO: Add a generic Client Interface to Extend with
export interface PLEventClient {
    first_name: string;
    last_name: string;
    status: string;
    timezone: string;
    uuid: string;
}

export interface PLEventRecord extends PLMetadataCatalog {
    billing_code?: string; // Restricted Mode
    billing_expanded?: PLBillingCode;
    appointment?: string;
    client?: string;
    client_expanded?: PLClient;
    client_service?: string;
    location?: string;
    location_expanded?: any;
    locked?: boolean;
    note_schema?: string;
    notes?: string;
    provider?: string;
    signed?: boolean;
    signed_by?: string;
    signed_on?: string | boolean;
    tracking_type?: any;
    ui_source?: any;

    // UI Properties
    _participantUuid?: string;
    noClientNorLocation?: boolean;
    start?: any;
    end?: any;
}

export interface PLEventResponse {
    billing_code: string;
    clients: any[];
    created: string;
    created_by: string;
    description: any;
    end: string;
    end_recurring_period?: string;
    event_type: string;
    is_blacked_out: boolean;
    location?: any;
    locations?: any[];
    modified: string;
    modified_by: string;
    provider?: string;
    recurrence_frequency?: string;
    recurrence_params?: string;
    repeating?: boolean;
    start: string;
    title?: string;
    title_generated: string;
    uuid?: string;
}

export interface PLAppointmentResponse {
    billing_code: string;
    clients: any[];
    created: string;
    created_by: string;
    description: any;
    end: string;
    event: string;
    is_blacked_out: boolean;
    locations?: any[];
    locked: boolean;
    modified: string;
    modified_by: string;
    original_end: string;
    original_start: string;
    removed: boolean;
    start: string;
    title: string;
    title_generated: string;
    uuid: string;
}

// TODO: Rename to PLAppointment
export interface PLEvent extends PLMetadataCatalog {
    clients: PLEventClient[]; // API
    description: any; // API
    start: string; // API
    end: string; // API
    original_end: string; // API
    original_start: string; // API
    event: IPLEvent; // API
    is_blacked_out: boolean; // API
    locations: any[]; // API
    locked: boolean; // API
    records: PLEventRecord[]; // API
    removed: boolean; // API
    signed: boolean; // API
    title: string; // API
    billing_code: string; // API

    client_expanded?: PLClient;
    location_expanded?: any;
    localInfo?: any;
    billing_expanded?: PLBillingCode;
    billingInfo?: PLBillingInfo;
}
