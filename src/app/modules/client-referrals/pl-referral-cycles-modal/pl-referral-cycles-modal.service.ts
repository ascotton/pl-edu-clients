import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { PLGraphQLService, PLTimezoneService } from '@root/index';

import { REFERRALS_DECLINE_HISTORY_GQL } from '../queries/referrals-decline-history.graphql';

export interface ReferralDeclineHistory {
    referralCreatedOn: string;
    providerFirstName: string;
    providerLastName: string;
    declineReason: string;
    unmatchedBy: string;
}

export interface ReferralDeclineHistoryGQLResponse {
    referral: {
        declineHistory: {
            created: string,
            provider: {
                lastName: string,
                firstName: string,
            },
            reason: string,
            state: string,
        }[];
    };
}

@Injectable()
export class PLReferralCyclesModalService {

    private declineReason = {
        SCHEDULING_CONFLICT : 'Scheduling Conflict',
        CLINICAL_REASON : 'Clinical Reason',
        GROUPING : 'Grouping',
        LANGUAGE : 'Language',
        DUPLICATE_REFERRAL : 'Duplicate Referral',
        DUPLICATE_OF_SERVICE_IN_PROGRESS : 'Duplicate of Service in Progress',
        INCORRECT_REFERRAL : 'Incorrect Referral',
    };

    private gql = {
        referralDeclineHistory: REFERRALS_DECLINE_HISTORY_GQL,
    };

    constructor(
        private plGraphQL: PLGraphQLService,
        private plTimezoneSvc: PLTimezoneService,
    ) {}

    getReferralDeclineHistory(referralId: string): Observable<ReferralDeclineHistory[]> {
        return this.plGraphQL.query(this.gql.referralDeclineHistory, { id: referralId }).pipe(
            map(({ referral }: ReferralDeclineHistoryGQLResponse) => {
                const declineHistory = referral && referral.declineHistory || [];

                return declineHistory.map((decline) => {
                    const splitReferralCreated = this.plTimezoneSvc.toUTC(decline.created, 'YYYY/MM/DD').split('/');
                    const referralCreated = `${splitReferralCreated[1]}/${splitReferralCreated[2]}/${splitReferralCreated[0]}`;
                    const unmatched = decline.state === 'RETRACTED' ? 'CAM' : 'Provider';

                    return {
                        referralCreatedOn: referralCreated,
                        providerFirstName: decline.provider.firstName,
                        providerLastName: decline.provider.lastName,
                        declineReason: this.declineReason[decline.reason],
                        unmatchedBy: unmatched,
                    };
                });
            }),
        );
    }

}
