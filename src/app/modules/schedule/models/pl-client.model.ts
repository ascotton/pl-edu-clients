import { PLMetadataCatalog } from './metadata-catalog.model';

// TODO: Add a generic Client Interface to Extend with
export interface PLClient extends PLMetadataCatalog {
    first_name: string;
    last_name: string;
    birthday: string;
    external_id: string;
    locations: any[];
    primary_language: string;
    primary_language_expanded: any;
    secondary_language: string;
    secondary_language_expanded: any;
    status: string;
    status_display: string;
    grade: string;
    grade_display: string;
    email: string;
    phone: string;
    sex: string;
    races: any[];
    races_expanded: any[];
    race_other: string;
    strategies: string;
    ethnicities: any[];
    ethnicities_expanded: any[];
    ethnicity_other: string;
    age: number;
    in_caseload: boolean;
    recent_provider: string;
    contact_preference: string;
    street: string;
    city: string;
    postal_code: string;
    state: string;
    country: string;
    timezone: string;
    annual_iep_due_date: string;
    triennial_evaluation_due_date: string;
    previous_triennial_evaluation_date: string;
    permissions: string;
}
