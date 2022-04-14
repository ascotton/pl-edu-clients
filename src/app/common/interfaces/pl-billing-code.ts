export interface PLBillingCode {
    uuid: string;
    billable: ConstrainBooleanParameters;
    can_provide: any;
    client_participates: string;
    code: string;
    event_category: {
        name: string,
        color: string,
    };
    event_creation_category: string;
    event_repeatable: boolean;
    is_active: boolean;
    location_participates: string;
    name: string;
    payable: boolean;
    precedence: number;
    record_note_type: string;
    services: any[];
}
