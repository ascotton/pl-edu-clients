import { PLMetadataCatalog } from './metadata-catalog.model';

export interface PLLocation extends PLMetadataCatalog {
    name: string;
    state: string;
    type: string;
    record_tracking_type: boolean;
    tech_check_status: string;
    is_active: boolean;
    parent_organization: any;
    clinical_coordinator: any;
}
