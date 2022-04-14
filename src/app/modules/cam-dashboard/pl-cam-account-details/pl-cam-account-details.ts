import { PLLocationReferralStats, plLocationReferralStatsMock } from './pl-location-referral-stats';
import { PLServiceStatus } from './pl-service-status';

export interface PLCamAccountDetails {
    locationReferralStats: PLLocationReferralStats[];
    serviceStatuses: PLServiceStatus[];
}

export const plCamAccountDetailsMock = (options: any = {}): PLCamAccountDetails => ({
    locationReferralStats: [],
    serviceStatuses: [],
    ...options,
});
