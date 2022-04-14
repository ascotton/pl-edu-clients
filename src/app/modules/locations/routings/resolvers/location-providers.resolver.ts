import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
// RxJs
import { Observable } from 'rxjs';
import { first, filter, switchMap, withLatestFrom } from 'rxjs/operators';
// NgRx
import { AppStore } from '@root/src/app/appstore.model';
import { Store } from '@ngrx/store';
// Common
import { selectCurrentUserLoaded } from '@common/store';
import { PLLoadAllProviders, selectProvidersLoaded, selectProvidersView, selectProvidersLoading } from '@common/store/providers';

@Injectable()
export class LocationProvidersResolver implements Resolve<boolean> {

    constructor(private store$: Store<AppStore>) {}

    resolve(route: ActivatedRouteSnapshot): Observable<boolean> {
        const { id: locationId } = route.parent.params;
        const newView = `location-${locationId}`;
        const view$ = this.store$.select(selectProvidersView);
        const loaded$ = this.store$.select(selectProvidersLoaded);
        const loading$ = this.store$.select(selectProvidersLoading);
        return this.store$.select(selectCurrentUserLoaded).pipe(
            filter(loaded => loaded),
            withLatestFrom(view$, loaded$, loading$),
            switchMap(([_, currentView, loaded, loading]) => {
                if (!loading && (!loaded || (loaded && currentView !== newView))) {
                    this.store$.dispatch(PLLoadAllProviders({ payload: { locationId } }));
                }
                return loaded$;
            }),
            filter(loaded => loaded),
            first(),
        );
    }
}
