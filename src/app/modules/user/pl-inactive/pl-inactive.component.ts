import {
    Component,
    HostListener,
    NgZone,
    OnDestroy,
    OnInit,
    Renderer2,
} from '@angular/core';
import * as moment from 'moment';
// import { Store } from '@ngrx/store';
// import { AppStore } from '@app/appstore.model';

import { environment } from '@root/src/environments/environment';

import { PLLodashService, PLWindowService } from '@root/index';

import { PLInactiveService } from './pl-inactive.service';

@Component({
    selector: 'pl-inactive',
    templateUrl: './pl-inactive.component.html',
    styleUrls: ['./pl-inactive.component.less'],
})
export class PLInactiveComponent implements OnInit, OnDestroy {
    // currentUser: any;

    maxInactiveSeconds: number = environment.inactiveReloadMinutes > 0 ? environment.inactiveReloadMinutes * 60 : 60 * 60 * 4;
    timeoutTrigger: any = null;
    intervalTrigger: any = null;

    private mouseMoveUnsubscribe: () => void;

    @HostListener('document:keydown', ['$event']) onKeyDown(e: any) {
        this.checkInactive();
    }

    constructor(
        private plWindow: PLWindowService,
        private plInactive: PLInactiveService,
        private lodash: PLLodashService,
        private renderer: Renderer2,
        private zone: NgZone,
    ) {}

    ngOnInit() {
        const FIVE_SECONDS = 5000;

        if (localStorage.getItem('PL_TEST_INACTIVITY_RELOAD')) {
            this.maxInactiveSeconds = 120;
        }

        // Listen to mouseMove events outside the Angular zone and throttle. This
        // reduces app-wide change detection cycles with each move of the mouse.
        // Run throttled callback function inside Angular zone to be consistent with
        // keyDown and reduce potential for subtle bugs in future changes.
        this.zone.runOutsideAngular(() => {
            const callback = this.lodash.throttle(() => this.zone.run(() => this.checkInactive()), FIVE_SECONDS);

            this.mouseMoveUnsubscribe = this.renderer.listen('document', 'mousemove', () => callback());
        });

        this.plInactive.clearLastActiveDatetime();
        this.checkInactive();
    }

    ngOnDestroy() {
        this.mouseMoveUnsubscribe();
    }

    checkInactive() {
        const ret = this.plInactive.checkInactiveByDatetime();
        if (ret.reset) {
            this.resetTimer();
        } else {
            // Immediately close; could already be far too long so do not want to allow user to keep it open.
            this.refresh();
        }
    }

    refresh() {
        this.clearInactive();
        this.clearInterval();
        this.plInactive.clearLastActiveDatetime();
        this.plWindow.location.reload();
    }

    clearInactive() {
        if (this.timeoutTrigger) {
            clearTimeout(this.timeoutTrigger);
        }
    }

    clearInterval() {
        if (this.intervalTrigger) {
            clearInterval(this.intervalTrigger);
        }
    }

    resetTimer() {
        this.plInactive.setLastActiveDatetime(moment());
        this.clearInactive();
        this.timeoutTrigger = setTimeout(() => {
            this.refresh();
        }, this.maxInactiveSeconds * 1000);
    }
}
