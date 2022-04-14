import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
// RxJs
import { switchMap, filter, first, map, withLatestFrom } from 'rxjs/operators';
// NgRx
import { AppStore } from '@root/src/app/appstore.model';
import { Store } from '@ngrx/store';
import { selectSelectedSchoolYearId, selectCurrentUserLoaded } from '@common/store';
import {
    selectLocationAvailabilityState,
    selectCurrentLocationId,
    PLFetchLocationAvailability,
} from '../../store';

@Injectable()
export class LocationAvailabilityResolver implements Resolve<boolean> {

    constructor(private store$: Store<AppStore>) {}

    resolve(route: ActivatedRouteSnapshot) {
        const { id: locationId } = route.parent.params;
        return this.store$.select(selectCurrentUserLoaded).pipe(
            filter(loaded => loaded), 
            switchMap(() => this.store$.select(selectSelectedSchoolYearId)),
            filter((syCode: string) => !!syCode),
            switchMap(() => this.store$.select(selectLocationAvailabilityState)),
            withLatestFrom(this.store$.select(selectCurrentLocationId)),
            filter(([{ loaded, loading }, locId]) => {
                // TODO: For now always load later use store in Location Availability
                if (!loading || locId !== locationId) {
                    this.store$.dispatch(PLFetchLocationAvailability({ locationId }));
                }
                return loaded;
            }),
            map(([{ loaded }]) => loaded),
            first(),
        );
    }
}
