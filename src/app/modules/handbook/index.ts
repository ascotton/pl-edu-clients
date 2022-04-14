import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PLDotLoaderModule, PLIconModule, PLModalModule, PLButtonModule } from '@root/index';
import { EditorModule } from '@tinymce/tinymce-angular';

import { PLHandbookContentsComponent } from './pl-handbook-contents/pl-handbook-contents.component';
import { PLHandbookTextEditorComponent } from './pl-handbook-text-editor/pl-handbook-text-editor.component';
import { PLHandbookModalComponent } from './pl-handbook-modal/pl-handbook-modal.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        PLDotLoaderModule,
        PLIconModule,
        PLModalModule,
        PLButtonModule,
        EditorModule,
    ],
    exports: [
        PLHandbookContentsComponent,
        PLHandbookTextEditorComponent,
        PLHandbookModalComponent,
    ],
    declarations: [
        PLHandbookContentsComponent,
        PLHandbookTextEditorComponent,
        PLHandbookModalComponent,
    ],
    entryComponents: [
        PLHandbookModalComponent,
    ],
    providers: [],
})

export class PLHandbookModule { }
