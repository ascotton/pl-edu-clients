import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// PL Components
import {
    PLTabsModule,
    PLIconModule,
    PLTableModule,
    PLModalModule,
    PLInputModule,
    PLButtonModule,
    PLDotLoaderModule,
    PLTableFrameworkModule,
} from '@root/index';
import { PLCommonModule } from '@common/index';
// Routing
import { PLBillingRoutingModule } from './billing.routing.module';
// Module Components
import { PLBillingPreviewContainerComponent } from './preview/pl-billing-preview-container/pl-billing-preview-container.component';
import { PLBillingsComponent } from './pl-billings/pl-billings.component';
import { PLPastBillingsComponent } from './pl-past-billings/pl-past-billings.component';
import { PLBillingPreviewModalComponent } from './preview/pl-billing-preview-modal/pl-billing-preview-modal.component';
import { PLBillingPreviewComponent } from './preview/pl-billing-preview/pl-billing-preview.component';
import { PLBillingPreviewSummaryComponent } from './preview/pl-billing-preview-summary/pl-billing-preview-summary.component';
// Module Services
import { PLTimingPipe } from '../../common/pipes';
import { PLInvoiceService } from './pl-invoice.service';
import { PLTimesheetService } from './pl-timesheet.service';
// Module Stores
import { PLScheduleStoreModule } from '../schedule/store/schedule.store.module';
import { PLAmendmentsComponent } from './pl-amendments/pl-amendments.component';
import { PLBillingTabsComponent } from './pl-billing-tabs/pl-billing-tabs.component';
import { PLNextBillingComponent } from './pl-next-billing/pl-next-billing.component';

@NgModule({
    imports: [
        CommonModule,
        PLTabsModule,
        PLIconModule,
        PLTableModule,
        PLInputModule,
        PLModalModule,
        PLButtonModule,
        PLCommonModule,
        PLDotLoaderModule,
        PLScheduleStoreModule,
        PLTableFrameworkModule,
        PLBillingRoutingModule,
    ],
    declarations: [
        // Components
        PLBillingPreviewContainerComponent,
        PLBillingsComponent,
        PLPastBillingsComponent,
        PLNextBillingComponent,
        PLBillingPreviewComponent,
        PLBillingPreviewModalComponent,
        PLBillingPreviewSummaryComponent,
        PLBillingTabsComponent,
        PLAmendmentsComponent,
    ],
    providers: [
        PLTimingPipe,
        // PLCurrencyPipe,
        PLInvoiceService,
        PLTimesheetService,
    ],
    entryComponents: [
        PLBillingPreviewModalComponent,
    ],
})
export class PLBillingModule { }
