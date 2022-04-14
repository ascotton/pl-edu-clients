import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
} from '@root/index';

import { PLInactiveComponent } from './pl-inactive/pl-inactive.component';
import { PLInactiveService } from './pl-inactive/pl-inactive.service';

@NgModule({
    imports: [
        CommonModule,
    ],
    exports: [
        PLInactiveComponent,
    ],
    declarations: [
        PLInactiveComponent,
    ],
    providers: [
        PLInactiveService,
    ],
})
export class PLUserModule {}

export { PLInactiveComponent } from './pl-inactive/pl-inactive.component';
export { PLInactiveService } from './pl-inactive/pl-inactive.service';
