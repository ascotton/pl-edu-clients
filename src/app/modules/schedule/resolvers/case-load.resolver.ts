import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
// NgRx Store
import { Store } from '@ngrx/store';
import { selectCurrentUserLoaded } from '@common/store';
import { selectClientsLoaded, selectCaseload, PLLoadAllCaseload } from '../store/clients';
// RxJs
import { filter, first, concatMap, switchMap } from 'rxjs/operators';
// Models
import { PLClient } from '../models';

@Injectable()
export class CaseloadResolver implements Resolve<PLClient[]> {

    constructor(private store$: Store<any>) { }

    resolve(route: ActivatedRouteSnapshot) {
        const { provider: payload } = route.params;
        return this.store$.select(selectCurrentUserLoaded).pipe(
            filter(loaded => loaded),
            concatMap(() => this.store$.select(selectClientsLoaded)),
            filter((loaded) => {
                if (!loaded) {
                    this.store$.dispatch(PLLoadAllCaseload({ payload }));
                }
                return loaded;
            }),
            switchMap(() => this.store$.select(selectCaseload)),
            first(),
        );
    }
}
