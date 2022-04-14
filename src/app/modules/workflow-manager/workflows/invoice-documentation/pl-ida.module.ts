import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { PLCommonModule } from '@app/common';
import { PreviewInvoiceResolver } from '@common/resolvers';
import {
    PLDotLoaderModule,
    PLInputModule,
    PLButtonModule,
    PLIconModule,
} from '@root/index';

import {
    PLInvoiceDocumentationService,
    PLInvoiceDocumentationViewComponent,
    PLInvoiceDocumentationListComponent,
    PLInvoiceDocumentationDetailComponent,
    PLInvoiceDocumentationReadOnlyComponent,
    PLStandaloneDocumentationContainerComponent,
 } from './index';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        PLCommonModule,
        PLDotLoaderModule,
        PLButtonModule,
        PLInputModule,
        PLIconModule,
        NgProgressModule,
        NgxJsonViewerModule,
        RouterModule.forChild([{
            path: '',
            pathMatch: 'full',
            component: PLInvoiceDocumentationViewComponent,
            resolve: {
                invoice: PreviewInvoiceResolver,
            },
            data: { title: 'Documentation Assistant' },
        }]),
    ],
    exports: [
        PLInvoiceDocumentationViewComponent,
        PLInvoiceDocumentationListComponent,
        PLInvoiceDocumentationDetailComponent,
        PLInvoiceDocumentationReadOnlyComponent,
        PLStandaloneDocumentationContainerComponent,
    ],
    declarations: [
        PLInvoiceDocumentationViewComponent,
        PLInvoiceDocumentationListComponent,
        PLInvoiceDocumentationDetailComponent,
        PLInvoiceDocumentationReadOnlyComponent,
        PLStandaloneDocumentationContainerComponent,
    ],
    providers: [
        PreviewInvoiceResolver,
        PLInvoiceDocumentationService,
    ],
    entryComponents: [
        PLStandaloneDocumentationContainerComponent,
    ],
})
export class PLIDAModule { }
