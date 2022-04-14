import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';

import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { selectCurrentUserLoaded, selectSelectedSchoolYear } from '@common/store';
import { selectLicensesLoaded, PLFetchLicenses, selectSelectedOrganization } from '../../store';

import { Observable, combineLatest } from 'rxjs';
import { first, exhaustMap, filter, tap } from 'rxjs/operators';

@Injectable()
export class AccountLicensesResolver implements Resolve<boolean> {

    constructor(private store$: Store<AppStore>) { }

    resolve(): Observable<boolean> {
        const dependencies = [
            this.store$.select(selectCurrentUserLoaded),
            this.store$.select(selectSelectedOrganization),
            this.store$.select(selectSelectedSchoolYear), // TODO: Change to SY Loaded
        ];
        return combineLatest(dependencies).pipe(
            filter(([user, sOrg, SY]) => !!(user && sOrg && SY)),
            exhaustMap(() => this.store$.select(selectLicensesLoaded)),
            tap((loaded) => {
                if (!loaded) {
                    this.store$.dispatch(PLFetchLicenses({}));
                }
            }),
            filter(loaded => loaded),
            first(),
        );
    }
}
