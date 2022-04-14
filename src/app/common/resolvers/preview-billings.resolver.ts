import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { Resolve } from '@angular/router';
import { Injectable } from '@angular/core';
import { AppStore } from '../../appstore.model';
import { selectIsW2User, selectCurrentUserLoaded } from '../store/user.selectors';
import { first, exhaustMap, filter } from 'rxjs/operators';
import { PreviewInvoiceResolver } from './preview-invoice.resolver';
import { PreviewTimesheetResolver } from './preview-timesheet.resolver';

@Injectable()
export class PreviewBillingsResolver implements Resolve<boolean> {

    constructor(
        private store$: Store<AppStore>,
        private previewInvoiceResolver: PreviewInvoiceResolver,
        private previewTimesheetResolver: PreviewTimesheetResolver,
    ) { }

    /**
     * Checks if the provider is a W2 and has timesheet flag or not.
     * If W2 and timesheet flag is on; the timesheet resolver is called, otherwise the invoices is called.
     * When the user isn't a W2 the 'isW2' property is undefined; therefore the catch calls the invoices resolver.
     */
    resolve(): Observable<boolean> {
        return this.store$.select(selectCurrentUserLoaded).pipe(
            filter(loaded => loaded),
            exhaustMap(() => this.store$.select(selectIsW2User)),
            exhaustMap(isW2Timesheet => isW2Timesheet ?
                this.previewTimesheetResolver.resolve() :
                this.previewInvoiceResolver.resolve()),
            first(),
        );
    }

}
