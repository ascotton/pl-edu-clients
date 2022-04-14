import { Injectable } from '@angular/core';
// NgRx
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { Actions, ofType, createEffect } from '@ngrx/effects';
// RxJs
import { of } from 'rxjs';
import { concatMap, catchError, map, withLatestFrom, count, tap } from 'rxjs/operators';
// Actions
import * as actions from './search.store';
// Services
import { PLSearchService } from '../services';
import { selectCurrentSchoolYear } from '@root/src/app/common/store';

@Injectable()
export class SearchEffects {

    private user$ = this.store$.select('currentUser');
    private sy$ = this.store$.select(selectCurrentSchoolYear);

    searchClients$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLSearchClients),
            withLatestFrom(this.user$, this.sy$),
            concatMap(([{ page, limit }, { uuid }, { code }]) =>
                this.searchService.searchClients(code, limit, page).pipe(
                    map(payload => actions.PLSearchClientsSuccess({ ...payload, userId: uuid })),
                    catchError(() => of(actions.PLSearchClientsFail())),
                )),
        ));

    searchProviders$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLSearchProviders),
            withLatestFrom(this.user$),
            concatMap(([{ page, limit }, { uuid }]) => this.searchService.searchProviders(limit, page).pipe(
                map(payload => actions.PLSearchProvidersSuccess({ ...payload, userId: uuid })),
                catchError(() => of(actions.PLSearchProvidersFail())),
            )),
        ));

    searchLocations$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLSearchLocations),
            withLatestFrom(this.user$),
            concatMap(([{ page, limit }, { uuid }]) => this.searchService.searchLocations(limit, page).pipe(
                map(payload => actions.PLSearchLocationsSuccess({ ...payload, userId: uuid })),
                catchError(() => of(actions.PLSearchLocationsFail())),
            )),
        ));

    searchOrganizations$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLSearchOrganizations),
            withLatestFrom(this.user$),
            concatMap(([{ page, limit }, { uuid }]) => this.searchService.searchOrganizations(limit, page).pipe(
                map(payload => actions.PLSearchOrganizationsSuccess({ ...payload, userId: uuid })),
                catchError(() => of(actions.PLSearchOrganizationsFail())),
            )),
        ));

    addProviderToHistory$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLAddRecentProvider),
            withLatestFrom(this.user$),
            map(([{ provider }, { uuid: userId }]) => {
                const item = this.searchService.buildProvider(provider, new Date());
                return actions.PLAddRecentItem({ item, userId });
            }),
        ));

    addLocationToHistory$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLAddRecentLocation),
            withLatestFrom(this.user$),
            map(([{ location }, { uuid: userId }]) => {
                const item = this.searchService.buildLocation(location, new Date());
                return actions.PLAddRecentItem({ item, userId });
            }),
        ));

    addOrganizationToHistory$ = createEffect(() =>
        this.actions$.pipe(
            ofType(actions.PLAddRecentOrganization),
            withLatestFrom(this.user$),
            map(([{ organization }, { uuid: userId }]) => {
                const item = this.searchService.buildOrganization(organization, new Date());
                return actions.PLAddRecentItem({ item, userId });
            }),
        ));

    addClientToHistory$ = createEffect(() =>
        this.actions$.pipe(
            ofType('UPDATE_CURRENT_CLIENT'),
            withLatestFrom(this.user$),
            map(([{ payload }, { uuid: userId }]) => {
                const item = this.searchService.buildClient(payload, new Date());
                return actions.PLAddRecentItem({ item, userId });
            }),
        ));

    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private searchService: PLSearchService,
    ) { }
}
