import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PLCommonModule } from '@common/index';
// Routing
import { PLSchoolStaffDashboardsRoutingModule } from './routing';
// Material resources specific for this POC
import { PLDashboardModule } from '../dashboard';
import { PLSchoolStaffDashboardsMaterialModule } from './school-staff-dashboards-material.module';
import {
    PLIconModule,
    PLDotLoaderModule,
    PLVaryDisplayModule,
    PLInputModule,
} from '@root/index';
// Services
import {
    PLSchoolStaffService,
    PLPlatformUsersService,
    PLBulkUploadService,
    PLEditableTableBuilder,
    PLPlatformHelperService,
} from './services';
// Components
import { PLDistrictAdminLayoutComponent } from './district-admin-layout/district-admin-layout.component';
import { PLUsageReportsComponent } from './usage-reports/usage-reports.component';
import { PLTrainingDevelopmentComponent } from './training-development/training-development.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { DashboardTableComponent } from './dashboard-table/dashboard-table.component';
import {
    PLPlatformDashboardComponent,
    PLPlatformLicensesComponent,
} from './platform-dashboard';
import {
    PLAddPlatformUserComponent,
    PLBulkPlatformUserComponent,
    PLUserFormComponent,
    PLUploadSummaryComponent,
    PLLicensesHelperComponent,
} from './pl-add-platform-user';
// Reusable Components
import { PLPlatformUserActivityComponent } from './platform-user-activity/platform-user-activity.component';
import { PLTrainingGraphsComponent } from './training-graphs/training-graphs.component';
import { PLEditableTableComponentV2 } from './pl-editable-table/pl-editable-table.component';
// Common Components
import { PLLayoutComponent } from './components/pl-layout/pl-layout.component';
import {
    PLHeaderComponent,
    PLMenuListComponent,
    PLSidenavComponent,
} from './components';
import { PLPlatformAdminStoreModule } from './store';
// Directives

@NgModule({
    declarations: [
        PLUserFormComponent,
        UserManagementComponent,
        DashboardTableComponent,
        PLTrainingDevelopmentComponent,
        PLPlatformDashboardComponent,
        PLPlatformLicensesComponent,
        PLDistrictAdminLayoutComponent,
        PLUsageReportsComponent,
        PLPlatformUserActivityComponent,
        PLTrainingGraphsComponent,
        PLEditableTableComponentV2,
        PLAddPlatformUserComponent,
        PLBulkPlatformUserComponent,
        PLLicensesHelperComponent,
        PLUploadSummaryComponent,
        // Common
        PLLayoutComponent,
        PLMenuListComponent,
        PLSidenavComponent,
        PLHeaderComponent,
    ],
    imports: [
        PLCommonModule,
        PLInputModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        PLIconModule,
        PLDotLoaderModule,
        PLVaryDisplayModule,
        PLPlatformAdminStoreModule,
        PLSchoolStaffDashboardsRoutingModule,
        PLSchoolStaffDashboardsMaterialModule,
        // TODO: ???
        PLDashboardModule,
    ],
    providers: [
        PLSchoolStaffService,
        PLPlatformUsersService,
        PLBulkUploadService,
        PLEditableTableBuilder,
        PLPlatformHelperService,
    ],
    entryComponents: [
        PLUploadSummaryComponent,
    ],
})
export class PLSchoolStaffDashboardsModule { }
