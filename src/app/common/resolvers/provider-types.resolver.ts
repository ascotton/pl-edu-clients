import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
// RxJs
import { filter, map, first } from 'rxjs/operators';
// NgRx
import { AppStore } from '@root/src/app/appstore.model';
import { Store } from '@ngrx/store';
import { PLFetchProviderTypes, selectProviderTypesState } from '../store';

import { Option } from '@common/interfaces';
import { PLProviderType } from '@modules/schedule/models';

@Injectable()
export class ProviderTypesResolver implements Resolve<PLProviderType[]> {

    constructor(private store$: Store<AppStore>) {}

    resolve() {
        return this.store$.select(selectProviderTypesState).pipe(
            filter(({ loaded, loading }) => {
                if (!loaded && !loading) {
                    this.store$.dispatch(PLFetchProviderTypes());
                }
                return loaded;
            }),
            map(({ value }) => value),
            first(),
        );
    }
}
