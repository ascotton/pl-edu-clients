import { Injectable } from '@angular/core';
import * as moment from 'moment';

import { environment } from '@root/src/environments/environment';

@Injectable()
export class PLInactiveService {

    maxInactiveSeconds: number = environment.inactiveReloadMinutes > 0 ? environment.inactiveReloadMinutes * 60 : 60 * 60 * 4;
    localStorageKey: string = 'plInactive';
    lastActiveDatetime: any = null;
    lastSaveTime: any = null;

    constructor() {}

    clearLastActiveDatetime() {
        localStorage.setItem(this.localStorageKey, JSON.stringify({ lastActiveDatetime: '' }));
    }

    setLastActiveDatetime(value: any) {
        this.lastActiveDatetime = value;
        this.saveLastActiveDatetime(value);
    }

    getLastActiveDatetime() {
        // For performance do not read from local storage if already have it in memory.
        if (this.lastActiveDatetime) {
            return this.lastActiveDatetime;
        }
        let data: any;
        try {
            data = localStorage.getItem(this.localStorageKey);
        } catch (e) {
            console.debug('localStorage error in PLInactiveService');
        }
        data = data ? JSON.parse(data) : null;
        let lastActiveDatetime = data ? data.lastActiveDatetime : null;
        if (lastActiveDatetime) {
            lastActiveDatetime = moment(lastActiveDatetime);
        }
        this.lastActiveDatetime = lastActiveDatetime;
        return lastActiveDatetime;
    }

    saveLastActiveDatetime(lastActiveDatetime: any) {
        // For performance, only save every minute.
        if (!this.lastSaveTime || moment().diff(this.lastSaveTime, 'minutes') >= 1) {
            localStorage.setItem(this.localStorageKey, JSON.stringify({ lastActiveDatetime }));
            this.lastSaveTime = moment();
        }
    }

    checkInactiveByDatetime() {
        const now = moment();
        let reset = true;
        const lastActiveDatetime = this.getLastActiveDatetime();
        if (lastActiveDatetime) {
            const diffMinutes = now.diff(lastActiveDatetime, 'minutes');
            if (diffMinutes > (this.maxInactiveSeconds / 60 + 1)) {
                reset = false;
            }
        }
        return {
            reset,
        };
    }
}
