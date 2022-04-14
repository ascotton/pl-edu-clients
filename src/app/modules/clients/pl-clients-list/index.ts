import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import {
    PLTabsModule,
    PLIconModule,
    PLInputModule,
    PLTableModule,
    PLButtonModule,
    PLDotLoaderModule,
    PLVaryDisplayModule,
    PLTableFrameworkModule,
    PLModalModule,
} from "@root/index";

import { PLCommonModule } from "@common/index";

import { PLClientsListComponent } from "./pl-clients-list.component";
import { PLAllClientsComponent } from "./pl-all-clients/pl-all-clients.component";
import { PLCaseloadClientsComponent } from "./pl-caseload-clients/pl-caseload-clients.component";
import { PLClientsListService } from "./pl-clients-list.service";
import { PlISADashboardViewGuard } from "../../isa/pl-isa-dashboard-view.guard";
@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        PLIconModule,
        PLTabsModule,
        PLTableModule,
        PLInputModule,
        PLCommonModule,
        PLButtonModule,
        PLDotLoaderModule,
        PLVaryDisplayModule,
        PLTableFrameworkModule,
        PLModalModule,
    ],
    exports: [
        // PLISATableComponent,
        PLAllClientsComponent,
        // PLISAHandlingComponent,
        PLClientsListComponent,
        // PLISADashboardComponent,
        PLCaseloadClientsComponent,
    ],
    declarations: [
        // PLISATableComponent,
        PLAllClientsComponent,
        // PLISAHandlingComponent,
        PLClientsListComponent,
        // PLISADashboardComponent,
        PLCaseloadClientsComponent,
    ],
    entryComponents: [
        // PLISAHandlingComponent
    ],
    providers: [
        PLClientsListService,
        PlISADashboardViewGuard,
    ],
})
export class PLClientsListModule {}
