import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
    PLIconModule,
    PLDialogModule,
    PLProgressModule,
} from '@root/index';

import { PLDownloadsComponent } from './pl-downloads/pl-downloads.component';

@NgModule({
    imports: [
        CommonModule,
        PLIconModule,
        PLDialogModule,
        PLProgressModule,
    ],
    declarations: [
        PLDownloadsComponent,
    ],
    exports: [
        PLDownloadsComponent,
    ],
})
export class PLDownloadsModule {}

export { PLDownloadsComponent };
export { PLDownloadItem } from '@common/interfaces';
