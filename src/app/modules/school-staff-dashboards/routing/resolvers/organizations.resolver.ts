import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';

import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { selectCurrentUserLoaded } from '@common/store';
import { selectOrganizationsLoaded, PLFetchOrganizations } from '../../store';

import { Observable } from 'rxjs';
import { first, exhaustMap, filter, tap } from 'rxjs/operators';

@Injectable()
export class OrganizationsResolver implements Resolve<boolean> {

    constructor(private store$: Store<AppStore>) { }

    resolve(): Observable<boolean> {
        return this.store$.select(selectCurrentUserLoaded).pipe(
            filter(loaded => loaded),
            exhaustMap(() => this.store$.select(selectOrganizationsLoaded)),
            tap((loaded) => {
                if (!loaded) {
                    this.store$.dispatch(PLFetchOrganizations());
                }
            }),
            filter(loaded => loaded),
            first(),
        );
    }

}
