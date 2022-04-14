import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map, filter } from 'rxjs/operators';

import { AppStore } from '@root/src/app/appstore.model';
import { Store } from '@ngrx/store';

import { PLMayService } from '@root/index';

@Injectable()
export class UserCanAccessClientReferralManagerAuthGuardService implements CanActivate {
    constructor(
        private store$: Store<AppStore>,
        private plMay: PLMayService,
        private router: Router
    ) { }

    canActivate(): Observable<any> {
        return this.store$.select('currentUser').pipe(
            filter(user => !!user && !!user.uuid),
            map((user) => {
                const mayViewReferralManager = this.plMay.isClinicalAccountManager(user)
                    || this.plMay.isSupport(user)
                    || this.plMay.isSuperuser(user);
                return mayViewReferralManager || this.router.navigate(['client-referrals', 'open']);
            }),
            first(),
        );
    }
}
