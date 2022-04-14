import { Injectable, Inject } from '@angular/core';
// NgRx
import { Store } from '@ngrx/store';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { AppStore } from '@app/appstore.model';
// RxJs
import { of, combineLatest } from 'rxjs';
import { concatMap, catchError, map, withLatestFrom, tap, switchMap, filter, first, finalize, skip } from 'rxjs/operators';
// Common
import { selectLoadedUser } from '@common/store';
// Actions
import * as actions from './locations.store';
// Services
import { PLLocationsService } from '../../services';
import { PLMayService } from '@root/index';
import { MAX_QUERY_LIMIT } from '@common/services';

@Injectable()
export class LocationsEffects {

    private user$ = this.store$.pipe(selectLoadedUser);
    private loadedCount$ = combineLatest([
        this.store$.select(actions.selectLocationsLoadedCount).pipe(),
        this.store$.select(actions.selectLocationsLoading),
    ]).pipe(
        filter(([_, loading]) => !loading),
        map(([count]) => count),
        skip(1),
        filter(count => count > 0),
    );
    private count$ = this.store$.select(actions.selectLocationsTotal);

    fetchAll$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLLoadAllLocations),
            tap(({ payload }) => {
                this.store$.dispatch(actions.PLClearLocations());
                this.store$.dispatch(
                    actions.PLFetchLocations({ payload: { ...payload, page: 1 } }));
            }),
            switchMap(({ payload }) => this.loadedCount$.pipe(
                withLatestFrom(this.count$),
                tap(([loaded, count]) => {
                    const missingBatches = Math.ceil((count - loaded) / this.maxLimit);
                    if (missingBatches > 0) {
                        for (let page = 1; page <= missingBatches; page++) {
                            this.store$.dispatch(
                                actions.PLFetchLocations({ payload: { ...payload, page: page + 1 } }));
                        }
                    }
                }),
            )),
        ), { dispatch: false });

    fetch$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLFetchLocations),
            withLatestFrom(this.user$),
            concatMap(([action, user]) => {
                const { client, checkLead, page } = action.payload;
                let { provider } = action.payload;
                let params: any = { page };
                if (!provider) {
                    provider = user.uuid;
                    const isLead = checkLead && this.plMay.isLead(user);
                    params = {
                        ...params,
                        provider,
                        ...(isLead ? { is_active_for_cam_billing: true } : { is_active: true }),
                    };
                }
                if (client) {
                    params = { ...params, client };
                }
                return this.locationsService.get(params).pipe(
                    map(({ count, results: list }) => actions.PLAddLocations({ payload: { list, count } })),
                    catchError(() => of(actions.PLFetchLocationsFail())),
                );
            }),
        ));

    stopLoading$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLAddLocations, actions.PLFetchLocationsFail),
            map(() => actions.PLStopLocationsLoading()),
        ));

    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private locationsService: PLLocationsService,
        private plMay: PLMayService,
        @Inject(MAX_QUERY_LIMIT) private maxLimit: number,
    ) { }
}
