import { PLLocation } from '@common/services/locations/pl-location';
import { plLocationMock } from '@common/services/locations/pl-location.mock';

export interface PLLocationReferralStats {
    location: PLLocation;
    convertedCount: number;
    matchedCount: number;
    missingInfoCount: number;
    openCount: number;
    proposedCount: number;
    scheduledCount: number;
    unmatchedCount: number;
    totalCount: number;
    missingInfoPercentage: number;
    scheduledPercentage: number;
}

export const plLocationReferralStatsMock = (options: any = {}): PLLocationReferralStats => ({
    location: options.location || plLocationMock({ name: 'A Location' }),
    convertedCount: 0,
    matchedCount: 0,
    missingInfoCount: 0,
    openCount: 0,
    proposedCount: 0,
    scheduledCount: 0,
    unmatchedCount: 0,
    totalCount: 0,
    missingInfoPercentage: 0,
    scheduledPercentage: 0,
    ...options,
});
