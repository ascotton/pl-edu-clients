import { Injectable } from '@angular/core';

import * as moment from 'moment';

@Injectable()
export class PLExpirationService {
    setTimeout(callback: any, expirationDate: Date): number {
        const delay = this.delayFromNow(expirationDate);

        // Use window to disambiguate browser vs nodejs equivalents.
        // https://github.com/Microsoft/TypeScript/issues/842
        return window.setTimeout(callback, delay);
    }

    private delayFromNow(expirationDate: Date): number {
        const expiration = expirationDate.valueOf();
        const now = (new Date()).valueOf();

        return Math.max(0, expiration - now); // 0 if has already expired
    }
}
