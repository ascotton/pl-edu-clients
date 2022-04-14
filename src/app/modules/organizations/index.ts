import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
    PLIconModule,
    PLInputModule,
    PLTabsModule,
    PLTableModule,
    PLTableFrameworkModule,
    PLDotLoaderModule,
} from '@root/index';

import { PLHandbookModule } from '../handbook';
import { PLDocumentsModule } from '../documents';
import { PLCommonModule } from '@common/index';
import { PLPermissionsModule } from '../permissions';
import { PLAccountModule } from '../accounts';
import { PLOrganizationAvailabilityComponent } from './pl-organization-availability/pl-organization-availability.component';

import { PLOrganizationComponent } from './pl-organization/pl-organization.component';
import { PLOrganizationContactsComponent } from './pl-organization-contacts/pl-organization-contacts.component';
import { PLOrganizationHandbookComponent } from './pl-organization-handbook/pl-organization-handbook.component';
import { PLOrganizationDocumentsComponent } from './pl-organization-documents/pl-organization-documents.component';
import { PLOrganizationOverviewComponent } from './pl-organization-overview/pl-organization-overview.component';
import { PLOrganizationProvidersComponent } from './pl-organization-providers/pl-organization-providers.component';
import { PLOrganizationClientsComponent } from './pl-organization-clients/pl-organization-clients.component';
import {
    PLOrganizationProfileHeaderComponent,
} from './pl-organization-profile-header/pl-organization-profile-header.component';
import { PLOrganizationsService } from './pl-organizations.service';
import { PLOrganizationsListComponent } from './pl-organizations-list/pl-organizations-list.component';
import { PLOrganizationsRoutingModule } from './organizations.routing.module';
import { PLClientContactsService } from '../clients/pl-client-contacts.service';
import { PLClientServicesService } from '../clients/pl-client-services.service';
import { PLAssessmentCaseManagerModalComponent } from '../client-assessments/pl-assessment-case-manager-modal/pl-assessment-case-manager-modal.component';
import { PLClientAssessmentsModule } from '../client-assessments';
import { PLOrganizationAssessmentsComponent } from './pl-organization-assessments/pl-organization-assessments.component';

@NgModule({
    imports: [
        CommonModule,
        PLOrganizationsRoutingModule,
        PLCommonModule,
        PLIconModule,
        PLInputModule,
        PLPermissionsModule,
        PLTabsModule,
        PLTableModule,
        PLTableFrameworkModule,
        PLDotLoaderModule,
        PLAccountModule,
        PLHandbookModule,
        PLDocumentsModule,
        PLClientAssessmentsModule,
    ],
    exports: [
        PLOrganizationComponent,
        PLOrganizationsListComponent,
    ],
    declarations: [
        PLOrganizationComponent,
        PLOrganizationAvailabilityComponent,
        PLOrganizationContactsComponent,
        PLOrganizationDocumentsComponent,
        PLOrganizationHandbookComponent,
        PLOrganizationOverviewComponent,
        PLOrganizationProvidersComponent,
        PLOrganizationProfileHeaderComponent,
        PLOrganizationClientsComponent,
        PLOrganizationsListComponent,
        PLOrganizationAssessmentsComponent,
    ],
    providers: [
        PLOrganizationsService,
        PLClientServicesService,
        PLClientContactsService,
    ],
    entryComponents: [
        PLAssessmentCaseManagerModalComponent,
    ],
})
export class PLOrganizationsModule {}
