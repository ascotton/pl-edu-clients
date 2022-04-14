import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
// RxJs
import { filter, first, map, withLatestFrom } from 'rxjs/operators';
// NgRx
import { AppStore } from '@root/src/app/appstore.model';
import { Store } from '@ngrx/store';
import { selectLocationState, PLFetchLocation, selectCurrentLocationId } from '../../store';

@Injectable()
export class LocationResolver implements Resolve<boolean> {

    constructor(private store$: Store<AppStore>) {}

    resolve(route: ActivatedRouteSnapshot) {
        const { id: locationId } = route.parent.params;
        return this.store$.select(selectLocationState).pipe(
            withLatestFrom(this.store$.select(selectCurrentLocationId)),
            filter(([{ loaded, loading }, locId]) => {
                if (!(loaded || loading) || locId !== locationId) {
                    this.store$.dispatch(PLFetchLocation({ locationId }));
                }
                return loaded;
            }),
            map(([{ loaded }]) => loaded),
            first(),
        );
    }
}
