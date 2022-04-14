import { Injectable } from '@angular/core';
import { PLGraphQLService } from '@root/index';
// RxJs
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
// Models
import { PLReferral, PLReferralFilters } from '@common/interfaces';

@Injectable()
export class PLReferralService {

    constructor(private plGraphQL: PLGraphQLService) { }

    get(filters: PLReferralFilters): Observable<PLReferral[]> {
        const query = `query locationReferrals(
            $state_In: String,
            $providerId: String,
            $isScheduled: Boolean,
            $schoolYearCode_In: String,
            $productTypeCode_In: String,
            $clientLocationId_In: String,
            $providerTypeCode_In: String,
            $isMissingInformation: Boolean) {
          referrals(
            state_In: $state_In,
            providerId: $providerId,
            isScheduled: $isScheduled,
            schoolYearCode_In: $schoolYearCode_In,
            productTypeCode_In: $productTypeCode_In,
            clientLocationId_In: $clientLocationId_In,
            providerTypeCode_In: $providerTypeCode_In,
            isMissingInformation: $isMissingInformation) {
            edges {
              node {
                id
                client {
                  id
                  firstName
                  lastName
                  englishLanguageLearnerStatus
                  primaryLanguage {
                    code
                  }
                }
                provider {
                  id
                  firstName
                  lastName
                }
                providerType {
                  longName
                  shortName
                }
                productType {
                  code
                }
                state
                grade
                frequency
                interval
                duration
                grouping
                isScheduled
              }
            }
          }
        }`;
        return this.plGraphQL.query(query, filters).pipe(
          first(),
          map((result: { referrals: PLReferral[] }) =>
            result.referrals.map(referral => ({
                ...referral,
                isMissingInformation: !(referral.interval && referral.duration && referral.frequency),
            }))),
        );
    }
}
