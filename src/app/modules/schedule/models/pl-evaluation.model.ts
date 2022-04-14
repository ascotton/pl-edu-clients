import { PLMetadataCatalog } from './metadata-catalog.model';

export interface PLEvaluation extends PLMetadataCatalog {
    areas_of_concern: any[];
    assessments_used: any[];
    assigned_date: Date;
    assigned_to: string;
    assigned_to_expanded: any;
    // {uuid: "86a080b6-6361-40d3-ae5c-787ad9f78689", created: "2019-10-17T21:58:01.805768Z",…}
    bilingual: boolean;
    billing_minutes: number;
    celdt_comprehension: number;
    celdt_listening: number;
    celdt_reading: number;
    celdt_speaking: number;
    celdt_writing: number;
    client: string;
    client_expanded: any;
    // {uuid: "a91e320d-eee6-49aa-b10a-6a759003c131", created: "2019-10-17T21:58:00.574122Z",…}
    completed_date: Date;
    consent_signed: boolean;
    consent_signed_date: any;
    due_date: Date;
    eval_type: string;
    eval_type_display: string;
    locked: boolean;
    referring_provider: string;
    service: string;
    service_expanded: any;
    // {uuid: "8cbeba6b-4d33-4503-895e-88e52117d63a", code: "eval_slt",…}
    status: string;
    status_display: string;
}
