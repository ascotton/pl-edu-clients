import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
// RxJs
import { filter, map, first } from 'rxjs/operators';
// NgRx
import { AppStore } from '@app/appstore.model';
import { Store } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';
import { PLFetchSchoolYears, selectSchoolYearsState } from '../store';
// Models
import { PLSchoolYear } from '../interfaces';

@Injectable()
export class SchoolYearsResolver implements Resolve<Dictionary<PLSchoolYear>> {

    constructor(private store$: Store<AppStore>) {}

    resolve() {
        return this.store$.select(selectSchoolYearsState).pipe(
            filter(({ loaded }) => {
                if (!loaded) {
                    this.store$.dispatch((PLFetchSchoolYears()));
                }
                return loaded;
            }),
            map(({ entities }) => entities),
            first(),
        );
    }
}
