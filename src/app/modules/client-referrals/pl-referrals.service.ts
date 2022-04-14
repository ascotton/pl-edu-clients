import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { first, map } from 'rxjs/operators';
import * as moment from 'moment';

import {
    PLGraphQLService,
    PLGQLQueriesService,
    PLHttpService,
    PLUrlsService,
} from '@root/index';

import { createOrUpdateReferralMutation } from './queries/create-or-update-referral.graphql';
import { matchReferralMutation } from './queries/match-referral.graphql';
import { unmatchReferralMutation } from './queries/unmatch-referral.graphql';
import { matchReferralsMutation } from './queries/match-referrals.graphql';
import { proposeReferralMatchesMutation } from './queries/propose-referral-matches.graphql';
import { referralsQuery } from './queries/referrals.graphql';
import { referralProductTypeMap } from '@common/services/pl-client-referral';
import { sendToProvidersMutation } from './queries/send-to-providers.graphql';
import { setReferralProposedProviderMutation } from './queries/set-referral-proposed-match.graphql';

interface GetReferralsResults {
    referrals: PLReferral[];
    total: number;
}

interface MatchReferralParams {
    referralId: string;
    providerUserId: string;
}

interface UnmatchReferralParams {
    referralId: string;
    reasonToUnmatch: string;
}

interface ProposeMatchParams {
    referralId: string;
    providerUserId: string;
}

interface ProposeMatchesParams {
    organizationId: string;
    schoolYearCode: string;
}

interface ReferralQueryResult {
    id: string;
    created: string;
    client: {
        id: string;
        firstName: string;
        lastName: string;
        englishLanguageLearnerStatus: string;
        locations: {
            name: string;
            parent?: {
                id: string;
                name: string;
            }
        }[];
        primaryLanguage?: {
            name: string;
            code: string;
        };
    };
    declinedByProvidersCount: number;
    duration: number;
    frequency: number;
    isMissingInformation: boolean | null;
    isScheduled: boolean | null;
    interval: string;
    grouping: string;
    notes: string;
    productType: {
        code: string;
    };
    providerType: {
        shortName: string;
    };
    permissions: {
        matchProvider: boolean;
        updateReferral: boolean;
        unmatchReferral: boolean;
    };
    provider?: {
        id: string;
        firstName: string;
        lastName: string,
    };
    state: string;
}

export interface PLReferral {
    id: string;
    client: {
        id: string;
        firstName: string;
        lastName: string;
        englishLanguageLearnerStatus: string;
        primaryLanguage?: {
            name: string;
            code: string;
        };
    };
    clientService?: {
        id: string;
        status: string;
    };
    createdAtFromNow: string;
    discipline: string;
    duration: number;
    frequency: number;
    interval: string;
    isMissingInformation: boolean | null;
    isScheduled: boolean | null;
    grouping: string;
    locationName: string;
    notes: string;
    organizationId: string;
    organizationName: string;
    permissions: {
        matchProvider: boolean;
        updateReferral: boolean;
        unmatchReferral: boolean;
    };
    productTypeName: string;
    productTypeCode: string;
    provider?: {
        id: string;
        firstName: string;
        lastName: string,
        providerprofile?: {
            separationDate?: string;
        }
    };
    recycledCount: number;
    state: string;
    hasNotes?: boolean;
}

const toPlReferral = (referral: ReferralQueryResult): PLReferral => {
    const client = referral.client;
    const emptyLocation = { name: '', parent: { name: '', id: '' } };
    const location = client.locations.length ? client.locations[0] : emptyLocation;

    return {
        ...referral,
        createdAtFromNow: moment(referral.created, 'YYYY-MM-DD').fromNow(),
        discipline: referral.providerType.shortName.toUpperCase(),
        isMissingInformation: referral.isMissingInformation,
        isScheduled: referral.isScheduled,
        locationName: location.name || '',
        productTypeCode: referral.productType.code,
        productTypeName: referralProductTypeMap[referral.productType.code],
        organizationName: location.parent ? location.parent.name : '',
        organizationId: location.parent ? location.parent.id : '',
        recycledCount: referral.declinedByProvidersCount || 0,
    };
};

@Injectable()
export class PLReferralsService {
    constructor(
        private plGraphQl: PLGraphQLService,
        private plGQLQueries: PLGQLQueriesService,
        private plHttp: PLHttpService,
        private plUrls: PLUrlsService,
    ) {}

    getReferrals(params: any = {}): Observable<GetReferralsResults> {
        return this.plGraphQl.query(referralsQuery, params, {}).pipe(
            first(),
            map((results: any) => ({
                referrals: results.referrals.map(toPlReferral),
                total: results.referrals_totalCount,
            })),
        );
    }

    // providerUserId is the provider's CurrentUser id, not the provider profile id.
    matchReferral({ referralId, providerUserId }: MatchReferralParams, handleError?: boolean): Observable<PLReferral> {
        return this.plGraphQl.mutate(
            matchReferralMutation,
            { providerId: providerUserId, id: referralId },
            {},
            { refetchQueries: this.plGQLQueries.queryGroups.referralsAndServices },
            handleError,
        ).pipe(
            map((results: any) => toPlReferral(results.matchReferral.referral)),
        );
    }

    unmatchReferral(params: UnmatchReferralParams, handleError?: boolean): Observable<any> {
        let options = {};
        if (handleError) {
            options = { suppressError: true };
        }
        return this.plGraphQl.mutate(
            unmatchReferralMutation,
            { id: params.referralId, reason: params.reasonToUnmatch },
            options, {}, handleError,
        );
    }

    confirmProposedMatches(referralIds: string[]): Observable<PLReferral[]> {
        return this.plGraphQl.mutate(matchReferralsMutation, { referralIds }).pipe(
            map(({ matchReferrals }: any) => matchReferrals.results.map(({ referral }: any) => toPlReferral(referral))),
        );
    }

    // Note: options.providerUserId is the CurrentUser id, not provider profile id
    proposeMatch(options: ProposeMatchParams, handleError?: boolean): Observable<PLReferral> {
        const params = {
            proposedReferralMatch: {
                id: options.referralId,
                providerId: options.providerUserId,
            },
        };

        return this.plGraphQl.mutate(setReferralProposedProviderMutation, params, {}, {}, handleError).pipe(
            map((results: any) => toPlReferral(results.setReferralProposedProvider.referral)),
        );
    }

    proposeMatches(params: ProposeMatchesParams): Observable<PLReferral[]> {
        return this.plGraphQl.mutate(proposeReferralMatchesMutation, { proposeReferralMatchesInput: params }).pipe(
            map((results: any) => results.proposeReferralMatches.referrals.map(toPlReferral)),
        );
    }

    saveReferralNotes(newNotes: string, referralId: string): Observable<any> {
        const params = {
            referral: {
                id: referralId,
                notes: newNotes,
            },
        };

        return this.plGraphQl.mutate(createOrUpdateReferralMutation, params);
    }

    sendToProviders(params: { referralIds: string[] }): Observable<any> {
        // TODO: replace refetch queries with full request of new referrals and update inline,
        // as with other mutations in this service. Until then, refresh the table to update
        // referrals.
        return this.plGraphQl.mutate(
            sendToProvidersMutation,
            params,
            {},
            { refetchQueries: this.plGQLQueries.queryGroups.referralsAndServices },
        );
    }

    reassignReferral(clientServiceId: string, provider: string, temporary = false, handleError?: boolean)
        : Observable<PLReferral> {
        const url = `${this.plUrls.urls.directServices}${clientServiceId}/reassign/`;
        let options = {};
        if (handleError) {
            options = { suppressError: true };
        }
        return this.plHttp.save(null, { provider, temporary }, url, options);
    }
}
