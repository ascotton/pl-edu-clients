import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
    PLDotLoaderModule,
    PLIconModule,
    PLInputModule,
    PLModalModule,
} from '@root/index';
import { PLFTEHoursModule } from '../fte/fte.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// Services
// Components
import { PLDashboardComponent } from './pl-dashboard/pl-dashboard.component';
import { PLDashboardSSPComponent } from './pl-dashboard-ssp/pl-dashboard-ssp.component';
import { PLPrivatePracticeModalComponent } from './pl-private-practice-modal/pl-private-practice-modal.component';
import { PLOrganizationsService } from '../organizations/pl-organizations.service';
// Directives

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        PLIconModule,
        PLInputModule,
        PLDotLoaderModule,
        PLFTEHoursModule,
        PLModalModule,
    ],
    declarations: [
        PLDashboardComponent,
        PLDashboardSSPComponent,
        PLPrivatePracticeModalComponent,
    ],
    exports: [
        PLDashboardComponent,
        PLDashboardSSPComponent,
        PLPrivatePracticeModalComponent,
    ],
    providers: [
        PLOrganizationsService,
    ],
    entryComponents: [
        PLPrivatePracticeModalComponent,
    ],
})
export class PLDashboardModule { }
