import { NgModule }     from '@angular/core';
import { RouterModule } from '@angular/router';

import { PLOrganizationAvailabilityComponent } from './pl-organization-availability/pl-organization-availability.component';
import { PLOrganizationComponent } from './pl-organization/pl-organization.component';
import { PLOrganizationContactsComponent } from './pl-organization-contacts/pl-organization-contacts.component';
import { PLOrganizationHandbookComponent } from './pl-organization-handbook/pl-organization-handbook.component';
import { PLOrganizationDocumentsComponent } from './pl-organization-documents/pl-organization-documents.component';
import { PLOrganizationOverviewComponent } from './pl-organization-overview/pl-organization-overview.component';
import { PLOrganizationProvidersComponent } from './pl-organization-providers/pl-organization-providers.component';
import { PLOrganizationClientsComponent } from './pl-organization-clients/pl-organization-clients.component';
import { PLOrganizationsListComponent } from './pl-organizations-list/pl-organizations-list.component';
import { PLOrganizationAssessmentsComponent } from './pl-organization-assessments/pl-organization-assessments.component';

import { CanDeactivateGuard } from '@common/can-deactivate-guard.service';
import { ROUTING } from '@common/constants';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: 'list',
                component: PLOrganizationsListComponent,
                data: { title: 'Organizations - Locations' },
            },
            {
                path: ':id',
                component: PLOrganizationComponent,
                children: [
                    { path: '', redirectTo: 'overview', pathMatch: 'full' },
                    {
                        path: 'clients',
                        component: PLOrganizationClientsComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'overview',
                        component: PLOrganizationOverviewComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'contacts',
                        component: PLOrganizationContactsComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'documents',
                        component: PLOrganizationDocumentsComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'handbook',
                        component: PLOrganizationHandbookComponent,
                        canDeactivate: [CanDeactivateGuard],
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'providers',
                        component: PLOrganizationProvidersComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'availability',
                        component: PLOrganizationAvailabilityComponent,
                        canDeactivate: [CanDeactivateGuard],
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'assessments',
                        component: PLOrganizationAssessmentsComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                ],
            },
        ]),
    ],
    providers: [
        CanDeactivateGuard,
    ],
    exports: [
        RouterModule,
    ],
})
export class PLOrganizationsRoutingModule {}
