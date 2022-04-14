import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {PLDotLoaderModule, PLHttpModule, PLIconModule, PLInputModule,
 PLTableModule, PLTableFrameworkModule, PLToastModule,
 PLApiDocumentTypesService, PLApiServiceDocumentsService } from '@root/index';

import { PLDocumentsComponent } from './pl-documents/pl-documents.component';
import { PLDocumentUploadComponent } from './pl-document-upload/pl-document-upload.component';

import { PLAccountDocumentsComponent } from './pl-account-documents/pl-account-documents.component';
import { PLAccountDocumentUploadComponent } from './pl-account-document-upload/pl-account-document-upload.component';

@NgModule({
    imports: [CommonModule, FormsModule, ReactiveFormsModule, PLDotLoaderModule, PLHttpModule,
        PLIconModule, PLInputModule, PLTableModule, PLTableFrameworkModule, PLToastModule],
    exports: [PLDocumentsComponent, PLDocumentUploadComponent,
        PLAccountDocumentsComponent, PLAccountDocumentUploadComponent],
    declarations: [PLDocumentsComponent, PLDocumentUploadComponent,
        PLAccountDocumentsComponent, PLAccountDocumentUploadComponent],
    providers: [PLApiDocumentTypesService, PLApiServiceDocumentsService],
})
export class PLDocumentsModule {}
