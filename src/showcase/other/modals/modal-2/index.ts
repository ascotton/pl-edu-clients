import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PLModalModule } from '@root/index';
import { Modal2Component } from './modal-2.component';

@NgModule({
    imports: [CommonModule, PLModalModule],
    exports: [Modal2Component],
    declarations: [Modal2Component],
})
export class Modal2Module {
    static forRoot(): ModuleWithProviders<Modal2Module> {
        return {
            ngModule: Modal2Module,
            providers: [],
        };
    }
}
