import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PLIconModule } from '@root/index';

import { PLLiveagentModule } from '@root/index';

import { PLLiveagentPrechatPageComponent } from
    "./pl-liveagent-prechat-page/pl-liveagent-prechat-page.component";
import { PLLiveagentPostchatPageComponent } from
    "./pl-liveagent-postchat-page/pl-liveagent-postchat-page.component";

@NgModule({
    imports: [
        CommonModule,
        PLIconModule,
        PLLiveagentModule,
    ],
    exports: [
        PLLiveagentPrechatPageComponent,
        PLLiveagentPostchatPageComponent,
    ],
    declarations: [
        PLLiveagentPrechatPageComponent,
        PLLiveagentPostchatPageComponent,
    ],
    providers: [
    ],
})
export class PLLiveagentPagesModule {}
