import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { PLGraphQLService } from '@root/index';

const referralMatchProvidersQuery = require('./queries/referral-match-providers.graphql');

interface GetProviderResults {
    referral: {
        providerCandidates: {
            caseloadCount: number;
            user: {
                id: string;
                firstName: string;
                lastName: string;
            };
            remainingAvailableHours: number;
        }[];
    };
}

export interface Provider {
    caseloadCount: number;
    name: string;
    userId: string;
    remainingAvailableHours: number;
}

@Injectable()
export class PLClientReferralMatchReferralService {
    constructor(private plGraphQL: PLGraphQLService) {}

    getProviders(referralId: string): Observable<Provider[]> {
        return this.plGraphQL.query(referralMatchProvidersQuery, { id: referralId }).pipe(
            map(({ referral }: GetProviderResults) => {
                const providers = referral && referral.providerCandidates || [];

                return providers.map(provider => ({
                    userId: provider.user.id,
                    caseloadCount: provider.caseloadCount,
                    name: `${provider.user.firstName} ${provider.user.lastName}`,
                    remainingAvailableHours: Math.round(provider.remainingAvailableHours * 10) / 10,
                }));
            }),
        );
    }
}
