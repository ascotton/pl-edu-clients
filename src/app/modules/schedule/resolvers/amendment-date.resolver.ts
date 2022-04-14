import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
// NgRx Store
import { Store } from '@ngrx/store';
// RxJs
import { of } from 'rxjs';
import { filter, switchMap, first, withLatestFrom } from 'rxjs/operators';

import { PLHttpService } from '@root/index';
import { selectCurrentUserLoaded, selectCurrentUser } from '@common/store';

@Injectable()
export class AmendmentDateResolver implements Resolve<any> {

    constructor(private store$: Store<any>, private plHttp: PLHttpService) { }

    resolve() {
        return this.store$.select(selectCurrentUserLoaded).pipe(
            filter(loaded => loaded),
            withLatestFrom(this.store$.select(selectCurrentUser)),
            switchMap(([_, user]) => {
                if (user.xEnabledFeatures && user.xEnabledFeatures.includes('amendments')) {
                    return this.plHttp.get('dateState');
                }
                return of(null);
            }),
            first(),
        );
    }
}
