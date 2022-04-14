import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
// Guards
import { UserAuthGuardService } from '../user/user-auth-guard.service';
// Components
import {
    PLCalendarContainerComponent,
} from './components';
// Resolvers
import {
    ProviderResolver,
    BillingCodesResolver,
    PreviewBillingsResolver,
} from '@common/resolvers';
import * as resolvers from './resolvers';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'calendar',
            },
            {
                path: 'calendar',
                component: PLCalendarContainerComponent,
                canActivate: [UserAuthGuardService],
                // For some reason using destructuring doesn't "load" resolvers
                resolve: {
                    provider: ProviderResolver,
                    billingCodes: BillingCodesResolver,
                    caseload: resolvers.CaseloadResolver,
                    invoicePreview: PreviewBillingsResolver,
                    amendmentDate: resolvers.AmendmentDateResolver,
                    documentationAssistantLoaded: resolvers.DocumentationAssistantDataResolver,
                },
                data: { title: 'Calendar - Schedule', fullWidth: true },
            },
            {
                path: 'calendar/:provider',
                component: PLCalendarContainerComponent,
                canActivate: [UserAuthGuardService],
                resolve: {
                    caseload: resolvers.CaseloadResolver,
                    billingCodes: BillingCodesResolver,
                    provider: ProviderResolver,
                },
                data: { title: 'Calendar - Schedule', fullWidth: true },
            },
        ]),
    ],
    exports: [
        RouterModule,
    ],
    providers: [
        UserAuthGuardService,
        resolvers.NotesSchemasResolver,
        resolvers.EvaluationsResolver,
        resolvers.LocationsResolver,
        resolvers.CaseloadResolver,
        resolvers.DocumentationAssistantDataResolver,
        resolvers.AmendmentDateResolver,
    ],
})
export class PLScheduleRoutingModule { }
