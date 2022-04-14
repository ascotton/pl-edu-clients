import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { PLGraphQLService } from '@root/index';
import { nodeToLocation } from '@common/services/locations/pl-location';
import { PLLocationReferralStats } from './pl-location-referral-stats';
import { PLCamAccountDetails } from './pl-cam-account-details';
import { PLServiceStatus } from './pl-service-status';
import { statsLocationReferralsQuery } from './queries/stats-location-referrals.query';

interface QueryParameters {
    organizationId?: string;
    schoolYearCode: string;
}

interface NameCountNode {
    name: string;
    count: number;
}

interface QueryResults {
    statsLocationReferrals: {
        serviceStatusCounts: {
            name: string;
            statusCounts: NameCountNode[];
            hours: NameCountNode[];
        }[];
        stats: {
            location: {
                id: string;
                locationType: string;
                name: string;
                organization?: {
                    id: string;
                }
                organizationName: string;
                state: string;
            };
            statsCounts: NameCountNode[];
        }[];
    };
}

@Injectable()
export class PLCamAccountDetailsService {
    constructor(private graphQl: PLGraphQLService) {}

    getDetails(params: QueryParameters): Observable<PLCamAccountDetails> {
        return this.fetchDetails(params);
    }

    private fetchDetails(params: QueryParameters): Observable<PLCamAccountDetails> {
        const count = (nodes: NameCountNode[], name: string) => nodes.find(n => n.name === name).count;

        return this.graphQl.query(statsLocationReferralsQuery, params).pipe(
            first(),
            map(({ statsLocationReferrals: results }: QueryResults) => ({
                serviceStatuses: results.serviceStatusCounts.map(service => ({
                    serviceName: service.name,
                    assignedProviderHours: count(service.hours, 'Assigned Hours'),
                    contractedReferralHours: count(service.hours, 'Contracted Hours'),
                    onboardingCount: count(service.statusCounts, 'Onboarding'),
                    inServiceCount: count(service.statusCounts, 'In Service'),
                    notInServiceCount: count(service.statusCounts, 'Not In Service'),
                })),
                locationReferralStats: results.stats.map((stats) => {
                    const counts = {
                        convertedCount: count(stats.statsCounts, 'converted'),
                        matchedCount: count(stats.statsCounts, 'matched'),
                        missingInfoCount: count(stats.statsCounts, 'isMissingInformation'),
                        openCount: count(stats.statsCounts, 'unmatchedOpenToProviders'),
                        proposedCount: count(stats.statsCounts, 'proposed'),
                        scheduledCount: count(stats.statsCounts, 'scheduled'),
                        unmatchedCount: count(stats.statsCounts, 'unmatchedPlReview'),
                    };

                    const total =
                        counts.convertedCount +
                        counts.matchedCount +
                        counts.openCount +
                        counts.proposedCount +
                        counts.unmatchedCount;

                    return {
                        ...counts,
                        location: nodeToLocation(stats.location),
                        totalCount: total,
                        missingInfoPercentage: total > 0 ? (counts.missingInfoCount / total) : 0,
                        scheduledPercentage: total > 0 ? (counts.scheduledCount / total) : 0,
                    };
                }),
            })),
        );
    }
}
