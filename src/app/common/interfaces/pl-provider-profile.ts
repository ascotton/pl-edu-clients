export interface PLProviderProfile {
    id: string;
    timezone?: string;
    providerTypes?: any[];
    user: {
        id: string,
        firstName: string,
        lastName: string,
        username: string,
        permissions: {
            viewSchedule: boolean;
        }
        email: string;
        phone: string;
    };
    locations?: string[];
}
