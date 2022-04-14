import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { first, map } from 'rxjs/operators';
import * as moment from 'moment';

import { PLGraphQLService } from '@root/index';

import { PLAccountHealthSummary } from './pl-account-health-summary';
import { accountHealthSummariesQuery } from './queries/account-health-summaries.query';

export interface PLAccountHealthSummaryResults {
    summaries: PLAccountHealthSummary[];
    total: number;
}

interface QueryParameters {
    schoolYearCode: string;
    fulfillmentPercentageLte?: number;
    organizationIds?: string[];
}

interface PLAccountHealthSummaryQueryResults {
    // statsCounts includes hoursFulfillmentPercentage, matchedReferrals, referrals
    statsCounts: { name: string, count: number }[];
    organization: { id: string, name: string };
    projectedTherapyStartDate: Date;
}

@Injectable()
export class PLCamAccountsService {
    constructor(private graphQl: PLGraphQLService) {}

    public getHealthSummaries(params: QueryParameters): Observable<PLAccountHealthSummaryResults> {
        // need to map query results to summary results.
        return this.graphQl.query(accountHealthSummariesQuery, params).pipe(
            first(),
            map((results: { accountHealth: { summaries: PLAccountHealthSummaryQueryResults[] } }) => {
                const summaries = results.accountHealth.summaries;

                const count = (summary: PLAccountHealthSummaryQueryResults, name: string): number => {
                    return summary.statsCounts.find(s => s.name === name).count;
                };

                const projectedTherapyStartDate = (summary: PLAccountHealthSummaryQueryResults): Date | null => {
                    const date = summary.projectedTherapyStartDate;
                    return date ? moment(date).toDate() : null;
                };

                return {
                    summaries: summaries.map(summary => ({
                        orgId: summary.organization.id,
                        orgName: summary.organization.name,
                        projectedTherapyStartDate: projectedTherapyStartDate(summary),
                        fulfillmentPercentage: count(summary, 'hoursFulfillmentPercentage'),
                        matchedReferralCount: count(summary, 'matchedReferrals'),
                        referralCount: count(summary, 'referrals'),
                    })),
                    total: summaries.length,
                };
            }),
        );
    }
}
