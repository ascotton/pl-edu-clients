import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
// RxJs
import { Observable } from 'rxjs';
import { first, filter, withLatestFrom, map, switchMap } from 'rxjs/operators';
// NgRx
import { AppStore } from '@root/src/app/appstore.model';
import { Store } from '@ngrx/store';
import { selectSelectedSchoolYearId } from '@common/store';
import {
    selectCurrentLocationId,
    selectLocationScheduleLoaded,
    PLFetchLocationSchedule,
} from '../../store';

@Injectable()
export class LocationSessionsResolver implements Resolve<boolean> {

    constructor(private store$: Store<AppStore>) {}

    resolve(route: ActivatedRouteSnapshot): Observable<boolean> {
        const { id: locationId } = route.parent.params;
        return this.store$.select(selectSelectedSchoolYearId).pipe(
            filter(syCode => !!syCode),
            // Check if SY is already loaded
            switchMap(() => this.store$.select(selectLocationScheduleLoaded)),
            withLatestFrom(this.store$.select(selectCurrentLocationId)),
            filter(([loaded, currentLocationId]) => {
                if (!loaded || currentLocationId !== locationId) {
                    this.store$.dispatch(PLFetchLocationSchedule({ locationId }));
                }
                return loaded;
            }),
            map(([loaded]) => loaded),
            first(),
        );
    }
}
