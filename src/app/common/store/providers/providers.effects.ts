import { Injectable } from '@angular/core';
// NgRx
import { Store } from '@ngrx/store';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { AppStore } from '../../../appstore.model';
// RxJs
import { of, combineLatest } from 'rxjs';
import { catchError, map, tap, mergeMap, switchMap, first, skip, withLatestFrom, filter } from 'rxjs/operators';
// Actions
import * as actions from './providers.store';
// Services
import { PLProviderProfileService } from '../../services/pl-provider-profile.service';

@Injectable()
export class ProvidersEffects {

    private maxLimit: number;
    private loadedCount$ = combineLatest([
        this.store$.select(actions.selectProvidersLoadedCount).pipe(),
        this.store$.select(actions.selectProvidersLoading),
    ]).pipe(
        filter(([_, loading]) => !loading),
        map(([count]) => count),
        skip(1),
        filter(count => count > 0),
    );
    private count$ = this.store$.select(actions.selectProvidersTotal);

    fetchAll$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLLoadAllProviders),
            tap(({ payload, dontClear }) => {
                if (!dontClear) {
                    this.store$.dispatch(actions.PLClearProviders());
                }
                this.store$.dispatch(
                    actions.PLFetchProviders({ payload: { ...payload, page: 1 } }));
            }),
            switchMap(({ payload }) => this.loadedCount$.pipe(
                withLatestFrom(this.count$),
                tap(([loaded, count]) => {
                    const missingBatches = Math.ceil((count - loaded) / this.maxLimit);
                    if (missingBatches) {
                        for (let page = 1; page <= missingBatches; page++) {
                            this.store$.dispatch(
                                actions.PLFetchProviders({ payload: { ...payload, page: page + 1 } }));
                        }
                    }
                }),
            )),
        ), { dispatch: false });

    fetch$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLFetchProviders),
            withLatestFrom(this.store$.select(actions.selectProvidersEntities)),
            mergeMap(([{ payload }, allProviders]) => {
                const { locationId, page } = payload;
                return this.plProvider.getProviderProfiles({ locationId, page, first: this.maxLimit }).pipe(
                    map(({ providers, totalCount: count }) => {
                        let list = providers;
                        list = list.map((c) => {
                            c.locations = locationId ? [locationId] : [];
                            const p = allProviders[c.id];
                            if (p && p.locations) {
                                return { ...p, locations: [...p.locations, ...c.locations] };
                            }
                            return c;
                        });
                        return actions.PLAddProviders({ payload: { list, count } });
                    }),
                    catchError(err => of(actions.PLFetchProvidersFail({ payload: err }))),
                );
            })),
        );

    stopLoading$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLAddProviders, actions.PLFetchProvidersFail),
            map(() => actions.PLStopProvidersLoading()),
        ));

    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private plProvider: PLProviderProfileService,
    ) {
        this.maxLimit = 1000;
    }
}
