export interface PLLocation {
    id: string;
    name: string;
    state?: string;
    timezone?: string;
    locationType?: string;
    organizationName?: string;
    organization?: {
        id: string;
    };
    sfAccountId: string;
    parent?: {
        id: string;
        name: string;
        state: string;
        website: string;
        sfAccountId: string;
        shippingAddress: {
            street: string;
            city: string;
            state: string;
            stateDisplay: string;
            postalCode: string;
            country: string;
        };
        lead: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        }
    };
    accountOwner?: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        email: string;
        profile: {
            id: string;
            primaryPhone: string;
        }
    };
    techCheckStatus?: string;
    projectedTherapyStartDate?: Date;
    dateTherapyStarted?: Date;
    computerSetupUrl?: string;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        stateDisplay: string;
        postalCode: string;
        country: string;
    };
}
