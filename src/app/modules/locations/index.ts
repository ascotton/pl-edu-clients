import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartsModule } from 'ng2-charts';
import {
    PLModalModule,
    PLDotLoaderModule,
    PLIconModule,
    PLInputModule,
    PLLodashService,
    PLButtonModule,
    PLVaryDisplayModule,
    PLTableFrameworkModule,
    PLTabsModule,
    PLTableModule,
} from '@root/index';
import { PLCommonModule } from '@common/index';

import { PLPermissionsModule } from '../permissions';
import { PLHandbookModule } from '../handbook';
import { PLDocumentsModule } from '../documents';
import { PLReportsModule } from '../reports';
import { PLAccountModule } from '../accounts';

import { PLLocationsListComponent } from './pl-locations-list/pl-locations-list.component';
import { PLLocationComponent } from './pl-location/pl-location.component';
import {
    PLLocationSchedulerComponent,
    PLMasterScheduleComponent,
    PLStudentScheduleEditorComponent,
    PLReferralProviderChangeModalComponent,
    PLMasterScheduleReferralsComponent,
} from './pl-location-scheduler';
import { PLLocationsRoutingModule } from './routings/locations.routing.module';
import { PLLocationService } from './pl-location.service';
import { PLLocationAppointmentsComponent } from './pl-location-appointments/pl-location-appointments.component';
import { PLLocationClientsComponent } from './pl-location-clients/pl-location-clients.component';
import { PLLocationDocumentsComponent } from './pl-location-documents/pl-location-documents.component';
import { PLLocationHandbookComponent } from './pl-location-handbook/pl-location-handbook.component';
import { PLLocationAvailabilityComponent } from './pl-location-availability/pl-location-availability.component';
import { PLLocationOverviewComponent } from './pl-location-overview/pl-location-overview.component';
import { PLLocationProfileHeaderComponent } from './pl-location-profile-header/pl-location-profile-header.component';
import { PLLocationProvidersComponent } from './pl-location-providers/pl-location-providers.component';
import { PLLocationContactsComponent } from './pl-location-contacts/pl-location-contacts.component';
import { PLLocationReportsComponent } from './pl-location-reports/pl-location-reports.component';
import { PLLocationAssessmentsComponent } from './pl-location-assessments/pl-location-assessments.component';
import { PLAssessmentCaseManagerModalComponent } from '../client-assessments/pl-assessment-case-manager-modal/pl-assessment-case-manager-modal.component';
import { PLClientAssessmentsModule } from '../client-assessments';
import { PLClientServicesService } from '../clients/pl-client-services.service';
import { PLClientContactsService } from '../clients/pl-client-contacts.service';

@NgModule({
    imports: [
        CommonModule,
        MatTooltipModule,
        PLDotLoaderModule,
        PLCommonModule,
        PLIconModule,
        PLInputModule,
        PLButtonModule,
        ChartsModule,
        PLVaryDisplayModule,
        PLTableFrameworkModule,
        PLTabsModule,
        PLTableModule,
        PLModalModule,
        PLPermissionsModule,
        PLDocumentsModule,
        PLReportsModule,
        PLPermissionsModule,
        PLHandbookModule,
        PLDocumentsModule,
        PLReportsModule,
        PLLocationsRoutingModule,
        PLAccountModule,
        PLClientAssessmentsModule,
    ],
    exports: [
        PLLocationsListComponent,
        PLLocationComponent,
        PLLocationAppointmentsComponent,
        PLLocationClientsComponent,
        PLLocationOverviewComponent,
        PLLocationProfileHeaderComponent,
        PLLocationProvidersComponent,
        PLLocationContactsComponent,
        PLLocationReportsComponent,
        PLLocationDocumentsComponent,
        PLLocationHandbookComponent,
        PLLocationAvailabilityComponent,
    ],
    declarations: [
        PLLocationsListComponent,
        PLLocationComponent,
        PLLocationAppointmentsComponent,
        PLLocationClientsComponent,
        PLLocationOverviewComponent,
        PLLocationProfileHeaderComponent,
        PLLocationProvidersComponent,
        PLLocationContactsComponent,
        PLLocationReportsComponent,
        PLLocationDocumentsComponent,
        PLLocationHandbookComponent,
        PLLocationSchedulerComponent,
        PLMasterScheduleComponent,
        PLLocationAvailabilityComponent,
        PLStudentScheduleEditorComponent,
        PLReferralProviderChangeModalComponent,
        PLMasterScheduleReferralsComponent,
        PLLocationAssessmentsComponent,
    ],
    providers: [
        PLLodashService,
        PLLocationService,
        PLClientServicesService,
        PLClientContactsService,
    ],
    entryComponents: [
        PLStudentScheduleEditorComponent,
        PLReferralProviderChangeModalComponent,
        PLAssessmentCaseManagerModalComponent,
    ],
})
export class PLLocationsModule {}
