import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import {
  PLDotLoaderModule, PLIconModule, PLInputModule, PLButtonModule
} from "@root/index";
import { PLPermissionsModule } from '../permissions';
import { PLCommonModule } from '@common/index';

import { PLDemoEventBus0 } from './demo-event-bus/demo-event-bus-0.component';
import { PLDemoEventBus1 } from './demo-event-bus/demo-event-bus-1.component';
import { PLDemoEventBus2 } from './demo-event-bus/demo-event-bus-2.component';
import { PLDemoEventBus3 } from './demo-event-bus/demo-event-bus-3.component';
import { PLDemoEventBus4 } from './demo-event-bus/pl-demo-event-bus-4.component';
import { PLDemoEventBus5 } from './demo-event-bus/pl-demo-event-bus-5.component';
import { PLDemoEventBus6 } from './demo-event-bus/pl-demo-event-bus-6.component';
import { PLDemoEventBus7 } from './demo-event-bus/pl-demo-event-bus-7.component';

@NgModule({
  imports: [
    CommonModule, RouterModule, PLDotLoaderModule, PLCommonModule,
    PLIconModule, PLInputModule, PLButtonModule, PLPermissionsModule,
  ],
  declarations: [
    PLDemoEventBus0, PLDemoEventBus1, PLDemoEventBus2,
    PLDemoEventBus3, PLDemoEventBus4, PLDemoEventBus5,
    PLDemoEventBus6, PLDemoEventBus7,
  ],
})
export class PLDemosModule {
}
