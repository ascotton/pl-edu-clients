export enum PL_INTERVAL {
    Day = 'daily',
    Week = 'weekly',
    Month = 'monthly',
    Quarter = 'quarterly',
    Annual = 'annually',
    Semester = 'per_semester',
    Every2Weeks = 'every_2_weeks',
    Every3Weeks = 'every_3_weeks',
    Every4Weeks = 'every_4_weeks',
    Every5Weeks = 'every_5_weeks',
    Every6Weeks = 'every_6_weeks',
    Every7Weeks = 'every_7_weeks',
    Every8Weeks = 'every_8_weeks',
    Every9Weeks = 'every_9_weeks',
    Every10Weeks = 'every_10_weeks',
    Every11Weeks = 'every_11_weeks',
}

export enum PL_GROUPING {
    Individual = 'individual_only',
    Group = 'group_only',
    Both = 'individual_or_group',
}

export interface PLReferral {
    id: string;
    client: {
        id: string;
        firstName: string;
        lastName: string;
    };
    provider: {
        id: string;
        firstName: string;
        lastName: string;
    };
    providerType: {
        longName: string;
        shortName: string;
    };
    isScheduled: boolean;
    isMissingInformation?: boolean;
    state: string;
    duration: number;
    frequency: number;
    grouping: PL_GROUPING;
    interval: PL_INTERVAL;
    grade?: string;
    active?: boolean;
}

export interface PLReferralFilters {
    clientLocationId_In?: string | string[];
    providerId?: string;
    providerTypeCode_In?: string | string[];
    schoolYearCode_In?: string | string[];
    productTypeCode_In?: string | string[];
    state_In?: string | string[];
    isMissingInformation?: boolean;
    isScheduled?: boolean;
    isProviderView?: boolean; // To hide referrals in PROPOSED State
}
