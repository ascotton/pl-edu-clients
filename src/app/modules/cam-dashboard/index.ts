import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChartsModule } from 'ng2-charts';

import { PLCommonModule } from  '@common/index';

import {
    PLDotLoaderModule,
    PLTabsModule,
    PLIconModule,
    PLTableFrameworkModule,
} from '@root/index';

import { PLCamAccountDetailsComponent } from './pl-cam-account-details/pl-cam-account-details.component';
import { PLCamAccountNumbersComponent } from './pl-cam-account-numbers/pl-cam-account-numbers.component';
import { PLCamAccountsComponent } from './pl-cam-accounts/pl-cam-accounts.component';
import { PLCamDashboardComponent } from './pl-cam-dashboard/pl-cam-dashboard.component';
import { PLCamDashboardTabsService } from './pl-cam-dashboard-tabs.service';
import { PLCamServiceDetailsComponent } from './pl-cam-service-details/pl-cam-service-details.component';
import { PLCamLocationsSchedulingStatusComponent } from './pl-cam-locations-scheduling-status/pl-cam-locations-scheduling-status.component';

export { PLCamDashboardTabsService };

@NgModule({
    imports: [
        CommonModule,
        ChartsModule,
        PLCommonModule,
        PLDotLoaderModule,
        PLIconModule,
        PLTabsModule,
        PLTableFrameworkModule,
        RouterModule,
    ],
    exports: [PLCamDashboardComponent],
    declarations: [
        PLCamAccountsComponent,
        PLCamAccountDetailsComponent,
        PLCamAccountNumbersComponent,
        PLCamDashboardComponent,
        PLCamServiceDetailsComponent,
        PLCamLocationsSchedulingStatusComponent,
    ],
    providers: [],
})
export class PLCamDashboardModule {}
