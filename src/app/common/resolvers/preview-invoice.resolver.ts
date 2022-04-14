import * as moment from 'moment';
import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
// NgRx Store
import { Store } from '@ngrx/store';
import { AppStore } from '../../appstore.model';
import { selectCurrentUserLoaded } from '../store';
import {
    PLClearInvoicePreview,
    PLFetchInvoicePreview,
    selectInvoicePeriod,
    selectInvoicePreviewLoadState,
} from '../store/invoice';
// RxJs
import { Observable, of } from 'rxjs';
import { filter, first, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { PLMayService } from '@root/index';

@Injectable()
export class PreviewInvoiceResolver implements Resolve<boolean> {

    constructor(private store$: Store<AppStore>, private plMay: PLMayService) { }

    resolve(): Observable<boolean> {
        return this.store$.select(selectCurrentUserLoaded).pipe(
            filter(loaded => loaded),
            withLatestFrom(this.store$.select('currentUser')),
            switchMap(([_, user]) => {
                if (!this.plMay.isProvider(user)) {
                    this.store$.dispatch(PLClearInvoicePreview());
                    return of(false);
                }
                return this.store$.select(selectInvoicePreviewLoadState).pipe(
                    withLatestFrom(this.store$.select(selectInvoicePeriod)),
                    map(([{ loaded, loading }, invoicePeriod]) => {
                        const now = moment();
                        if (!loading && invoicePeriod &&
                            (invoicePeriod.userId !== user.uuid  || !now.isSame(invoicePeriod.lastRefresh, 'd'))) {
                            console.warn('---- Invoice Period does not match user or is not up to date ----');
                            this.store$.dispatch(PLClearInvoicePreview());
                            return { loaded: false, loading: false };
                        }
                        return { loaded, loading };
                    }),
                    filter(({ loaded, loading }) => {
                        if (!loaded && !loading) {
                            // TODO: Source should be based on route?
                            this.store$.dispatch(PLFetchInvoicePreview({ source: 'schedule' }));
                        }
                        return loaded;
                    }),
                    map(({ loaded }) => loaded),
                );
            }),
            first(),
        );
    }
}
