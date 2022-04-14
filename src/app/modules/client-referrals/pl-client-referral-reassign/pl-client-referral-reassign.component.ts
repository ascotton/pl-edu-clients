import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { first, switchMap, defaultIfEmpty, catchError } from 'rxjs/operators';
import { Observable, Subject, of, forkJoin, throwError } from 'rxjs';
import { CLINICAL_PRODUCT_TYPE } from '@common/constants';
import {
    referralProductTypeMap,
} from '@common/services/pl-client-referral';
import { PLReferral, PLReferralsService } from '../pl-referrals.service';
import {
    PLClientEvaluationReassignService,
} from '@modules/clients/pl-client-evaluation-reassign/pl-client-evaluation-reassign.service';
import {
    PLClientReferralMatchReferralService,
    Provider,
} from '../pl-client-referral-match/pl-client-referral-match-referral.service';

@Component({
    selector: 'pl-client-referral-reassign',
    templateUrl: './pl-client-referral-reassign.component.html',
    styleUrls: ['./pl-client-referral-reassign.component.less'],
    providers: [
        PLClientReferralMatchReferralService,
        PLClientEvaluationReassignService,
    ],
})
export class PLClientReferralReassignComponent implements OnInit, OnDestroy {

    @Input() referrals: PLReferral[] = [];
    @Input() providers: Provider[] = [];
    @Input() currentUserEmail: string;
    requestLink: string;
    discipline: string;
    submiting: boolean;
    loading: boolean;
    selectedProviderUserId: string;
    closed$ = new Subject<{ type: 'submit' | 'cancel'; errors?: any[] }>();

    constructor(private plReferralsService: PLReferralsService,
        private plEvaluationReassign: PLClientEvaluationReassignService,
        private plClientReferralMatchService: PLClientReferralMatchReferralService) {}

    ngOnInit() {
        this.getProviders();
    }

    ngOnDestroy() {
        this.closed$.complete();
    }

    private close(submit = false, errors?: any[]) {
        this.closed$.next({ errors, type: submit ? 'submit' : 'cancel' });
    }

    productTypeName(referral: PLReferral): string {
        return referralProductTypeMap[referral.productTypeCode];
    }

    getProviders() {
        const { discipline, id, locationName } = this.referrals[0];
        this.discipline = discipline;
        this.loading = true;
        this.requestLink = `https://www.tfaforms.com/4649022?` +
            `tfa_874=${locationName}&` +
            `tfa_875=${encodeURIComponent(this.currentUserEmail)}`;
        this.plClientReferralMatchService.getProviders(id)
            .subscribe((providers) => {
                this.loading = false;
                this.providers = providers.sort((a, b) => b.remainingAvailableHours - a.remainingAvailableHours);
            });
    }

    cancel() { this.close(); }

    reassign() {
        const providerUserId = this.selectedProviderUserId;
        const reasonToUnmatch = 'incorrect_referral'; // Should user select a reason?
        this.submiting = true;

        const reassignReferralsCalls = this.referrals
            .map(({ id: referralId, state, clientService, productTypeCode, client }) => {
                const productName = referralProductTypeMap[productTypeCode];
                const params = { referralId, providerUserId };
                let observer: Observable<any>;
                switch (state) {
                        case 'CONVERTED':
                            observer = productName === CLINICAL_PRODUCT_TYPE.NAME.EVAL ?
                                this.plEvaluationReassign.makeMatch(clientService.id, providerUserId, '', true) :
                                this.plReferralsService.reassignReferral(clientService.id, providerUserId, true);
                            break;
                        case 'PROPOSED':
                        case 'UNMATCHED_PL_REVIEW':
                            observer = this.plReferralsService.matchReferral(params);
                            break;
                        case 'MATCHED':
                            const unmatchParams = { referralId, reasonToUnmatch };
                            observer = this.plReferralsService.unmatchReferral(unmatchParams, true)
                                .pipe(
                                    switchMap(({ unmatchReferral }) => {
                                        if (!unmatchReferral.errors) {
                                            return this.plReferralsService.matchReferral(params, true);
                                        }
                                        return of({ error: unmatchReferral.errors });
                                    }),
                                    catchError((err) => {
                                        console.log(err);
                                        return throwError(err.data.unmatchReferral.errors);
                                    }),
                                );
                            break;
                }
                if (!observer) {
                    return of({ });
                }
                return observer.pipe(
                    first(),
                    catchError((err) => {
                        let errorMessage = '';
                        const clientName = `${client.lastName}, ${client.firstName}`;
                        if (err && err.message) {
                            errorMessage = err.message.replace('GraphQL error: ', '');
                        } else if (Array.isArray(err) && err[0] && err[0].message) {
                            errorMessage = err[0].message;
                        }
                        errorMessage = errorMessage.replace(new RegExp('client', 'ig'), clientName);
                        if (!errorMessage) {
                            errorMessage = clientName;
                        }
                        return of({ error: errorMessage });
                    }),
                );
            });

        forkJoin(reassignReferralsCalls)
            .pipe(defaultIfEmpty())
            .subscribe((res: any[]) => {
                const errors = res
                    .filter(r => !!r)
                    .filter(r => r.error);
                this.submiting = false;
                this.close(true, errors);
            }, () => {
                this.submiting = false;
            });
    }
}
