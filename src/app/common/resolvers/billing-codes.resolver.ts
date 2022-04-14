import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
// NgRx Store
import { Store } from '@ngrx/store';
import { selectBillingCodes, PLFetchBillingCodes } from '../store/billing';
// RxJs
import { filter, first } from 'rxjs/operators';

@Injectable()
export class BillingCodesResolver implements Resolve<any[]> {
    constructor(private store$: Store<any>) { }
    resolve() {
        return this.store$.select(selectBillingCodes).pipe(
            filter((codes) => {
                if (codes.length === 0) {
                    this.store$.dispatch(PLFetchBillingCodes({}));
                }
                return codes.length > 0;
            }),
            first(),
        );
    }
}
