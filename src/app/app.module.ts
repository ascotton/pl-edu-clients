import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { MatomoInjector, MatomoModule, MatomoTracker } from 'ngx-matomo';

import { currentUser } from './modules/user/current-user.store';
import { currentClient } from './stores/current-client.store';
import { currentClientUser } from './stores/current-client-user.store';
import { clientsList } from './stores/clients-list.store';
import { providerOnboardingStore } from './stores/provider-onboarding.store';
import { backLink } from './stores/back-link.store';
import { app } from './stores/app.store';
import { notesReportDownloads } from '@common/services/reports/pl-notes-report-download.store';
import { handbookRoutingActionStore } from './modules/handbook/handbook-routing-action.store';
import { CurrentUserService } from './modules/user/current-user.service';
import { CurrentUserUserIDService } from './modules/user/current-user-user-id.service';
import { CurrentUserRealUserIDService } from './modules/user/current-user-real-user-id.service';
import { UserAuthGuardService } from './modules/user/user-auth-guard.service';
import { UserCanAccessPLProviderLandingAuthGuardService } from './modules/user/user-can-access-pl-provider-landing-auth-guard.service';
import { UserCanAccessSSPProviderLandingAuthGuardService } from './modules/user/user-can-access-ssp-provider-landing-auth-guard.service';
import { UserCanAccessClientReferralManagerAuthGuardService } from './modules/user/user-can-access-client-referral-manager-auth-guard.service';
import { InactivityLogoutService } from './modules/user/inactivity-logout.service';
import { CanDeactivateGuard } from '@common/can-deactivate-guard.service';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { NgProgressModule } from 'ngx-progressbar';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { TooltipModule } from 'ng2-tooltip-directive';
import { ToastrModule } from 'ngx-toastr';

import { PLStatusHelpComponent } from '@common/components/pl-status-help/pl-status-help.component';
import { PLFloatingLoaderComponent } from '@common/components/pl-floating-loader/pl-floating-loader.component';
import { PLGenericModalComponent } from '@common/components/pl-generic-modal/pl-generic-modal.component';

import { PLCommonModule } from '@common/index';

import { PLUserModule } from './modules/user';

import {
    SentryErrorHandler,
    HeapLogger,
    PLUIStateModule,
    // Components
    PLAppNavModule,
    PLAssumeLoginModule,
    PLButtonModule,
    PLBrowserModule,
    PLConfigModule,
    PLE2ETestModule,
    PLDotLoaderModule,
    PLGraphQLModule,
    PLInputModule,
    PLIconModule,
    PLLinkModule,
    PipeModule,
    PLModalModule,
    PLStepsModule,
    PLTableModule,
    PLTableFrameworkModule,
    PLTabsModule,
    PLToastModule,
    PLDialogModule,
    // Services
    PLAssumeLoginService,
    PLAbstractUserIDService,
    PLAbstractRealUserIDService,
    PLFormatterService,
    PLHttpModule,
    PLLodashService,
    PLMayService,
    PLTimezoneService,
    PLTransformGraphQLService,
    PLStylesService,
    PLWindowService,
    PLApiAbstractService,
    PLApiAccountDocumentTypesService,
    PLApiAccountUploadDocumentsService,
    PLApiAreasOfConcernService,
    PLApiAssessmentsService,
    PLApiBillingCodesService,
    PLApiClientsService,
    PLApiContactTypesService,
    PLApiDocumentTypesService,
    PLApiEthnicitiesService,
    PLApiFileAmazonService,
    PLApiLanguagesService,
    PLApiLocationsService,
    PLApiNomsService,
    PLApiNotesSchemasService,
    PLApiProvidersService,
    PLApiProviderTypesService,
    PLApiRacesService,
    PLApiServiceDocumentsService,
    PLApiServiceTypesService,
    PLApiServicesService,
    PLApiUsStatesService,
    PLApiClientServicesService,
    PLApiServiceOptsService,
    PLApiServiceSaveService,
    PLApiServiceUploadDocumentsService,
    PLGQLClientsService,
    PLGQLClientServiceService,
    PLGQLEnglishLanguageLearnerService,
    PLGQLLanguagesService,
    PLGQLLocationsService,
    PLGQLProvidersService,
    PLGQLProviderTypesService,
    PLGQLReferralsService,
    PLGQLServicesService,
    PLGQLQueriesService,
    PLGQLStringsService,
    PLClosablePageHeaderModule,
    PLVaryDisplayModule,
} from '@root/index';

import {
    PLGetProviderService,
    PLLocationsService,
    PLSchoolYearsService,
    PLStatusDisplayService,
    PLClientsTableService,
    PLFeatureFlagRouterService,
    PLFeatureFlagService,
    MAX_QUERY_LIMIT,
} from '@common/services';

import { FiltersModule } from '@common/filters';

import { AppConfigService } from './app-config.service';

import { SvgInlineNgPluginService } from '../build/svg-inline-ng-plugin.service';

import { PLHomeModule } from './modules/home';
import { PLDashboardModule } from './modules/dashboard';
import { PLCoassembleLauncherComponent } from './modules/dashboard/pl-coassemble-launcher/pl-coassemble-launcher.component';
import { PLMeetingsListComponent } from './modules/dashboard/pl-meetings-list/pl-meetings-list.component';

import { PLAssignmentPreferencesModule } from './modules/assignment-preferences';
import { PLClientReferralsModule } from './modules/client-referrals';
import { PLCamDashboardModule } from './modules/cam-dashboard';
import { PLCustomerDashboardModule } from './modules/customer-dashboard';
import { PLDownloadsModule } from './modules/downloads';
import { PLUsersModule } from './modules/users';
import { PLDemosModule } from './modules/demos';

import { plLogoutComponent } from './modules/user/pl-logout/pl-logout.component';

import { PLClientReferralSaveComponent } from './modules/client-referral-save/pl-client-referral-save/pl-client-referral-save.component';
import { PLClientReferralSaveClientComponent } from './modules/client-referral-save/pl-client-referral-save-client/pl-client-referral-save-client.component';
import { PLClientReferralSaveReferralComponent } from './modules/client-referral-save/pl-client-referral-save-referral/pl-client-referral-save-referral.component';
import { PLClientReferralSaveService } from './modules/client-referral-save/pl-client-referral-save.service';

import { PLServiceSaveComponent } from './modules/service-save/pl-service-save/pl-service-save.component';
import { PLServiceSaveIdentifyComponent } from './modules/service-save/pl-service-save-identify/pl-service-save-identify.component';
import { PLServiceSaveDocumentationComponent } from './modules/service-save/pl-service-save-documentation/pl-service-save-documentation.component';
import { PLServiceSaveClientDetailsComponent } from './modules/service-save/pl-service-save-client-details/pl-service-save-client-details.component';
import { PLServiceSaveServiceDetailsComponent } from './modules/service-save/pl-service-save-service-details/pl-service-save-service-details.component';
import { PLServiceSaveAssignComponent } from './modules/service-save/pl-service-save-assign/pl-service-save-assign.component';
import { PLServiceSaveService } from './modules/service-save/pl-service-save.service';

import { PLProvidersListComponent } from './modules/providers/pl-providers-list/pl-providers-list.component';
import { PLProviderComponent } from './modules/providers/pl-provider/pl-provider.component';
import { PLProviderProfileHeaderComponent } from './modules/providers/pl-provider-profile-header/pl-provider-profile-header.component';
import { PLProviderAccountSettingsComponent } from './modules/providers/pl-provider-account-settings/pl-provider-account-settings.component';
import { PLProviderAssumeLoginButtonComponent } from './modules/providers/pl-provider-assume-login-button/pl-provider-assume-login-button.component';
import { PLProviderCaseloadComponent } from './modules/providers/pl-provider-caseload/pl-provider-caseload.component';
import { PlProviderQualificationsComponent } from './modules/providers/pl-provider-qualifications/pl-provider-qualifications.component';
import {
    PLProviderLocationsComponent,
} from './modules/providers/pl-provider-locations/pl-provider-locations.component';
import {
    PLProviderProfileAssignmentsComponent,
} from './modules/providers/pl-provider-profile-assignments/pl-provider-profile-assignments.component';
import {
    PLProviderAvailabilityComponent,
} from './modules/providers/pl-provider-availability/pl-provider-availability.component';
import { PLProviderService } from './modules/providers/pl-provider.service';
import { PLProviderAreasOfSpecialtyComponent } from './modules/providers/pl-provider-account-settings/pl-provider-areas-of-specialty.component';
import { PLProviderLanguagesComponent } from './modules/providers/pl-provider-account-settings/pl-provider-languages.component';
import { PLProviderNotificationPreferencesComponent } from './modules/providers/pl-provider-account-settings/pl-provider-notification-preferences.component';

import { PLAddReferralsComponent } from './modules/add-referrals/pl-add-referrals.component';
import { PLLocationBannerComponent } from './modules/add-referrals/pl-location-banner.component';
import { PLLocationClientsConfirmComponent } from './modules/locations/pl-location-clients-confirm/pl-location-clients-confirm.component';
import { PLErrorMessageComponent } from './modules/add-referrals/pl-error-message.component';
import { PLSelectLocationComponent } from './modules/add-referrals/pl-select-location/pl-select-location.component';
import { PLUploadReferralsComponent } from './modules/add-referrals/pl-upload-referrals/pl-upload-referrals.component';
import { PLFileImportService } from './modules/add-referrals/pl-upload-referrals/pl-file-import.service';
import { PLAddReferralsNavigationService } from './modules/add-referrals/pl-add-referrals-navigation.service';
import { PLAddReferralsLocationYearService } from './modules/add-referrals/pl-add-referrals-location-year.service';
import { PLAddReferralsDataTableService } from './modules/add-referrals/pl-add-referrals-table-data.service';
import { PLAddReferralsGraphQLService } from './modules/add-referrals/pl-add-referrals-graphql.service';
import { PLClientReferralDataModelService } from './modules/add-referrals/pl-client-referral-data-model.service';
import { PLClientIEPGoalsService } from './modules/clients/pl-client-iep-goals/pl-client-iep-goals.service';

import { PLClientMergeModule } from './modules/client-merge';

import { PLProviderMatchingComponent } from './modules/add-referrals/pl-provider-matching/pl-provider-matching.component';
import { PLReferralsConfirmationComponent } from './modules/add-referrals/pl-referrals-confirmation/pl-referrals-confirmation.component';
import { PLReferralDuplicateComponent } from './modules/add-referrals/pl-referral-duplicate/pl-referral-duplicate.component';
import { PLAddReferralsTableComponent } from './modules/add-referrals/common/pl-add-referrals-table.component';
import { PLNameChangeTableComponent } from './modules/add-referrals/pl-referrals-confirmation/pl-name-change-table.component';

import { PageNotFoundComponent } from './modules/page-not-found/page-not-found.component';
import { PLLiveagentPagesModule } from './modules/pl-liveagent-pages';
import { PLThirdPartyPagesModule } from './modules/pl-third-party-pages';

import { plIconsDemoComponent } from './modules/dev/pl-icons/pl-icons-demo.component';
import { ConfigComponent } from './modules/dev/config/config.component';

import { PLClientReferralDeleteComponent } from './modules/clients/pl-client-direct-referral/pl-client-referral-delete/pl-client-referral-delete.component';

import { PLClientReferralMatchComponent } from './modules/client-referrals/pl-client-referral-match/pl-client-referral-match.component';

import { PLClientReferralDeclineComponent } from './modules/clients/pl-client-direct-referral/pl-client-referral-decline/pl-client-referral-decline.component';

import { PLClientDirectServiceStatusEditComponent } from './modules/clients/pl-client-direct-service/pl-client-direct-service-status-edit/pl-client-direct-service-status-edit.component';

import { PLClientDeleteComponent } from './modules/clients/pl-client-profile-header/pl-client-delete/pl-client-delete.component';

import { PLProviderAssignmentsComponent } from './modules/assignment-manager/pl-provider-assignments.component';
import { PLAssignmentManagerComponent } from './modules/assignment-manager/pl-assignment-manager.component';
import { PLAssignmentManagerService } from './modules/assignment-manager/pl-assignment-manager.service';
import { PLAssignmentManagerRouteGuardService } from './modules/assignment-manager/pl-assignment-manager-routeguard.service';
import { PLCustomAssignmentModalComponent } from './modules/assignment-manager/pl-custom-assignment-modal.component';
import { PLRejectAssignmentModalComponent } from './modules/assignment-manager/pl-reject-assignments-modal.component';
import { PLUpdateAssignmentErrorModalComponent } from './modules/assignment-manager/pl-update-assignment-error-modal.component';

import { PLCustomerDashboardService } from './modules/customer-dashboard/pl-customer-dashboard.service';
import { PLStudentStatusHelpComponent } from './modules/customer-dashboard/pl-student-status-help/pl-student-status-help.component';
import { PLClientIepGoalsAuthGuardService } from './modules/clients/pl-client-iep-goals/pl-client-iep-goals-authguard.service';

import { PLSearchModule } from './modules/search/search.module';
import { PLClientReferralSaveModule } from './modules/client-referral-save';
import { PLPermissionsModule } from './modules/permissions';
import { PLMatomoService } from './common/services/pl-matomo.service';
import { PLScheduleAvailabilityComponentsModule } from './modules/schedule';
import { PLProviderPreagreementComponent } from './modules/provider-onboarding/pl-provider-preagreement/pl-provider-preagreement.component';
import { PLProviderPreagreementW2Component } from './modules/provider-onboarding/pl-provider-preagreement-w2/pl-provider-preagreement-w2.component';
import { PLISADashboardComponent } from './modules/isa/pl-isa-dashboard/pl-isa-dashboard.component';
import { PLISATableComponent } from './modules/isa/pl-isa-table/pl-isa-table.component';
import { PLISAHandlingComponent } from './modules/isa/pl-isa-handling/pl-isa-handling.component';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        // NgRx
        StoreModule.forRoot({
            currentUser,
            currentClient,
            currentClientUser,
            clientsList,
            backLink,
            app,
            notesReportDownloads,
            providerOnboardingStore,
            handbookRoutingActionStore,
        }),
        EffectsModule.forRoot([]),
        StoreDevtoolsModule.instrument({
            maxAge: 250, // Retains last 25 states
            // logOnly: environment.production, // Restrict extension to log-only mode
        }),
        // PL Edu Client Modules => Should go before App Routing so Route work
        PLSearchModule,
        AppRoutingModule,
        PLCommonModule,
        FiltersModule,
        PLClientMergeModule,

        PipeModule,

        // Components
        PLAppNavModule,
        PLAssumeLoginModule,
        PLButtonModule,
        PLBrowserModule,
        PLConfigModule,
        PLE2ETestModule,
        PLDotLoaderModule,
        PLGraphQLModule,
        PLIconModule,
        PLInputModule,
        PLLinkModule,
        PLModalModule,
        PLStepsModule,
        PLTableModule,
        PLTableFrameworkModule,
        PLTabsModule,
        PLToastModule,
        PLDialogModule,
        PLClosablePageHeaderModule,
        PLVaryDisplayModule,
        PLPermissionsModule,

        // Services
        PLHttpModule,

        PLHomeModule,
        PLAssignmentPreferencesModule,
        PLClientReferralsModule,
        PLCamDashboardModule,
        PLCustomerDashboardModule,
        PLClientReferralSaveModule,
        PLDownloadsModule,
        PLUsersModule,
        PLUIStateModule,

        PLLiveagentPagesModule,
        PLThirdPartyPagesModule,

        // Need it for provider module, once is remove we can import in its own module
        PLScheduleAvailabilityComponentsModule,

        PLUserModule,
        NgProgressModule,
        NgxJsonViewerModule,
        TooltipModule,
        ToastrModule.forRoot(),

        PLDemosModule,
        ScrollingModule,
        PLDashboardModule,
        MatTooltipModule,
        MatSelectModule,
        MatButtonModule,
    ],
    declarations: [
        AppComponent,
        PageNotFoundComponent,
        plLogoutComponent,
        PLCoassembleLauncherComponent,
        PLMeetingsListComponent,

        PLAddReferralsComponent,
        PLLocationBannerComponent,
        PLLocationClientsConfirmComponent,
        PLErrorMessageComponent,
        PLSelectLocationComponent,
        PLUploadReferralsComponent,
        PLProviderMatchingComponent,
        PLReferralsConfirmationComponent,
        PLReferralDuplicateComponent,
        PLAddReferralsTableComponent,
        PLNameChangeTableComponent,

        PLClientReferralDeleteComponent,
        PLClientReferralMatchComponent,
        PLClientReferralDeclineComponent,

        PLClientDirectServiceStatusEditComponent,
        PLClientDeleteComponent,

        PLClientReferralSaveComponent,
        PLClientReferralSaveClientComponent,
        PLClientReferralSaveReferralComponent,

        PLServiceSaveComponent,
        PLServiceSaveIdentifyComponent,
        PLServiceSaveDocumentationComponent,
        PLServiceSaveClientDetailsComponent,
        PLServiceSaveServiceDetailsComponent,
        PLServiceSaveAssignComponent,

        PLProvidersListComponent,
        PLProviderComponent,
        PLProviderProfileHeaderComponent,
        PLProviderAccountSettingsComponent,
        PLProviderAssumeLoginButtonComponent,
        PLProviderCaseloadComponent,
        PlProviderQualificationsComponent,
        PLProviderLocationsComponent,
        PLProviderAreasOfSpecialtyComponent,
        PLProviderLanguagesComponent,
        PLProviderNotificationPreferencesComponent,
        PLProviderProfileAssignmentsComponent,
        PLProviderAvailabilityComponent,
        PLProviderPreagreementComponent,
        PLProviderPreagreementW2Component,

        PLStudentStatusHelpComponent,
        PLAssignmentManagerComponent,
        PLCustomAssignmentModalComponent,
        PLRejectAssignmentModalComponent,
        PLProviderAssignmentsComponent,
        PLUpdateAssignmentErrorModalComponent,

        PLFloatingLoaderComponent,
        plIconsDemoComponent,
        ConfigComponent,
        PlProviderQualificationsComponent,

        PLISADashboardComponent,
        PLISATableComponent,
        PLISAHandlingComponent,
    ],
    entryComponents: [
        PLClientReferralDeleteComponent,
        PLClientReferralMatchComponent,
        PLClientReferralDeclineComponent,
        PLClientDirectServiceStatusEditComponent,
        PLClientDeleteComponent,
        PLLocationClientsConfirmComponent,
        PLStatusHelpComponent,
        PLCustomAssignmentModalComponent,
        PLRejectAssignmentModalComponent,
        PLUpdateAssignmentErrorModalComponent,
        PLStudentStatusHelpComponent,
        PLMeetingsListComponent,
        PLProviderAreasOfSpecialtyComponent,
        PLProviderLanguagesComponent,
        PLGenericModalComponent,
        PLProviderNotificationPreferencesComponent,
        PLISAHandlingComponent,
    ],
    providers: [
        // Services
        PLAssumeLoginService,
        { provide: PLAbstractUserIDService, useClass: CurrentUserUserIDService },
        { provide: PLAbstractRealUserIDService, useClass: CurrentUserRealUserIDService },
        PLFormatterService,
        PLLodashService,
        PLMayService,
        PLTimezoneService,
        PLTransformGraphQLService,
        PLStylesService,
        PLWindowService,
        PLFeatureFlagRouterService,
        PLFeatureFlagService,

        PLApiAbstractService,
        PLApiAccountDocumentTypesService,
        PLApiAccountUploadDocumentsService,
        PLApiAreasOfConcernService,
        PLApiAssessmentsService,
        PLApiBillingCodesService,
        PLApiClientsService,
        PLApiContactTypesService,
        PLApiDocumentTypesService,
        PLApiEthnicitiesService,
        PLApiFileAmazonService,
        PLApiLanguagesService,
        PLApiLocationsService,
        PLApiNomsService,
        PLApiNotesSchemasService,
        PLApiProvidersService,
        PLApiProviderTypesService,
        PLApiRacesService,
        PLApiServiceDocumentsService,
        PLApiServiceTypesService,
        PLApiServicesService,
        PLApiUsStatesService,

        PLApiClientServicesService,
        PLApiServiceOptsService,
        PLApiServiceSaveService,
        PLApiServiceUploadDocumentsService,

        PLGQLClientsService,
        PLGQLClientServiceService,
        PLGQLLanguagesService,
        PLGQLLocationsService,
        PLGQLProvidersService,
        PLGQLProviderTypesService,
        PLGQLReferralsService,
        PLGQLServicesService,

        PLGQLQueriesService,
        PLGQLStringsService,

        PLClientReferralSaveService,
        PLProviderService,
        PLServiceSaveService,
        PLClientIEPGoalsService,
        PLClientIepGoalsAuthGuardService,

        PLFileImportService,
        PLAddReferralsNavigationService,
        PLAddReferralsLocationYearService,
        PLAddReferralsDataTableService,
        PLAddReferralsGraphQLService,
        PLClientReferralDataModelService,

        PLGetProviderService,
        // tslint:disable-next-line: deprecation
        PLLocationsService,
        PLSchoolYearsService,
        PLStatusDisplayService,
        PLClientsTableService,

        PLCustomerDashboardService,
        PLAssignmentManagerService,
        PLAssignmentManagerRouteGuardService,

        AppConfigService,
        SvgInlineNgPluginService,

        CurrentUserService,
        UserAuthGuardService,
        UserCanAccessPLProviderLandingAuthGuardService,
        UserCanAccessSSPProviderLandingAuthGuardService,
        UserCanAccessClientReferralManagerAuthGuardService,
        InactivityLogoutService,
        CanDeactivateGuard,
        SentryErrorHandler,
        HeapLogger,

        MatomoInjector,
        MatomoTracker,
        PLMatomoService,
        { provide: MAX_QUERY_LIMIT, useValue: 1000 },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
