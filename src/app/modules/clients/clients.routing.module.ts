import { NgModule }     from '@angular/core';
import { RouterModule } from '@angular/router';

import { PLClientsListComponent } from './pl-clients-list/pl-clients-list.component';
import { PLAllClientsComponent } from './pl-clients-list/pl-all-clients/pl-all-clients.component';
import { PLCaseloadClientsComponent } from './pl-clients-list/pl-caseload-clients/pl-caseload-clients.component';
import { PLClientComponent } from './pl-client/pl-client.component';
import { PLClientReportsComponent } from './pl-client-reports/pl-client-reports.component';
import { PLClientDetailsComponent } from './pl-client-details/pl-client-details.component';
import { PLClientDocumentsComponent } from './pl-client-documents/pl-client-documents.component';
import { PLClientProvidersComponent } from './pl-client-providers/pl-client-providers.component';
import { PLClientServicesComponent } from './pl-client-services/pl-client-services.component';
import { PLClientIepGoalsAuthGuardService } from './pl-client-iep-goals/pl-client-iep-goals-authguard.service';
import { PLClientIEPTabComponent } from './pl-client-iep-goals/pl-client-iep-tab/pl-client-iep-tab.component';
import { PLClientEndIEPGoalStatusComponent } from './pl-client-iep-goals/pl-client-end-iep/pl-client-end-iep-goal-status.component';
import { PLClientEndIEPExitStatusComponent } from './pl-client-iep-goals/pl-client-end-iep/pl-client-end-iep-exit-status.component';
import { PLClientIEPTestApiComponent } from './pl-client-iep-goals/pl-client-iep-test-api/pl-client-iep-test-api.component';
import { PLClientChangeLocationComponent } from './pl-client-change-location/pl-client-change-location.component';
import { PLClientContactEnableSMSComponent } from './pl-client-contact-enable-sms/pl-client-contact-enable-sms.component';
import { PLClientAbsencesDashboardComponent } from '@app/modules/client-absences/pl-client-absences-dashboard/pl-client-absences-dashboard.component';
import { PLClientContactEnableLoginComponent } from './pl-client-contact-enable-login/pl-client-contact-enable-login.component';
import { UserAuthGuardService } from '../user/user-auth-guard.service';
import { PLClientsAssessmentsComponent } from '../client-assessments/pl-clients-assessments.component';
import { ROUTING } from '@common/constants';
import { CurrentUserResolver } from '@common/resolvers';
import { CanDeactivateGuard } from '@common/can-deactivate-guard.service';
// import { PLISADashboardComponent } from '../isa/pl-isa-dashboard/pl-isa-dashboard.component';
// import { PlISADashboardViewGuard } from '../isa/pl-isa-dashboard-view.guard';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', pathMatch: 'full', redirectTo: 'list' },
            {
                path: 'list',
                component: PLClientsListComponent,
                resolve: { user: CurrentUserResolver },
                canActivate: [UserAuthGuardService],
                data: { title: ROUTING.DYNAMIC },
                children: [
                    { path: '', redirectTo: 'caseload-clients', pathMatch: 'full' },
                    { path: 'all-clients', component: PLAllClientsComponent },
                    { path: 'caseload-clients', component: PLCaseloadClientsComponent },
                    { path: 'absences', component: PLClientAbsencesDashboardComponent },
                    { path: 'assessments', component: PLClientsAssessmentsComponent, canDeactivate: [CanDeactivateGuard], },
                ],
            },
            {
                path: 'merge/:id/change-location/:locId',
                component: PLClientChangeLocationComponent,
                canActivate: [UserAuthGuardService],
                data: {
                    title: 'Client Merge - Change Location',
                    statusMessage: `You have been redirected from client merge. Once the location has been updated
                                    you will return to client merge.`,
                    reason: 'CORRECTION',
                },
            },
            {
                path: 'contact/enable_sms',
                component: PLClientContactEnableSMSComponent,
                data: { title: 'Enable SMS' },
            },
            {
                path: 'contact/enable_login',
                component: PLClientContactEnableLoginComponent,
                data: { title: 'Enable Account Access' },
            },
            {
                path: ':id',
                component: PLClientComponent,
                canActivate: [UserAuthGuardService],
                data: { title: ROUTING.DYNAMIC },
                resolve: { user: CurrentUserResolver },
                children: [
                    { path: '', redirectTo: 'services', pathMatch: 'full' },
                    { path: 'reports', component: PLClientReportsComponent },
                    { path: 'details', component: PLClientDetailsComponent },
                    { path: 'details/:mode', component: PLClientDetailsComponent },
                    { path: 'details/:mode/:target', component: PLClientDetailsComponent },
                    { path: 'documents', component: PLClientDocumentsComponent },
                    { path: 'providers', component: PLClientProvidersComponent },
                    { path: 'services', component: PLClientServicesComponent },
                    {
                        path: 'iep-goals',
                        component: PLClientIEPTabComponent,
                        canActivate: [PLClientIepGoalsAuthGuardService],
                    },
                    {
                        path: 'iep-goals/end-iep/:iepId/goal-status',
                        component: PLClientEndIEPGoalStatusComponent,
                        canActivate: [PLClientIepGoalsAuthGuardService],
                    },
                    {
                        path: 'iep-goals/end-iep/:iepId/exit-status',
                        component: PLClientEndIEPExitStatusComponent,
                        canActivate: [PLClientIepGoalsAuthGuardService],
                    },
                    {
                        path: 'iep-goals/api-playground',
                        component: PLClientIEPTestApiComponent,
                        canActivate: [PLClientIepGoalsAuthGuardService],
                    },
                    {
                        path: 'change-location',
                        component: PLClientChangeLocationComponent,
                        canActivate: [UserAuthGuardService],
                        data: { title: 'Change Location' },
                    },
                ],
            },
        ]),
    ],
    exports: [
        RouterModule,
    ],
})
export class PLClientsRoutingModule {}
