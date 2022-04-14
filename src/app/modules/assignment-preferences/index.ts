import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import {
    PLButtonModule,
    PLDotLoaderModule,
    PLIconModule,
    PLInputModule,
} from '@root/index';

import { PLAssignmentPreferencesComponent } from './pl-assignment-preferences/pl-assignment-preferences.component';
import { PLIntentToReturnComponent } from './pl-intent-to-return/pl-intent-to-return.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        PLButtonModule,
        PLDotLoaderModule,
        PLIconModule,
        PLInputModule,
    ],
    exports: [
        PLAssignmentPreferencesComponent,
        PLIntentToReturnComponent,
    ],
    declarations: [
        PLAssignmentPreferencesComponent,
        PLIntentToReturnComponent,
    ],
    providers: [],
})
export class PLAssignmentPreferencesModule { }
