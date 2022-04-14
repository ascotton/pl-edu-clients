import { Injectable } from '@angular/core';
// Material
import { MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
// RxJs
import { BehaviorSubject, Observable } from 'rxjs';
import { map, delay, shareReplay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PLDesignService {

    private _enabled$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private _sideNav$: BehaviorSubject<MatSidenav> = new BehaviorSubject(null);
    private _sideNavOpened$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    get enabled$() {
        return this._enabled$.asObservable()
            .pipe(shareReplay());
    }

    get sideNav$() {
        return this._sideNav$.asObservable()
            .pipe(
                delay(0),
                shareReplay(),
            );
    }

    get sideNavOpened$() {
        return this._sideNavOpened$.asObservable()
            .pipe(shareReplay());
    }

    components = {
        formField: {
            appearance: 'fill',
            floatLabel: 'always',
            hideRequiredMarker: false,
        },
        paginator: {
            sizeOptions: [5, 10, 25, 50, 100],
        },
        datepicker: {
            startView: 'month',
        },
    };

    formats: {
        date: 'M/dd/yyyy',
    };

    settings = {
        paginator: {
            size: 25,
        },
    };

    smallScreen$ = this.breakpointObserver.observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
    ]).pipe(
        map(({ matches }) => matches),
        shareReplay(),
    );

    responsive$: Observable<{
        isHandset: boolean;
        header: { height: number; };
        sideNav: { mode: string; role: string;  }
    }> = this.smallScreen$.pipe(
        map(isHandset => ({
            isHandset,
            header: {
                height: this._enabled$.value ? isHandset ? 56 : 64 : 46,
                logo: { },
            },
            sideNav: isHandset ?
            { mode: 'over', role: 'dialog' } :
            { mode: 'side', role: 'navigation' },
        })),
    );

    constructor(private breakpointObserver: BreakpointObserver) {
        const userSettings = localStorage.getItem('pl_user_settings');
        if (userSettings) {
            this.settings = {
                ...this.settings,
                ...JSON.parse(userSettings),
            };
        }
        this.smallScreen$.subscribe(smallScreen =>
            this._sideNavOpened$.next(!smallScreen));
    }

    enable() { this._enabled$.next(true); }

    disable() { this._enabled$.next(false); }

    setSideNav(sideNav: MatSidenav) {
        this._sideNav$.next(sideNav);
        if (sideNav) {
            sideNav.openedChange.subscribe(() =>
                this._sideNavOpened$.next(sideNav.opened));
        }
    }

    setTablePageSize(size: number) {
        if (this.settings.paginator.size === size) {
            return;
        }
        this.settings.paginator.size = size;
        this.saveSettings();
    }

    saveSettings() {
        localStorage.setItem('pl_user_settings', JSON.stringify(this.settings));
    }
}
