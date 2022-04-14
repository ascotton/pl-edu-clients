import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
// NgRx Store
import { Store } from '@ngrx/store';
import { PLFetchInvoicePreview, selectInvoicePeriodLoaded } from '@common/store/invoice';
import { PLFetchTimesheetPreview } from '@common/store/timesheet';
import { selectIsW2User } from '@common/store/user.selectors';
import { PLFetchDocumentationAssistant, selectDocumentationDataLoaded } from '../store/documentation';
// RxJs
import { filter, first, switchMap, withLatestFrom, map } from 'rxjs/operators';
// Models

@Injectable()
export class DocumentationAssistantDataResolver implements Resolve<boolean> {

    constructor(private store$: Store<any>) { }

    resolve(route: ActivatedRouteSnapshot) {
        const { provider } = route.queryParams;
        return this.store$.select(selectInvoicePeriodLoaded).pipe(
            filter(loaded => loaded),
            switchMap(() => this.store$.select(selectDocumentationDataLoaded)),
            withLatestFrom(this.store$.select(selectIsW2User)),
            filter(([loaded, isW2User]) => {
                if (!loaded) {
                    if (isW2User) {
                        this.store$.dispatch(PLFetchTimesheetPreview());
                    } else {
                        this.store$.dispatch(PLFetchInvoicePreview({ source: 'schedule' }));
                    }
                    this.store$.dispatch(PLFetchDocumentationAssistant({ provider }));
                }
                return loaded;
            }),
            map(([loaded]) => loaded),
            first(),
        );
    }
}
