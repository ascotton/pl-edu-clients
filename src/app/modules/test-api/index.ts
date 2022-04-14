import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { NgxJsonViewerModule } from 'ngx-json-viewer';

import { BasicTestAPIComponent } from './basic-test-api.component';
import { StreamTestAPIComponent } from './stream-test-api.component';

@NgModule({
    imports: [
        CommonModule,
        NgxJsonViewerModule,
    ],
    exports: [
        BasicTestAPIComponent,
        StreamTestAPIComponent,
    ],
    declarations: [
        BasicTestAPIComponent,
        StreamTestAPIComponent,
    ],
})
export class PLTestApiModule { }
