import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
// RxJs
import { first } from 'rxjs/operators';
// NgRx
import { AppStore } from '@app/appstore.model';
import { Store } from '@ngrx/store';
import { selectCurrentSchoolYear } from '../store';
// Models
import { PLSchoolYear } from '../interfaces';

@Injectable()
export class CurrentSchoolYearResolver implements Resolve<PLSchoolYear> {
    /*
     * @deprecated Use SchoolYearsResolver instead
     */
    constructor(private store$: Store<AppStore>) {}

    resolve() {
        return this.store$.select(selectCurrentSchoolYear).pipe(
            first(),
        );
    }
}
