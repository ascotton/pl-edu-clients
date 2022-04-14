import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
// NgRx Store
import { Store } from '@ngrx/store';
import { selectLocations, PLLoadAllLocations } from '../store/locations';
// RxJs
import { filter, first, switchMap } from 'rxjs/operators';
import { selectCurrentUserLoaded } from '@common/store';

@Injectable()
export class LocationsResolver implements Resolve<any[]> {

    constructor(private store$: Store<any>) { }

    resolve(route: ActivatedRouteSnapshot) {
        const { provider } = route.params;
        const { client } = route.queryParams;
        return this.store$.select(selectCurrentUserLoaded).pipe(
            filter(loaded => loaded),
            switchMap(() => this.store$.select(selectLocations)),
            filter((locations) => {
                if (locations.length === 0) {
                    this.store$.dispatch(PLLoadAllLocations({ payload: { provider, client } }));
                }
                return locations.length > 0;
            }),
            first(),
        );
    }

}
