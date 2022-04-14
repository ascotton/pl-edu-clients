import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import * as moment from 'moment';

import { PLGraphQLService, PLTimezoneService } from '@root/index';

import { PLCamAccountNumbers } from './pl-cam-account-numbers';

import { statsAccountManagerOverviewQuery } from './queries/stats-account-manager-overview.query';

interface QueryParameters {
    referralsToConvertCreatedAtLtUtc: moment.Moment;
    schoolYearCode: string;
}

interface QueryResults {
    statsAccountManagerOverview: {
        statsCounts: { name: string, count: number }[];
    };
}

@Injectable()
export class PLCamAccountNumbersService {
    constructor(private graphQl: PLGraphQLService, private timezone: PLTimezoneService) {}

    public getAccountNumbers(params: QueryParameters): Observable<PLCamAccountNumbers> {
        const format = this.timezone.formatDate;

        const queryParams = {
            ...params,
            referralsToConvertCreatedAtLt: params.referralsToConvertCreatedAtLtUtc.format(format),
        };

        return this.graphQl.query(statsAccountManagerOverviewQuery, queryParams).pipe(
            first(),
            map((stats: QueryResults) => {
                const counts = stats.statsAccountManagerOverview.statsCounts;
                const count = (name: string) => counts.find(s => s.name === name).count;

                return {
                    accountsUnfulfilledCount: count('accountsUnfulfilled'),
                    assignmentsPendingCount: count('assignmentsPending'),
                    assignmentsProposedCount: count('assignmentsProposed'),
                    locationsRequiringSchedulingCount: count('locationsRequiringScheduling'),
                    referralsToConvertCount: count('referralsToConvert'),
                    referralsTotalCount: count('referralsTotal'),
                    referralsUnmatchedCount: count('referralsUnmatched'),
                    servicesEvalsPastDue: count('servicesEvalsPastDue'),
                    servicesTotalCount: count('servicesTotal'),
                    servicesUndocumentedBeyondStartDate: count('servicesUndocumentedBeyondStartDate'),
                };
            }),
        );
    }
}
