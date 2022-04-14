import { PLClient } from './pl-client.model';
import { PLMetadataCatalog } from './metadata-catalog.model';
import { PL_CLIENT_SERVICE_STATUS } from '@common/enums';

export interface PLProviderType {
    id: string;
    code: string;
    longName: string;
    shortName: string;
    isActive: boolean;
}

export interface PLServiceType {
    uuid: string;
    code: string;
    short_name: string;
    long_name: string;
}

export interface PLService {
    uuid: string;
    code: string;
    name: string;
    can_provide: boolean;
    provider_types: PLProviderType[];
    service_type: PLServiceType;
    productType?: any;
}

export interface PLClientServiceDetail extends PLMetadataCatalog {
    archived: boolean;
    bilingual: boolean;
    client: string;
    client_expanded: PLClient;
    start_date: string;
    end_date: string;
    duration: number;
    frequency: number;
    interval: string;
    interval_display: string;
    is_active: boolean;
    total_minutes_required: number;
    minutes_received: number;
    service: string;
    service_expanded: PLService;
    starting_balance: number;
    status: PL_CLIENT_SERVICE_STATUS;
    status_display: string;
}

export interface PLClientService extends PLMetadataCatalog {
    bilingual: boolean;
    client: string;
    client_expanded: PLClient;
    details: PLClientServiceDetail;
    is_active: boolean;
    locked: boolean;
    service: string;
    service_expanded: PLService;
    status: PL_CLIENT_SERVICE_STATUS;
    status_display: string;
    type: string;
}