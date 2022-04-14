import { Injectable, NgZone } from '@angular/core';
import { PLJWTDecoder, PLLodashService } from '@root/index';
import { CurrentUserService } from './current-user.service';

import { environment } from '@root/src/environments/environment';

@Injectable()
export class InactivityLogoutService {
    FIVE_SECONDS = 5000;
    ONE_MINUTE = 60000;
    beforeExpTimer: any;
    afterExpTimer: any;
    currentUserModel: any;
    lastMinuteTimerOn = false;
    lastActiveTimestamp: any;

    tokenDurationSecs: number;
    tokenDurationMillis: number;
    tokenDurationMins: number;

    mouseListener: any;
    keyPressListener: any;

    // NOTE - renderer must be set by an external component, and is an instance of Renderer2.
    // Only components can inject Renderer2. Currently, it is being set by app.component.ts
    renderer: any;

    constructor(
        private lodash: PLLodashService,
        private currentUserService: CurrentUserService,
        private zone: NgZone,
    ) {
        this.lastActiveTimestamp = Date.now();
    }

    //  Pull, parse, & decode jwt. Determine number of minutes until expiration
    setTokenDuration() {
        const jwtPayloadDecoded = new PLJWTDecoder(this.currentUserService.jwt);

        this.tokenDurationSecs = Math.max(jwtPayloadDecoded.expirationTime - jwtPayloadDecoded.issuedAtTime, 60);
        this.tokenDurationMillis = this.tokenDurationSecs * 1000;
        this.tokenDurationMins = Math.floor(this.tokenDurationSecs / 60);

        if (environment.inactiveMinutes !== undefined && environment.inactiveMinutes > 0) {
            this.tokenDurationMins = environment.inactiveMinutes;
            this.tokenDurationMillis = this.tokenDurationMins * 60 * 1000;
        }
        if (localStorage.getItem('PL_TEST_INACTIVITY_LOGOUT')) {
            this.tokenDurationMins = 2;
            this.tokenDurationMillis = this.tokenDurationMins * 60 * 1000;
        }
    }

    // Update lastActive.
    // If active in final minute before logout, immediately get new jwt
    private updateLastActiveTimestamp() {
        this.lastActiveTimestamp = Date.now();

        if (this.lastMinuteTimerOn) {
            this.lastMinuteTimerOn = false;
            this.currentUserService.checkAndLogin(0).subscribe(() => {
                this.start();
            });
        }
    }

    // Listen on keyboard and mouse movements and trigger update to active
    // timestamp. Listening to these events outside of the Angular zone
    // prevents unnecessary and frequent change detection across the app:
    // https://blog.thoughtram.io/angular/2017/02/21/using-zones-in-angular-for-better-performance.html
    setupActivityListeners() {
        // Run the throttled portion of the callback in Angular zone for
        // regular change detection
        const activityCallback = this.lodash.throttle(
            () => this.zone.run(() => this.updateLastActiveTimestamp()),
            this.FIVE_SECONDS,
        );

        this.zone.runOutsideAngular(() => {
            if (!this.mouseListener)  {
                this.mouseListener = this.renderer.listen('document', 'mousemove', activityCallback);
            }
            if (!this.keyPressListener)  {
                this.keyPressListener = this.renderer.listen('document', 'keypress', activityCallback);
            }
        });
    }

    /// Before Expired ///
    stopBeforeExpTimer() {
        clearInterval(this.beforeExpTimer);
    }

    startBeforeExpTimer() {
        this.stopBeforeExpTimer();

        this.beforeExpTimer = setInterval(
            () => {
                const lastActiveMins = Math.floor(((Date.now() - this.lastActiveTimestamp) / 1000) / 60);

                if (lastActiveMins < this.tokenDurationMins - 1) {
                    this.currentUserService.checkAndLogin(lastActiveMins).subscribe(() => {
                        this.start();
                    });
                } else { // only 1 minute left
                    this.lastMinuteTimerOn = true;
                }

            },
            this.tokenDurationMillis - this.ONE_MINUTE,
        );
    }

    /// After expired ///
    stopAfterExpTimer() {
        clearInterval(this.afterExpTimer);
    }

    startAfterExpTimer() {
        this.stopAfterExpTimer();
        this.afterExpTimer = setInterval(
            () => {
                this.currentUserService.logout();
            },
            this.tokenDurationMillis + this.FIVE_SECONDS,
        );
    }

    // MAIN FUNCTION. Use inactivityLogoutService.start() to inject autologout into your app
    start() {
        this.setTokenDuration();
        this.setupActivityListeners();
        this.startBeforeExpTimer();
        this.startAfterExpTimer();
    }
}
