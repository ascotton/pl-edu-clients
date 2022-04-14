import { Injectable } from '@angular/core';
// NgRx Store
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import {
    selectSelectedSchoolYear,
} from '@common/store';
import {
    selectSelectedOrganization,
} from '../store/feature.selectors';
// RxJs
import { Observable, combineLatest } from 'rxjs';
import { withLatestFrom, map, filter } from 'rxjs/operators';
// Models
import { PLSchoolYear } from '@common/interfaces';
import { PLOrganization } from '../models';

@Injectable()
export class PLPlatformHelperService {

    SY$ = this.store$.select(selectSelectedSchoolYear)
        .pipe(filter(sy => !!(sy && sy.id)));
    organization$ = this.store$.select(selectSelectedOrganization)
        .pipe(filter(org => !!(org && org.id)));

    constructor(private store$: Store<AppStore>) { }

    reFetch(): Observable<{ schoolYear: PLSchoolYear, organization: PLOrganization }> {
        return combineLatest([this.SY$, this.organization$]).pipe(
            withLatestFrom(this.SY$, this.organization$),
            map(([_, schoolYear, organization]) => ({ schoolYear, organization })),
        );
    }
}
