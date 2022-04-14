import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
// RxJs
import { Observable } from 'rxjs';
import { first, map, filter } from 'rxjs/operators';
// NgRx
import { AppStore } from '@root/src/app/appstore.model';
import { Store } from '@ngrx/store';
// Services
import { PLMayService } from '@root/src/lib-components';

@Injectable()
export class PLLocationSchedulerProviderViewGuard implements CanActivate {
    constructor(
        private plMay: PLMayService,
        private store$: Store<AppStore>,
        private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.store$.select('currentUser').pipe(
            filter(user => !!user && !!user.uuid),
            map((user) => {
                const { providerId } = route.queryParams;
                if (!providerId) {
                    const isProvider = this.plMay.isProvider(user);
                    if (isProvider) {
                        this.router.navigate([state.url], {
                            queryParams: { providerId: user.uuid },
                        });
                    }
                    return !isProvider;
                }
                return true;
            }),
            first(),
        );
    }
}
