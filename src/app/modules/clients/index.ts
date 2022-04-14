import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import {
    PLModalModule,
    PLDotLoaderModule,
    PLIconModule,
    PLInputModule,
    PLButtonModule,
    PLVaryDisplayModule,
    PLTableFrameworkModule,
    PLTabsModule,
    PLTableModule,
    PLStepsModule,
    PLClosablePageHeaderModule,
} from '@root/index';
import { PLCommonModule } from '@common/index';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

import { PLReportsModule } from '../reports';
import { PLDocumentsModule } from '../documents';
import { PLTestApiModule } from '../test-api';
import { PLPermissionsModule } from '../permissions';
import { PLClientAbsencesModule } from '../client-absences';
import { PLClientsListModule } from './pl-clients-list';
import { PLClientsRoutingModule } from './clients.routing.module';
import { PLClientAssessmentsModule } from '../client-assessments';

import { PLClientComponent } from './pl-client/pl-client.component';
import { PLClientProfileHeaderComponent } from './pl-client-profile-header/pl-client-profile-header.component';
import { PLClientDetailsComponent } from './pl-client-details/pl-client-details.component';
import { PLClientDocumentsComponent } from './pl-client-documents/pl-client-documents.component';
import { PLClientProvidersComponent } from './pl-client-providers/pl-client-providers.component';
import { PLClientReportsComponent } from './pl-client-reports/pl-client-reports.component';
import {
    PLClientRecordsListComponent,
} from './pl-client-records-list/pl-client-records-list.component';
import { PLClientServicesComponent } from './pl-client-services/pl-client-services.component';
import { PLClientIEPTabComponent } from './pl-client-iep-goals/pl-client-iep-tab/pl-client-iep-tab.component';
import { PLClientIEPFormComponent } from './pl-client-iep-goals/pl-client-iep-form/pl-client-iep-form.component';
import { PLClientIEPItemComponent } from './pl-client-iep-goals/pl-client-iep-item/pl-client-iep-item.component';
import { PLClientIEPServiceAreaComponent } from './pl-client-iep-goals/pl-client-iep-service-area/pl-client-iep-service-area.component';
import { PLClientIEPGoalItemComponent } from './pl-client-iep-goals/pl-client-iep-goal-item/pl-client-iep-goal-item.component';
import { PLGoalStatusComponent } from './pl-client-iep-goals/pl-goal-status/pl-goal-status.component';
import { PLClientIEPMetricItemComponent } from './pl-client-iep-goals/pl-client-iep-metric-item/pl-client-iep-metric-item.component';
import { PLClientEndIEPGoalStatusComponent } from './pl-client-iep-goals/pl-client-end-iep/pl-client-end-iep-goal-status.component';
import { PLClientEndIEPExitStatusComponent } from './pl-client-iep-goals/pl-client-end-iep/pl-client-end-iep-exit-status.component';
import { PLClientIEPTestApiComponent } from './pl-client-iep-goals/pl-client-iep-test-api/pl-client-iep-test-api.component';
import { PLClientGoalStatusHelpComponent } from './pl-client-iep-goals/pl-client-goal-status-help/pl-client-goal-status-help.component';
import { PLClientContactsComponent } from './pl-client-contacts/pl-client-contacts.component';
import { PLClientContactEnableSMSComponent } from './pl-client-contact-enable-sms/pl-client-contact-enable-sms.component';
import { PLClientProfileComponent } from './pl-client-profile/pl-client-profile.component';
import {
    PLClientProfileSaveComponent,
} from './pl-client-profile-save/pl-client-profile-save.component';
import { PLClientConvertedReferralListComponent } from './pl-client-converted-referral-list/pl-client-converted-referral-list.component';

import { PLClientChangeLocationComponent } from './pl-client-change-location/pl-client-change-location.component';

import { PLClientDirectReferralComponent } from './pl-client-direct-referral/pl-client-direct-referral.component';
import { PLClientDirectServiceComponent } from './pl-client-direct-service/pl-client-direct-service.component';
import { PLClientDirectServicesComponent } from './pl-client-direct-services/pl-client-direct-services.component';
import { PLClientEvaluationComponent } from './pl-client-evaluation/pl-client-evaluation.component';
import { PLClientEvaluationReassignComponent } from './pl-client-evaluation-reassign/pl-client-evaluation-reassign.component';
import { PLClientEvaluationsComponent } from './pl-client-evaluations/pl-client-evaluations.component';
import { PLClientMetricsComponent } from './pl-client-metrics/pl-client-metrics.component';
import { PLClientMetricSaveComponent } from './pl-client-metric-save/pl-client-metric-save.component';
import { PLClientNomsComponent } from './pl-client-noms/pl-client-noms.component';
import { PLClientNomSaveComponent } from './pl-client-nom-save/pl-client-nom-save.component';
import { PLClientService } from './pl-client.service';
import { PLClientContactsService } from './pl-client-contacts.service';
import { PLClientServicesService } from './pl-client-services.service';
import { PLClientContactEnableLoginComponent } from './pl-client-contact-enable-login/pl-client-contact-enable-login.component';
import { PLRecordCapturesThumbnailsComponent } from './pl-client-records-list/pl-record-captures-thumbnails/pl-record-captures-thumbnails.component';
import { PLClientServicesExpandableRowComponent } from './pl-client-services-expandable-row/pl-client-services-expandable-row.component';
import { PLAssessmentCaseManagerModalComponent } from '../client-assessments/pl-assessment-case-manager-modal/pl-assessment-case-manager-modal.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        PLCommonModule,
        PLButtonModule,
        PLInputModule,
        PLTabsModule,
        PLIconModule,
        PLStepsModule,
        PLModalModule,
        PLClosablePageHeaderModule,
        PLTableModule,
        PLTableFrameworkModule,
        PLDotLoaderModule,
        PLVaryDisplayModule,
        PLDocumentsModule,
        PLPermissionsModule,
        PLReportsModule,
        PLTestApiModule,
        PLClientsListModule,
        PLClientAbsencesModule,
        PLClientsRoutingModule,
        NgxJsonViewerModule,
        ScrollingModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatMomentDateModule,
        PLClientAssessmentsModule,
    ],
    declarations: [
        PLClientComponent,
        PLClientProfileHeaderComponent,
        PLClientDetailsComponent,
        PLClientDocumentsComponent,
        PLClientProvidersComponent,
        PLClientReportsComponent,
        PLClientRecordsListComponent,
        PLClientServicesComponent,
        PLClientIEPTabComponent,
        PLClientIEPFormComponent,
        PLClientIEPItemComponent,
        PLClientIEPServiceAreaComponent,
        PLClientIEPGoalItemComponent,
        PLGoalStatusComponent,
        PLClientIEPMetricItemComponent,
        PLClientEndIEPGoalStatusComponent,
        PLClientEndIEPExitStatusComponent,
        PLClientIEPTestApiComponent,
        PLClientGoalStatusHelpComponent,
        PLClientContactEnableSMSComponent,
        PLClientContactsComponent,
        PLClientConvertedReferralListComponent,
        PLClientChangeLocationComponent,
        PLClientProfileComponent,
        PLClientProfileSaveComponent,
        PLClientDirectReferralComponent,
        PLClientDirectServiceComponent,
        PLClientDirectServicesComponent,
        PLClientEvaluationComponent,
        PLClientEvaluationReassignComponent,
        PLClientEvaluationsComponent,
        PLClientMetricsComponent,
        PLClientMetricSaveComponent,
        PLClientNomsComponent,
        PLClientNomSaveComponent,
        PLClientContactEnableLoginComponent,
        PLRecordCapturesThumbnailsComponent,
        PLClientServicesExpandableRowComponent,
    ],
    providers: [
        PLClientService,
        PLClientContactsService,
        PLClientServicesService,
    ],
    entryComponents: [
        PLClientEvaluationReassignComponent,
        PLClientGoalStatusHelpComponent,
        PLAssessmentCaseManagerModalComponent,
    ],
})
export class PLClientsModule {}
