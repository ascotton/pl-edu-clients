export interface PLCamAccountNumbers {
    accountsUnfulfilledCount: number;
    assignmentsPendingCount: number;
    assignmentsProposedCount: number;
    locationsRequiringSchedulingCount: number;
    referralsToConvertCount: number;
    referralsTotalCount: number;
    referralsUnmatchedCount: number;
    servicesEvalsPastDue: number;
    servicesTotalCount: number;
    servicesUndocumentedBeyondStartDate: number;
}

export const plCamAccountNumbersMock = (options: any = {}): PLCamAccountNumbers => ({
    assignmentsPendingCount: 0,
    assignmentsProposedCount: 0,
    accountsUnfulfilledCount: 0,
    locationsRequiringSchedulingCount: 0,
    referralsToConvertCount: 0,
    referralsTotalCount: 0,
    referralsUnmatchedCount: 0,
    servicesEvalsPastDue: 0,
    servicesTotalCount: 0,
    servicesUndocumentedBeyondStartDate: 0,
    ...options,
});
