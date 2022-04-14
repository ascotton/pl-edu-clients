import { PLProviderProfile, PLAvailability } from '@common/interfaces';

export interface PLProviderSession {
    id?: string;
    week?: number;
    day: string;
    start: string;
    end: string;
    locationId: string;
    providerId: string;
    hasReferrals?: boolean;
    referralIds?: string[];
    referrals?: any[];
    /*
    {
        id: string;
        state: string;
        client: {
            id: string;
            firstName: string;
            lastName: string;
        },
    }
    */
    timezone?: string;
    location?: {
        id?: string;
        name?: string;
        timezone?: string;
        organizationName?: string;
    };
    provider?: any;
}

export interface PLProvider extends PLProviderProfile {
    timezone: string;
    availabilityBlocks: PLAvailability[];
    schedule: PLProviderSession[];
    providerTypes?: any[];
}
