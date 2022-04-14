import { Injectable } from '@angular/core';
import {
    Data,
    Router,
    RouterEvent,
    NavigationEnd,
    NavigationError,
    NavigationStart,
    NavigationCancel,
    RoutesRecognized,
    ActivatedRoute,
} from '@angular/router';
import { Observable, interval } from 'rxjs';
import { filter, map, distinctUntilChanged, debounce, startWith, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PLNavigationLoaderService {

    constructor(private router: Router, private activatedRoute: ActivatedRoute) { }

    isNavigationPending$: Observable<boolean> = this.router.events.pipe(
        filter((event: RouterEvent) => this.isConsideredEvent(event)),
        map((event: RouterEvent) => this.isNavigationStart(event)),
        debounce(() => interval(500)),
        distinctUntilChanged(),
    );

    fullData(onEnd = false): Observable<Data> {
        return this.router.events.pipe(
            startWith(() => this.getData()),
            filter((event: RouterEvent) => {
                if (onEnd) {
                    return this.isNavigationEnd(event);
                }
                return event instanceof RoutesRecognized;
            }),
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

    private isConsideredEvent(event: RouterEvent): boolean {
        return this.isNavigationStart(event) || this.isNavigationEnd(event);
    }

    private isNavigationStart(event: RouterEvent): boolean {
        return event instanceof NavigationStart;
    }

    private isNavigationEnd(event: RouterEvent): boolean {
        return event instanceof NavigationEnd
            || event instanceof NavigationCancel
            || event instanceof NavigationError;
    }
}
