import { NgModule } from '@angular/core';
// NgRx
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { featureKey, reducer } from './billing.store';
import { BillingEffects } from './billing.effects';
// Services
import { PLBillingCodesService } from '@app/modules/schedule/services';

@NgModule({ 
    imports: [
        StoreModule.forFeature(featureKey, reducer),
        EffectsModule.forFeature([ BillingEffects ]),
    ],
    providers: [
        PLBillingCodesService,
    ],
})
export class PLBillingStoreModule { }

export {
    selectBillingCodes,
    selectBillingCodeInfo,
    selectBillingCodesEntities,
    selectBillingCodesCanProvide,
    selectNotesSchemeEntities,
    selectNotesScheme,
    PLFetchBillingCodes,
    PLSetBillingCodes,
    PLFetchNotesSchemes,
    PLSetNotesSchemes,
} from './billing.store';
