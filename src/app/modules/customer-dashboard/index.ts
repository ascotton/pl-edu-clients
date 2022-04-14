import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChartsModule } from 'ng2-charts';
import {
    PLDotLoaderModule,
    PLIconModule,
    PLInputModule,
    PLLodashService,
    PLButtonModule,
    PLVaryDisplayModule,
} from '@root/index';

import { PLAccountModule } from '../accounts';

import { PLCustomerDashboardComponent } from './pl-customer-dashboard/pl-customer-dashboard.component';
import { PLClientsSummaryComponent } from './pl-clients-summary/pl-clients-summary.component';
import { PLProvidersSummaryComponent } from './pl-providers-summary/pl-providers-summary.component';
import { PLReportsSummaryComponent } from './pl-reports-summary/pl-reports-summary.component';
import { PLSupportSummaryComponent } from './pl-support-summary/pl-support-summary.component';
import { PLCustomerDashboardService } from './pl-customer-dashboard.service';
import { TooltipModule } from 'ng2-tooltip-directive';
import { PLISAGoToViewButtonComponent } from '../isa/pl-isa-go-to-view-button/pl-isa-go-to-view-button.component';
import { PLISAService } from '../isa/pl-isa.service';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        PLDotLoaderModule,
        TooltipModule,
        PLIconModule,
        PLInputModule,
        PLButtonModule,
        ChartsModule,
        PLVaryDisplayModule,
        PLAccountModule,
    ],
    exports: [
        PLCustomerDashboardComponent,
        PLClientsSummaryComponent,
        PLProvidersSummaryComponent,
        PLReportsSummaryComponent,
        PLSupportSummaryComponent,
        PLISAGoToViewButtonComponent,
    ],
    declarations: [
        PLCustomerDashboardComponent,
        PLClientsSummaryComponent,
        PLProvidersSummaryComponent,
        PLReportsSummaryComponent,
        PLSupportSummaryComponent,
        PLISAGoToViewButtonComponent,
    ],
    providers: [PLLodashService, PLCustomerDashboardService, PLISAService],
})
export class PLCustomerDashboardModule {}
