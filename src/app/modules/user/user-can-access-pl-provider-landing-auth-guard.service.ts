import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map, filter } from 'rxjs/operators';

import { AppStore } from '@root/src/app/appstore.model';
import { Store } from '@ngrx/store';

import { PLMayService } from '@root/index';

@Injectable()
export class UserCanAccessPLProviderLandingAuthGuardService implements CanActivate {
    constructor(
        private store$: Store<AppStore>,
        private plMay: PLMayService,
    ) { }

    canActivate(): Observable<any> {
        return this.store$.select('currentUser').pipe(
            filter(user => !!user && !!user.uuid),
            map((user) => {
                return this.plMay.canAccessProviderLanding(user);
            }),
            first(),
        );
    }
}
