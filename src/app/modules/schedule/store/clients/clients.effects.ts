import { Injectable, Inject } from '@angular/core';
// NgRx
import { Store } from '@ngrx/store';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { AppStore } from '@app/appstore.model';
// RxJs
import { of, combineLatest } from 'rxjs';
import { concatMap, withLatestFrom, catchError, map, filter, skip, tap, switchMap } from 'rxjs/operators';
// Actions
import * as actions from './clients.store';
// Services
import { PLClientsService, PLClientServicesService } from '../../services';
import { PLClient } from '../../models';
import { selectCurrentUserId } from '@common/store';
import { MAX_QUERY_LIMIT } from '@common/services';

@Injectable()
export class ClientsEffects {

    private userId$ = this.store$.select(selectCurrentUserId);
    private loadedCount$ = combineLatest([
        this.store$.select(actions.selectClientsLoadedCount).pipe(),
        this.store$.select(actions.selectClientsLoading),
    ]).pipe(
        filter(([_, loading]) => !loading),
        map(([count]) => count),
        skip(1),
        filter(count => count > 0),
    );
    private count$ = this.store$.select(actions.selectClientsTotal);

    fetchAllCaseloadd$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLLoadAllCaseload),
            tap(({ payload }) => {
                this.store$.dispatch(actions.PLClearClients());
                this.store$.dispatch(
                    actions.PLFetchCaseload({ payload: { ...payload, page: 1 } }));
            }),
            switchMap(({ payload }) => this.loadedCount$.pipe(
                withLatestFrom(this.count$),
                tap(([loaded, count]) => {
                    const missingBatches = Math.ceil((count - loaded) / this.maxLimit);
                    if (missingBatches > 0) {
                        for (let page = 1; page <= missingBatches; page++) {
                            this.store$.dispatch(
                                actions.PLFetchCaseload({ payload: { ...payload, page: page + 1 } }));
                        }
                    }
                }),
            )),
        ), { dispatch: false });

    getClient$ = createEffect(() => this.actions$.pipe(
        ofType(actions.PLGetClient),
        concatMap(({ payload: uuid }) => {
            return this.clientsService.get(uuid).pipe(
                map(({ results: payload }) => actions.PLGetClientSuccess({ payload })),
                catchError(() => of(actions.PLGetClientFail({}))),
            );
        }),
    ));

    load$ = createEffect(() => this.actions$.pipe(
        ofType(actions.PLLoadClients),
        concatMap(() => {
            return this.clientsService.get().pipe(
                map(({ results: payload }) => actions.PLLoadClientsSuccess({ payload })),
                catchError(() => of(actions.PLLoadClientsFail({}))),
            );
        }),
    ));

    fetchCaseload$ = createEffect(() => this.actions$.pipe(
        ofType(actions.PLFetchCaseload),
        withLatestFrom(this.userId$),
        concatMap(([{ payload }, userId]) => {
            const { provider, page } = payload;
            const params = { page, provider: provider || userId, limit: this.maxLimit };
            return this.clientsService.getCaseload(params).pipe(
                map(({ results, count }) => actions.PLAddCaseload({
                    payload: {
                        count,
                        list: results.map((c: PLClient) => ({ ...c, in_caseload: true })),
                    },
                })),
                catchError(() => of(actions.PLFetchCaseloadFail())),
            );
        }),
    ));

    loadClientServices$ = createEffect(() => this.actions$.pipe(
        ofType(actions.PLGetClientServices),
        withLatestFrom(this.userId$),
        concatMap(([action, user]) => {
            const { provider = user, client, billingCode } = action.payload;
            return this.clientServicesService.get(provider, client, billingCode).pipe(
                map(payload => actions.PLGetClientServicesSuccess({ payload })),
                catchError((err) => {
                    console.log(err);
                    return of(actions.PLGetClientServicesFail({}));
                }),
            );
        }),
    ));

    stopLoading$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLAddCaseload, actions.PLFetchCaseloadFail),
            map(() => actions.PLStopClientsLoading()),
        ));

    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private clientsService: PLClientsService,
        private clientServicesService: PLClientServicesService,
        @Inject(MAX_QUERY_LIMIT) private maxLimit: number,
    ) { }
}
