import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { UserAuthGuardService } from './modules/user/user-auth-guard.service';
import { UserCanAccessPLProviderLandingAuthGuardService } from './modules/user/user-can-access-pl-provider-landing-auth-guard.service';
import { UserCanAccessSSPProviderLandingAuthGuardService } from './modules/user/user-can-access-ssp-provider-landing-auth-guard.service';
import { UserCanAccessClientReferralManagerAuthGuardService } from './modules/user/user-can-access-client-referral-manager-auth-guard.service';

import { CanDeactivateGuard } from '@common/can-deactivate-guard.service';

import { PageNotFoundComponent } from './modules/page-not-found/page-not-found.component';
import { plLogoutComponent } from './modules/user/pl-logout/pl-logout.component';
import { PLLiveagentPrechatPageComponent } from './modules/pl-liveagent-pages/pl-liveagent-prechat-page/pl-liveagent-prechat-page.component';
import { PLLiveagentPostchatPageComponent } from './modules/pl-liveagent-pages/pl-liveagent-postchat-page/pl-liveagent-postchat-page.component';

import { PLHomeComponent } from './modules/home/pl-home/pl-home.component';

import { PLDashboardComponent } from './modules/dashboard/pl-dashboard/pl-dashboard.component';

import { PLFormAssemblyPageComponent } from
    './modules/pl-third-party-pages/pl-form-assembly-page/pl-form-assembly-page.component';

import { PLCoassembleLauncherComponent } from './modules/dashboard/pl-coassemble-launcher/pl-coassemble-launcher.component';
import { PLAssignmentPreferencesComponent } from
    './modules/assignment-preferences/pl-assignment-preferences/pl-assignment-preferences.component';
import { PLIntentToReturnComponent } from './modules/assignment-preferences/pl-intent-to-return/pl-intent-to-return.component';

import { PLUsersComponent } from './modules/users/pl-users/pl-users.component';

import { PLCamDashboardComponent } from './modules/cam-dashboard/pl-cam-dashboard/pl-cam-dashboard.component';
import { PLCamDashboardCurrentUserResolverService } from './modules/cam-dashboard/pl-cam-dashboard/pl-cam-dashboard-current-user-resolver.service';
import { PLCamLocationsSchedulingStatusComponent } from './modules/cam-dashboard/pl-cam-locations-scheduling-status/pl-cam-locations-scheduling-status.component';

import { PLCustomerDashboardComponent } from './modules/customer-dashboard/pl-customer-dashboard/pl-customer-dashboard.component';

import { PLClientMergePermissionsService } from './modules/client-merge/pl-client-merge-permissions.service';

import { PLClientReferralsComponent } from './modules/client-referrals/pl-client-referrals/pl-client-referrals.component';
import { PLClientReferralManagerComponent } from './modules/client-referrals/pl-client-referral-manager/pl-client-referral-manager.component';
import { PLClientReferralOpenComponent } from './modules/client-referrals/pl-client-referral-open/pl-client-referral-open.component';

import { PLClientReferralSaveComponent } from './modules/client-referral-save/pl-client-referral-save/pl-client-referral-save.component';

import { PLServiceSaveComponent } from './modules/service-save/pl-service-save/pl-service-save.component';
import { PLServiceSaveAssignComponent } from './modules/service-save/pl-service-save-assign/pl-service-save-assign.component';
import { PLServiceSaveClientDetailsComponent } from './modules/service-save/pl-service-save-client-details/pl-service-save-client-details.component';
import { PLServiceSaveIdentifyComponent } from './modules/service-save/pl-service-save-identify/pl-service-save-identify.component';
import { PLServiceSaveDocumentationComponent } from './modules/service-save/pl-service-save-documentation/pl-service-save-documentation.component';
import { PLServiceSaveServiceDetailsComponent } from './modules/service-save/pl-service-save-service-details/pl-service-save-service-details.component';

import { PLFeatureFlagRouterService } from './common/services/pl-feature-flag-router.service';

import { PLProviderPreagreementComponent } from './modules/provider-onboarding/pl-provider-preagreement/pl-provider-preagreement.component';
import { PLProviderPreagreementW2Component } from './modules/provider-onboarding/pl-provider-preagreement-w2/pl-provider-preagreement-w2.component';

import { PLProvidersListComponent } from './modules/providers/pl-providers-list/pl-providers-list.component';
import { PLProviderComponent } from './modules/providers/pl-provider/pl-provider.component';
import { PLProviderAccountSettingsComponent } from './modules/providers/pl-provider-account-settings/pl-provider-account-settings.component';
import { PLProviderCaseloadComponent } from './modules/providers/pl-provider-caseload/pl-provider-caseload.component';
import { PlProviderQualificationsComponent } from './modules/providers/pl-provider-qualifications/pl-provider-qualifications.component';
import { PLProviderLocationsComponent } from
    './modules/providers/pl-provider-locations/pl-provider-locations.component';
import {
    PLProviderProfileAssignmentsComponent,
} from './modules/providers/pl-provider-profile-assignments/pl-provider-profile-assignments.component';
import {
    PLProviderAvailabilityComponent,
} from './modules/providers/pl-provider-availability/pl-provider-availability.component';

import { PLAddReferralsComponent } from './modules/add-referrals/pl-add-referrals.component';
import { PLSelectLocationComponent } from './modules/add-referrals/pl-select-location/pl-select-location.component';
import { PLUploadReferralsComponent } from './modules/add-referrals/pl-upload-referrals/pl-upload-referrals.component';
import { PLProviderMatchingComponent } from './modules/add-referrals/pl-provider-matching/pl-provider-matching.component';
import { PLReferralsConfirmationComponent } from './modules/add-referrals/pl-referrals-confirmation/pl-referrals-confirmation.component';

import { PLProviderAssignmentsComponent } from './modules/assignment-manager/pl-provider-assignments.component';
import { PLAssignmentManagerComponent } from './modules/assignment-manager/pl-assignment-manager.component';
import { PLAssignmentManagerRouteGuardService } from './modules/assignment-manager/pl-assignment-manager-routeguard.service';

import { PLDemoEventBus0 } from './modules/demos/demo-event-bus/demo-event-bus-0.component';

import { plIconsDemoComponent } from './modules/dev/pl-icons/pl-icons-demo.component';
import { ConfigComponent } from './modules/dev/config/config.component';

import { PLDashboardSSPComponent } from './modules/dashboard/pl-dashboard-ssp/pl-dashboard-ssp.component';


import { PlISADashboardViewGuard } from './modules/isa/pl-isa-dashboard-view.guard';
import { PLISADashboardComponent } from './modules/isa/pl-isa-dashboard/pl-isa-dashboard.component';

import * as commonResolvers from '@common/resolvers';
import { ROUTING } from './common/constants';

@NgModule({
    imports: [
        RouterModule.forRoot([
            {
                path: 'add-referrals',
                component: PLAddReferralsComponent,
                canActivate: [UserAuthGuardService],
                canDeactivate: [CanDeactivateGuard],
                children: [
                    { path: '', redirectTo: 'select-location', pathMatch: 'full' },
                    { path: 'select-location', component: PLSelectLocationComponent },
                    { path: 'upload-referrals', component: PLUploadReferralsComponent },
                    { path: 'provider-matching', component: PLProviderMatchingComponent },
                    { path: 'referrals-confirmation', component: PLReferralsConfirmationComponent },
                ],
                data: { title: 'Upload Referrals - Clients' }
            },
            {
                path: 'assignment-preferences', component: PLAssignmentPreferencesComponent,
                canActivate: [UserAuthGuardService],
            },
            {
                path: 'assignment-preferences/intent-to-return', component: PLIntentToReturnComponent,
                canActivate: [UserAuthGuardService],
                data: { title: 'Intent to Return' },
            },
            {
                path: 'client-referrals',
                component: PLClientReferralsComponent,
                canActivate: [UserAuthGuardService],
                data: { title: 'Client Referrals' },
                children: [
                    { path: '', redirectTo: 'manager', pathMatch: 'full' },
                    {
                        path: 'open',
                        component: PLClientReferralOpenComponent,
                        data: { title: 'Open Referrals - Client Referrals' },
                    },
                    {
                        path: 'manager', component: PLClientReferralManagerComponent,
                        canActivate: [UserCanAccessClientReferralManagerAuthGuardService],
                        data: { title: 'Manager - Client Referrals' }
                    },
                ],
            },
            {
                path: 'client-referral-save',
                component: PLClientReferralSaveComponent,
                canActivate: [UserAuthGuardService],
                data: { title: 'Add Client Referral - Clients' },
            },
            {
                path: 'cam-dashboard',
                redirectTo: 'cam-dashboard/overview',
                pathMatch: 'full',
            },
            {
                path: 'cam-dashboard/overview',
                component: PLCamDashboardComponent,
                canActivate: [UserAuthGuardService, PLFeatureFlagRouterService],
                data: { title: 'Overview - CAM Dashboard' },
                resolve: { currentUser: PLCamDashboardCurrentUserResolverService },
            },
            {
                path: 'cam-dashboard/locations-scheduling-status',
                component: PLCamLocationsSchedulingStatusComponent,
                canActivate: [UserAuthGuardService, PLFeatureFlagRouterService],
                data: { title: 'Scheduling Status - CAM Dashboard' },
            },
            {
                path: 'service-save',
                component: PLServiceSaveComponent,
                canActivate: [UserAuthGuardService],
                data: { title: 'Service Save' },
                children: [
                    { path: '', redirectTo: 'identify', pathMatch: 'full' },
                    { path: 'identify', component: PLServiceSaveIdentifyComponent },
                    { path: 'documentation', component: PLServiceSaveDocumentationComponent },
                    { path: 'client-details', component: PLServiceSaveClientDetailsComponent },
                    { path: 'service-details', component: PLServiceSaveServiceDetailsComponent },
                    { path: 'assign', component: PLServiceSaveAssignComponent },
                ],
            },
            {
                path: 'providers',
                component: PLProvidersListComponent,
                canActivate: [UserAuthGuardService],
                data: { title: 'Providers' },
            },
            {
                path: 'provider/:id',
                component: PLProviderComponent,
                canActivate: [UserAuthGuardService],
                data: { title: ROUTING.DYNAMIC },
                children: [
                    { path: '', redirectTo: 'overview', pathMatch: 'full' },
                    // to catch old links to account-settings
                    { path: 'account-settings', redirectTo: 'overview', pathMatch: 'full' },
                    { path: 'overview', component: PLProviderAccountSettingsComponent },
                    { path: 'caseload', component: PLProviderCaseloadComponent },
                    { path: 'qualifications', component: PlProviderQualificationsComponent },
                    { path: 'locations', component: PLProviderLocationsComponent },
                    { path: 'assignments', component: PLProviderProfileAssignmentsComponent },
                    { path: 'availability', component: PLProviderAvailabilityComponent },
                ],
            },
            {
                path: 'dashboard',
                component: PLCustomerDashboardComponent,
                canActivate: [UserAuthGuardService],
                data: { title: 'Dashboard' },
            },
            {
                path: 'isas-dashboard',
                component: PLISADashboardComponent,
                canActivate: [UserAuthGuardService, PlISADashboardViewGuard],
                data: { title: 'ISAs Dashboard' },
            },
            {
                path: 'agreement/:id',
                component: PLProviderPreagreementComponent,
                data: { title: 'Agreement' },
            },
            {
                path: 'agreementw2/:id',
                component: PLProviderPreagreementW2Component,
                data: { title: 'Agreement' },
            },
            {
                path: 'home',
                component: PLHomeComponent,
                canActivate: [UserAuthGuardService],
                data: { title: 'Home' }
            },
            {
                path: 'landing',
                component: PLDashboardComponent,
                canActivate: [UserAuthGuardService, UserCanAccessPLProviderLandingAuthGuardService],
                data: { title: 'Landing' },
            },
            {
                path: 'landing/launch-coassemble',
                component: PLCoassembleLauncherComponent,
                canActivate: [UserAuthGuardService],
                data: { title: 'Landing' },
            },
            {
                path: 'landing-home',
                component: PLDashboardSSPComponent,
                canActivate: [UserAuthGuardService, UserCanAccessSSPProviderLandingAuthGuardService],
                data: { title: 'Landing' },
            },
            {
                path: 'users',
                component: PLUsersComponent,
                canActivate: [UserAuthGuardService],
                data: { title: 'Users' },
            },
            {
                path: 'assignments',
                component: PLProviderAssignmentsComponent,
                canActivate: [UserAuthGuardService, PLFeatureFlagRouterService],
                data: { title: 'Assignments - Schedule' },
            },
            // ----------------------------------------
            // CAM routes
            // ----------------------------------------
            {
                path: 'assignment-manager',
                component: PLAssignmentManagerComponent,
                canActivate: [UserAuthGuardService, PLAssignmentManagerRouteGuardService, PLFeatureFlagRouterService],
                data: { title: 'Assignment Manager  - CAM Dashboard' },
            },
            // ----------------------------------------
            // Other routes
            // ----------------------------------------
            {
                path: 'demos/event-bus',
                component: PLDemoEventBus0,
                canActivate: [UserAuthGuardService],
                canDeactivate: [CanDeactivateGuard],
                data: { title: 'Demos / Event Bus' },
            },
            { path: 'dev/icons', component: plIconsDemoComponent },
            { path: 'config', component: ConfigComponent },
            { path: 'liveagent-prechat', component: PLLiveagentPrechatPageComponent },
            { path: 'liveagent-postchat', component: PLLiveagentPostchatPageComponent },
            { path: 'form-assembly', component: PLFormAssemblyPageComponent },
            { path: 'logout', component: plLogoutComponent },
            // Lazy loading
            // ----------------------------------------
            // Provider scheduling and documentation
            // ----------------------------------------
            {
                path: 'documentation-assistant',
                canActivate: [UserAuthGuardService],
                loadChildren: () => import('./modules/workflow-manager/workflows/invoice-documentation/pl-ida.module')
                    .then(m => m.PLIDAModule),
            },
            {
                path: 'client',
                canActivate: [UserAuthGuardService],
                data: { title: ROUTING.DYNAMIC },
                loadChildren: () => import('./modules/clients/index')
                    .then(m => m.PLClientsModule),
            },
            {
                path: 'location',
                canActivate: [UserAuthGuardService],
                loadChildren: () => import('./modules/locations/index')
                    .then(m => m.PLLocationsModule),
            },
            {
                path: 'organization',
                canActivate: [UserAuthGuardService],
                loadChildren: () => import('./modules/organizations/index')
                    .then(m => m.PLOrganizationsModule),
            },
            {
                path: 'provider-onboarding',
                canActivate: [UserAuthGuardService],
                loadChildren: () => import('./modules/provider-onboarding/index')
                    .then(m => m.PLProviderOnboardingModule),
            },
            {
                path: 'schedule',
                loadChildren: () => import('./modules/schedule/schedule.module')
                    .then(m => m.PLScheduleModule),
            },
            {
                path: 'school-staff',
                resolve: { material: commonResolvers.PLMaterialDesignResolver },
                loadChildren: () => import('./modules/school-staff-dashboards/school-staff-dashboards.module')
                    .then(m => m.PLSchoolStaffDashboardsModule),
            },
            {
                path: 'billing',
                loadChildren: () => import('./modules/billing/billing.module')
                    .then(m => m.PLBillingModule),
            },
            {
                path: 'client-merge',
                canActivate: [
                    UserAuthGuardService,
                    PLClientMergePermissionsService,
                ],
                loadChildren: () => import('./modules/client-merge')
                    .then(m => m.PLClientMergeModule),
            },
            {
                path: 'availability',
                canActivate: [UserAuthGuardService],
                data: { title: 'Availability - Schedule' },
                loadChildren: () => import('./modules/schedule/index')
                    .then(m => m.PLScheduleAvailabilityModule),
            },
            {
                path: 'components',
                loadChildren: () => import('../showcase/showcase.module')
                    .then(m => m.PLShowcaseModule),
            },
            // redirect to old URL
            { path: 'clients', redirectTo: 'client/list' },
            { path: 'user-save', redirectTo: 'users', pathMatch: 'full' },
            { path: 'locations', redirectTo: 'location/list' },
            { path: 'locations/organizations', redirectTo: 'organization/list' },
            { path: 'contact/enable_sms', redirectTo: 'client/contact/enable_sms' }, // Double Check
            { path: 'contact/enable_login', redirectTo: 'client/contact/enable_login' }, // Double Check

            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: '**', component: PageNotFoundComponent },
            { path: 'not-found', component: PageNotFoundComponent },
        ], { relativeLinkResolution: 'legacy' }),
    ],
    exports: [RouterModule],
    providers: [
        PlISADashboardViewGuard,
    ],
})
export class AppRoutingModule { }
