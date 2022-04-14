import { OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// NgRx
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
// RxJs
import { Observable, Subject } from 'rxjs';
import { takeUntil, map, tap, filter, startWith } from 'rxjs/operators';

export abstract class PLClientLoadComponent implements OnInit, OnDestroy {

    constructor(
        protected router: Router,
        protected activatedRoute: ActivatedRoute,
        protected store$: Store<AppStore>,
    ) {}
    protected destroyed$ = new Subject<boolean>();
    protected idChanged$: Observable<string>;

    private lastUUID = '';
    private idParamChange$ = this.activatedRoute.params.pipe(
        map(params => params['id'] || this.getIDfromURL()),
        // filter(id => this.idFilter(id)),
        tap(id => console.log('activatedRoute ID Param', this.constructor.name, id)),
    );

    private client$ = this.store$.select('currentClientUser').pipe(
        filter(clientUser => clientUser.client),
        map(clientUser => clientUser.client.id),
        startWith(this.getIDfromURL()),
        filter(id => this.idFilter(id)), // To Avoid duplicate calls
    );

    private idFilter(id: string) {
        const diff = id !== this.lastUUID;
        if (diff) {
            this.lastUUID = id;
        }
        return diff;
    }

    private getIDfromURL() {
        const url = window.location.href;
        const parts = url.split('/c/client/');
        const end = parts[1].indexOf('/');
        return parts[1].substring(0, end);
    }

    ngOnInit() {
        this.idChanged$ = this.client$.pipe(
            takeUntil(this.destroyed$),
        );
    }

    ngOnDestroy() {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }
}
