import { Injectable } from '@angular/core';
// NgRx
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import {
    selectLoadedUser,
} from '@common/store/user.selectors';
// RxJs
import { Observable, Subject } from 'rxjs';
import { filter, switchMap, takeUntil, startWith, map } from 'rxjs/operators';
import {
    Data,
    Router,
    RouterEvent,
    NavigationEnd,
    ActivatedRoute,
} from '@angular/router';
import { User } from '@modules/user/user.model';

@Injectable({ providedIn: 'root' })
export class PLUserNavigationService {

    currentUser: User;
    protected destroyed$ = new Subject<boolean>();

    constructor(
        private store: Store<AppStore>,
        private router: Router,
        private activatedRoute: ActivatedRoute,
    ) { this.init(); }

    ngOnDestroy() {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    init() {
        this.getCurrentUser()
            .pipe(takeUntil(this.destroyed$))
            .subscribe(u => this.currentUser = u);
    }

    // Create a more generic method for all 
    getNavigationEnd(): Observable<RouterEvent> {
        return this.router.events.pipe(
            filter((event: RouterEvent) => event instanceof NavigationEnd),
        );
    }

    getCurrentUser(): Observable<User> {
        return this.store.pipe(selectLoadedUser);
    }

    /**
     * When navigation ends emits
     * Gets Routes data from root to the deepest child
     * Emits the initial data and waits to navigation end to emit next value
     */
    getFullRouteData(): Observable<Data> {
        const initialValue = this.getData();
        return this.getNavigationEnd().pipe(
            startWith(initialValue),
            map(() => this.getData()),
        );
    }

    private getData(): Data {
        let child = this.activatedRoute.snapshot;
        let data = { };
        while (child) {
            data = { ...data, ...child.data };
            child = child.firstChild;
        }
        return data;
    }
}
