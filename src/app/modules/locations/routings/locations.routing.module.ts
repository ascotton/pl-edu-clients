import { NgModule }     from '@angular/core';
import { RouterModule } from '@angular/router';
// Services
import * as services from '../services';
// Guards
import * as guards from './guards';
import { CanDeactivateGuard } from '@common/can-deactivate-guard.service';
// Resolvers
import * as commonResolvers from '@common/resolvers';
import * as resolvers from './resolvers';
// Store
import { PLLocationStoreModule } from '../store';
import { PLCommonStoreModule } from '@common/store';
// Components
import { PLLocationComponent } from '../pl-location/pl-location.component';
import { PLLocationSchedulerComponent } from '../pl-location-scheduler';
import { PLLocationAppointmentsComponent } from '../pl-location-appointments/pl-location-appointments.component';
import { PLLocationReportsComponent } from '../pl-location-reports/pl-location-reports.component';
import { PLLocationClientsComponent } from '../pl-location-clients/pl-location-clients.component';
import { PLLocationProvidersComponent } from '../pl-location-providers/pl-location-providers.component';
import { PLLocationContactsComponent } from '../pl-location-contacts/pl-location-contacts.component';
import { PLLocationOverviewComponent } from '../pl-location-overview/pl-location-overview.component';
import { PLLocationDocumentsComponent } from '../pl-location-documents/pl-location-documents.component';
import { PLLocationHandbookComponent } from '../pl-location-handbook/pl-location-handbook.component';
import { PLLocationAvailabilityComponent } from '../pl-location-availability/pl-location-availability.component';
import { PLLocationsListComponent } from '../pl-locations-list/pl-locations-list.component';
import { PLLocationAssessmentsComponent } from '../pl-location-assessments/pl-location-assessments.component';
import { ROUTING } from '@common/constants';
import { CurrentUserResolver } from '@common/resolvers';


@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', pathMatch: 'full', redirectTo: 'list' },
            {
                path: 'list',
                component: PLLocationsListComponent,
                data: { title: 'Locations - Locations' },
            },
            {
                path: ':id',
                component: PLLocationComponent,
                resolve: { user: CurrentUserResolver },
                data: { title: 'SKIPHISTORY' },
                children: [
                    { path: '', redirectTo: 'overview', pathMatch: 'full' },
                    {
                        path: 'appointments',
                        component: PLLocationAppointmentsComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'reports',
                        component: PLLocationReportsComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'clients',
                        component: PLLocationClientsComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'providers',
                        component: PLLocationProvidersComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'contacts',
                        component: PLLocationContactsComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'overview',
                        component: PLLocationOverviewComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'scheduler',
                        data: { fullWidth: true, title: ROUTING.DYNAMIC },
                        resolve: {
                            user: commonResolvers.CurrentUserResolver,
                            schoolYears: commonResolvers.SchoolYearsResolver,
                            providerTypes: commonResolvers.ProviderTypesResolver,
                            providers: resolvers.LocationProvidersResolver,
                            locationLoaded: resolvers.LocationResolver,
                            locationsAssigned: commonResolvers.AssignedLocationsResolver,
                            locationScheduleLoaded: resolvers.LocationSessionsResolver,
                            locationAvailabilityLoaded: resolvers.LocationAvailabilityResolver,
                            permisions: resolvers.LocationSchedulerPermisionsResolver,
                        },
                        component: PLLocationSchedulerComponent,
                        canActivate: [
                            // PLFeatureFlagRouterService,
                            guards.PLLocationSchedulerProviderViewGuard,
                        ],
                    },
                    {
                        path: 'documents',
                        component: PLLocationDocumentsComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'handbook',
                        component: PLLocationHandbookComponent,
                        canDeactivate: [CanDeactivateGuard],
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'availability',
                        component: PLLocationAvailabilityComponent,
                        canDeactivate: [CanDeactivateGuard],
                        data: { title: ROUTING.DYNAMIC },
                    },
                    {
                        path: 'assessments',
                        component: PLLocationAssessmentsComponent,
                        data: { title: ROUTING.DYNAMIC },
                    },
                ],
            },
        ]),
        PLLocationStoreModule,
        PLCommonStoreModule,
    ],
    exports: [
        RouterModule,
        PLLocationStoreModule,
    ],
    providers: [
        // API Services
        services.PLLocationService2,
        services.PLMasterSchedulerService,
        services.PLLocationSchedulerService,
        services.PLProviderAvailabilityService,
        // Guards
        CanDeactivateGuard,
        guards.PLLocationSchedulerProviderViewGuard,
        // Resolvers
        resolvers.LocationResolver,
        resolvers.LocationSessionsResolver,
        resolvers.LocationProvidersResolver,
        resolvers.LocationAvailabilityResolver,
        resolvers.LocationSchedulerPermisionsResolver,
    ],
})
export class PLLocationsRoutingModule { }
