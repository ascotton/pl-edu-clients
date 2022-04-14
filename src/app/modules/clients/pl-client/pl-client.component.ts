import { Component, OnInit, OnDestroy } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { PLUtilService, PLComponentStateInterface } from '@common/services';
import { PLClientService } from '../pl-client.service';

import { AppStore } from '@app/appstore.model';
import { PLSubNavigationTabs } from '@root/src/app/common/interfaces/pl-sub-navigation-tabs';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'pl-client',
    templateUrl: './pl-client.component.html',
    styleUrls: ['./pl-client.component.less'],
    animations: [
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
export class PLClientComponent implements OnInit, OnDestroy {
    client: any = {};
    mayViewPhi = false;
    mayViewClient = false;
    permissionCode: number;
    tabs: PLSubNavigationTabs[] = [];

    private destroyed$ = new Subject<boolean>();
    private subscriptions: any = {};
    private classname = 'PLClientComponent';
    public _state: PLComponentStateInterface;

    constructor(
        public router: Router,
        public util: PLUtilService,
        private store: Store<AppStore>,
        private plClient: PLClientService,
        public activatedRoute: ActivatedRoute,
    ) { }

    ngOnInit() {
        this._state = this.util.initComponent({
            name: this.classname,
            fn: (state: PLComponentStateInterface, done) => {
                state.renderToggle = { toggle: true };
                const routeIdHelper = this.activatedRoute.params.pipe(
                    map(({ id }) =>id),
                    takeUntil(this.destroyed$),
                );
                routeIdHelper.subscribe((clientId: any) => {
                    this.plClient.getClient(true, clientId).subscribe(() => {
                        this.subscriptions.client = this.store.select('currentClientUser').subscribe((clientUser: any) => {
                            if (clientUser && clientUser.client) {
                                this.client = clientUser.client;
                                this.mayViewClient = clientUser.mayViewClient;
                                this.mayViewPhi = clientUser.mayViewPhi;
                                this.tabs = this.plClient.getTabs();
                            } else if (clientUser && clientUser.permissionCode) {
                                this.permissionCode = clientUser.permissionCode;
                            }
                            done();
                        });
                    });
                });
            },
        });

    }

    ngOnDestroy() {
        this.subscriptions.client && this.subscriptions.client.unsubscribe();
        this.subscriptions.user && this.subscriptions.user.unsubscribe();
        this.plClient.destroy();
        this.util.destroyComponent(this._state);
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }
}
