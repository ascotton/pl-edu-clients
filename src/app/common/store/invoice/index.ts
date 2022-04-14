import { NgModule } from '@angular/core';
// NgRx
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { featureKey, reducer } from './invoice.store';
import { InvoiceEffects } from './invoice.effects';
// Services
import { PLInvoiceService } from '@root/src/app/modules/billing/pl-invoice.service';

@NgModule({
    imports: [
        StoreModule.forFeature(featureKey, reducer),
        EffectsModule.forFeature([InvoiceEffects]),
    ],
    providers: [
        PLInvoiceService,
    ],
})
export class PLInvoiceStoreModule { }

export {
    selectInvoicePeriod,
    selectInvoicePeriodLoaded,
    selectInvoicePreview,
    selectInvoicePreviewLoadState,
    PLFetchInvoicePreview,
    PLSetInvoicePreview,
    PLSetInvoicePeriod,
    PLClearInvoicePreview,
} from './invoice.store';
