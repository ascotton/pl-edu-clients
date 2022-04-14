export interface PLServiceStatus {
    serviceName: string; // e.g., SLT, OT, BMH
    assignedProviderHours: number;
    contractedReferralHours: number;
    onboardingCount: number;
    inServiceCount: number;
    notInServiceCount: number;
}

export const plServiceStatusMock = (options: any = {}) => ({
    serviceName: 'ABC',
    assignedProviderHours: 0,
    contractedReferralHours: 0,
    onboardingCount: 0,
    inServiceCount: 0,
    notInServiceCount: 0,
    ...options,
});
