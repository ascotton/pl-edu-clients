import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PreviewBillingsResolver } from '@common/resolvers';
// Components
import { UserAuthGuardService } from '../user/user-auth-guard.service';
import { PLBillingPreviewContainerComponent } from './preview/pl-billing-preview-container/pl-billing-preview-container.component';
import { PLBillingTabsComponent } from './pl-billing-tabs/pl-billing-tabs.component';
import { PLBillingsComponent } from './pl-billings/pl-billings.component';
import { PLAmendmentsComponent } from './pl-amendments/pl-amendments.component';

const SUFIX = '- Billing';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: PLBillingTabsComponent,
                canActivate: [UserAuthGuardService],
                resolve: { billing: PreviewBillingsResolver },
                children: [
                    { path: '', pathMatch: 'full', redirectTo: 'billings' },
                    { path: 'invoices', pathMatch: 'full', redirectTo: 'billings' },

                    {
                        path: 'billings',
                        component: PLBillingsComponent,
                        data: { title: `Billings ${SUFIX}` },
                    },
                    {
                        path: 'view-amendments',
                        component: PLAmendmentsComponent,
                        data: { title: `Amendments ${SUFIX}` },
                    },

                    {
                        path: 'invoice',
                        component: PLBillingPreviewContainerComponent,
                        data: { title: `Invoice Preview ${SUFIX}` },
                    },
                    {
                        path: 'invoice/:id',
                        component: PLBillingPreviewContainerComponent,
                        data: { title: `Invoice Detail ${SUFIX}` },
                    },

                    {
                        path: 'timesheet-detail',
                        component: PLBillingPreviewContainerComponent,
                        data: { title: `Timesheet Preview ${SUFIX}` },
                    },
                    {
                        path: 'timesheet-detail/:id',
                        component: PLBillingPreviewContainerComponent,
                        data: { title: `Timesheet Detail ${SUFIX}` },
                    },
                ],
            },
        ])],
    exports: [
        RouterModule,
    ],
    providers: [
        UserAuthGuardService,
    ],
})
export class PLBillingRoutingModule { }
