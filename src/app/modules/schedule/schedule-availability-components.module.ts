import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

import {
    PLDotLoaderModule,
    PLIconModule,
    PLInputModule,
    PLTabsModule,
    PLButtonModule,
} from '@root/index';

import { PLCommonModule } from  '@common/index';

import { PLAvailabilityViewComponent } from
    './availability/pl-availability-view.component';

@NgModule({
    imports: [
        CommonModule,
        PLDotLoaderModule,
        PLCommonModule,
        PLIconModule,
        PLInputModule,
        PLButtonModule,
        PLTabsModule,
        NgxJsonViewerModule,
    ],
    exports: [
        PLAvailabilityViewComponent,
    ],
    declarations: [
        PLAvailabilityViewComponent,
    ],
    providers: [],
})
export class PLScheduleAvailabilityComponentsModule {
}
