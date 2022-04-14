import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PLGraphQLService, PLGQLQueriesService } from '@root/index';

import { referralEvaluationProvidersQuery } from './queries/referral-eval-providers.graphql';
import { reassignEvaluationMutation }  from './queries/reassign-eval.graphql';

@Injectable()
export class PLClientEvaluationReassignService {

    constructor(private plGraphQL: PLGraphQLService,
        private plGQLQueries: PLGQLQueriesService) {
    }

    getProviders({ clientId, providerTypeIds }: { clientId: string, providerTypeIds: string[] }) {
        return new Observable((observer: any) => {
            const variables = {
                clientId,
                providerTypeIds,
            };
            this.plGraphQL.query(referralEvaluationProvidersQuery, variables, {}).subscribe((res: any) => {
                const providers = res.referralProviderCandidates || [];
                observer.next({
                    providers,
                });
            }, (err: any) => {
                observer.error(err);
            });
        });
    }

    match(data: { serviceId: string, providerId: string, newNotes: string }) {
        return new Observable((observer: any) => {
            this.makeMatch(data.serviceId, data.providerId, data.newNotes)
                .subscribe((resMatch: any) => {
                    const referral = resMatch.referral;
                    observer.next({
                        referral,
                    });
                }, (err: any) => {
                    observer.error(err);
                });
        });
    }

    makeMatch(serviceId: string, providerId: string, newNotes: string, handleError?: boolean) {
        return new Observable((observer: any) => {
            const variables: any = {
                reassignEvaluationInput: {
                    providerId,
                    id: serviceId,
                    sendToReferralManager: false,
                },
            };
            if (newNotes) {
                variables.reassignEvaluationInput.referralNote = newNotes;
            }
            let options = {};
            if (handleError) {
                options = { suppressError: true };
            }
            this.plGraphQL.mutate(reassignEvaluationMutation, variables, options, {
                refetchQueries: this.plGQLQueries.queryGroups.referralsAndServices,
            }, handleError).subscribe((res: any) => {
                const referral = res.reassignEvaluation.referral;
                observer.next({
                    referral,
                });
            }, (err: any) => {
                observer.error(Array.isArray(err) ? err[0] : err);
            });
        });
    }
}
