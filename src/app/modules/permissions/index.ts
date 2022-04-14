import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
    PLDotLoaderModule,
    PLButtonModule,
    PLIconModule,
    PLInputModule,
    PLTableModule,
    PLTableFrameworkModule,
    PLToastModule,
    PLLodashService,
    PLModalModule,
    PLTabsModule,
} from "@root/index";

import { PLPermissionsDeniedComponent } from "./pl-permissions-denied/pl-permissions-denied.component";

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        PLButtonModule,
        PLDotLoaderModule,
        PLIconModule,
        PLInputModule,
        PLTableModule,
        PLTableFrameworkModule,
        PLToastModule,
        PLModalModule,
        PLTabsModule
    ],
    exports: [PLPermissionsDeniedComponent],
    declarations: [PLPermissionsDeniedComponent],
    providers: [PLLodashService],
})
export class PLPermissionsModule {}
