export interface PLAccountHealthSummary {
    orgId: string;
    orgName: string;
    projectedTherapyStartDate: Date;
    fulfillmentPercentage: number;
    matchedReferralCount: number;
    referralCount: number;
}

export const plAccountHealthSummaryMock = (options: any = {}): PLAccountHealthSummary => ({
    orgId: '0',
    orgName: `Organization ${options.orgId || 'Mock'}`,
    projectedTherapyStartDate: new Date(),
    fulfillmentPercentage: 0,
    matchedReferralCount: 0,
    referralCount: 0,
    ...options,
});
