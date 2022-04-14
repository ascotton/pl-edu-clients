import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';

import { Subject } from 'rxjs';
import { first, map, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { fadeAnimation } from '@app/animations';
// Common
import {
    PLUtilService,
    PLNavigationLoaderService,
    PLComponentStateInterface,
} from '@common/services';

import { PLLocationService } from '../pl-location.service';
import { PLAddRecentLocation } from '@modules/search/store/search.store';
import { PLSubNavigationTabs } from '@common/interfaces/pl-sub-navigation-tabs';

@Component({
    selector: 'pl-location',
    templateUrl: './pl-location.component.html',
    styleUrls: ['./pl-location.component.less'],
    animations: [
        fadeAnimation,
        trigger(
            'enterAnimation', [
                transition(':enter', [
                    style({ height: '100%', opacity: 0 }),
                    animate('600ms', style({ height: '100%', opacity: 1 })),
                ]),
            ],
        ),
    ],
})
export class PLLocationComponent implements OnInit, OnDestroy {
    state: PLComponentStateInterface;
    classname = 'PLLocationComponent';
    location: any = {};
    tabs: PLSubNavigationTabs[] = [];
    mayViewPhi = false;
    mayViewPii = false;
    mayViewLocation = false;
    allLoaded = false;
    permissionCode: number;
    private destroyed$ = new Subject<boolean>();

    transition$ = this.navigationLoader.isNavigationPending$.pipe(
        map(loading => loading ? 'out' : 'in'),
    );

    constructor(
        public util: PLUtilService,
        private store$: Store<any>,
        private plLocation: PLLocationService,
        private activatedRoute: ActivatedRoute,
        private navigationLoader: PLNavigationLoaderService,
    ) {}

    ngOnInit() {
        this.state = this.util.initComponent({
            name: this.classname,
            fn: (state, done) => {
                state.fullScreenRoute = false;
                state.renderToggle = { toggle: true };
                const routeIdHelper = this.activatedRoute.params.pipe(
                    map(({ id }) =>id),
                    takeUntil(this.destroyed$),
                );

                routeIdHelper.subscribe((locationId: string) => {
                    // TODO: Add an spinner here
                    this.plLocation
                        .getLocation(locationId)
                        .pipe(first())
                        .subscribe(
                            (res: any) => {
                                this.location = { ...res.location };
                                this.store$.dispatch(PLAddRecentLocation({ location: this.location }));
                                this.mayViewLocation = res.mayViewLocation;
                                this.mayViewPhi = res.mayViewPhi;
                                this.mayViewPii = res.mayViewPii;
                                this.tabs = this.plLocation.getTabs(state.currentUser);
                                this.allLoaded = true;
                                done();
                            },
                            (err: any) => {
                                this.permissionCode = err.permissionCode;
                                this.allLoaded = true;
                                done();
                            },
                        );
                });
            },
        });
    }

    ngOnDestroy() {
        this.util.destroyComponent(this.state);
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }
}
