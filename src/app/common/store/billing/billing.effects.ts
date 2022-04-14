import { Injectable } from '@angular/core';
// NgRx
import { Actions, ofType, createEffect } from '@ngrx/effects';
// RxJs
import { of } from 'rxjs';
import { concatMap, catchError, map } from 'rxjs/operators';
// Actions
import {
    PLFetchBillingCodes,
    PLSetBillingCodes,
    PLFetchNotesSchemes,
    PLSetNotesSchemes,
} from './billing.store';
// Services
import { PLBillingCodesService } from '@app/modules/schedule/services';

@Injectable()
export class BillingEffects {

    fetchBillingCodes$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLFetchBillingCodes),
            concatMap(({ client }) => this.billingService.get(true, client).pipe(
                map(({ results: codes }) => PLSetBillingCodes({ codes })),
                // TODO: catchError(() => of(PLLoadBillingCodesFail({}))),
            )),
        ));

    fetchNotesSchemes$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLFetchNotesSchemes),
            concatMap(() => this.billingService.getNotesSchemas().pipe(
                map(({ results: schemes }) => PLSetNotesSchemes({ schemes })),
                // TODO: catchError(() => of(PLLoadNotesSchemasFail({}))),
            )),
        ));

    constructor(
        private actions$: Actions,
        private billingService: PLBillingCodesService,
    ) { }
}
