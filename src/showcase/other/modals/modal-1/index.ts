import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
    PLModalModule,
    PLIconModule,
    PLInputModule,
} from '@root/index';

import { Modal1Component } from './modal-1.component';

@NgModule({
    imports: [CommonModule, PLModalModule, PLIconModule, PLInputModule],
    exports: [Modal1Component],
    declarations: [Modal1Component],
})
export class Modal1Module {
    static forRoot(): ModuleWithProviders<Modal1Module> {
        return {
            ngModule: Modal1Module,
            providers: [],
        };
    }
}
