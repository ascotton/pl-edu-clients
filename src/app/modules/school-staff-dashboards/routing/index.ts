import { NgModule }     from '@angular/core';
import { RouterModule } from '@angular/router';
import { PLLayoutComponent } from '../components/pl-layout/pl-layout.component';
// Components
import { PLDistrictAdminLayoutComponent } from '../district-admin-layout/district-admin-layout.component';
import { PLTrainingDevelopmentComponent } from '../training-development/training-development.component';
import { PLPlatformDashboardComponent } from '../platform-dashboard/platform-dashboard.component';
import { UserManagementComponent } from '../user-management/user-management.component';
import { PLUsageReportsComponent } from '../usage-reports/usage-reports.component';
import { PLAddPlatformUserComponent } from '../pl-add-platform-user/pl-add-platform-user.component';
import { UserAuthGuardService } from '../../user/user-auth-guard.service';
import { PLDashboardSSPComponent } from '../../dashboard/pl-dashboard-ssp/pl-dashboard-ssp.component';
// Resolvers
import {
    CurrentUserResolver,
    UserAssigmentsResolver,
    CurrentSchoolYearResolver,
    SchoolYearsResolver,
} from '@common/resolvers';
import { CanDeactivateGuard } from '@common/can-deactivate-guard.service';
import { OrganizationLoadedResolver, OrganizationsResolver, AccountLicensesResolver } from './resolvers';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                data: { fullWidth: true },
                // TODO: Move to app.module
                component: PLLayoutComponent,
                resolve: {
                    currentUser: CurrentUserResolver,
                    organizations: OrganizationsResolver,
                    organization: OrganizationLoadedResolver,
                    userAssigments: UserAssigmentsResolver,
                    shoolYears: SchoolYearsResolver,
                },
                children: [
                    {
                        path: '',
                        canActivate: [UserAuthGuardService],
                        component: PLDistrictAdminLayoutComponent,
                        children: [
                            {
                                path: '',
                                pathMatch: 'full',
                                redirectTo: 'dashboard-platform' ,
                            },
                            {
                                path: 'user-management',
                                component: UserManagementComponent,
                                data: { title: 'User Management' },
                                resolve: {
                                    SY: CurrentSchoolYearResolver,
                                },
                            },
                            {
                                path: 'add-user',
                                component: PLAddPlatformUserComponent,
                                canDeactivate: [CanDeactivateGuard],
                                data: { title: 'Add User' },
                            },
                            {
                                path: 'dashboard-platform',
                                component: PLPlatformDashboardComponent,
                                data: { title: 'Platform Dashboard' },
                                resolve: {
                                    licensesLoaded: AccountLicensesResolver,
                                },
                            },
                            {
                                path: 'dashboard-user',
                                component: PLDashboardSSPComponent,
                                data: {
                                    title: 'Provider Dashboard',
                                    hideSchoolYear: true,
                                },
                            },
                            {
                                path: 'reports-usage',
                                component: PLUsageReportsComponent,
                                data: { title: 'Usage Reports' },
                                resolve: {
                                    SY: CurrentSchoolYearResolver,
                                },
                            },
                            {
                                path: 'training',
                                component: PLTrainingDevelopmentComponent,
                                data: {
                                    title: 'Training & Development',
                                },
                            },
                        ],
                    },
                ]
            },
        ]),
    ],
    exports: [
        RouterModule,
    ],
    providers: [
        OrganizationLoadedResolver,
        OrganizationsResolver,
        AccountLicensesResolver,
        CurrentSchoolYearResolver,
        UserAssigmentsResolver,
        CanDeactivateGuard,
    ],
})
export class PLSchoolStaffDashboardsRoutingModule {}
