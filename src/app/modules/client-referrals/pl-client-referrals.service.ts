import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AppStore } from '@app/appstore.model';
import { User } from '../user/user.model';

@Injectable()
export class PLClientReferralsService {

    constructor(
        private store: Store<AppStore>,
        private router: Router,
    ) { }

    getTabs(): Observable<any[]> {
        return this.store.select('currentUser').pipe(
            filter(user => !!(user && user.uuid)),
            map((currentUser: User) => {
                let tabs: any[] = [];
                const hrefBase = `/client-referrals/`;
                if (currentUser.xGlobalPermissions.viewOpenReferrals) {
                    tabs = tabs.concat([{ href: `${hrefBase}open`, label: 'Open Referrals' }]);
                }
                if (currentUser.xGlobalPermissions.manageReferrals) {
                    tabs = tabs.concat({ href: `${hrefBase}manager`, label: 'Referral Manager' });
                } else {
                    const currentRoute = this.router.routerState.snapshot.url;
                    if (currentRoute.indexOf(`${hrefBase}manager`) > -1) {
                        // Force to open referrals
                        this.router.navigate([`${hrefBase}open`]);
                    }
                }
                return tabs;
            }),
        );
    }
}
