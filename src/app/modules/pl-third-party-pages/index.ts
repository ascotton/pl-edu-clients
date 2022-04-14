import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PLIconModule } from '@root/index';

import { PLFormAssemblyPageComponent } from
    './pl-form-assembly-page/pl-form-assembly-page.component';

@NgModule({
    imports: [
        CommonModule,
        PLIconModule,
    ],
    exports: [
        PLFormAssemblyPageComponent,
    ],
    declarations: [
        PLFormAssemblyPageComponent,
    ],
    providers: [
    ],
})
export class PLThirdPartyPagesModule {}
