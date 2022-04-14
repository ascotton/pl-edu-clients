import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
    PLDotLoaderModule,
    PLIconModule,
    PLInputModule,
    PLTableModule,
    PLTableFrameworkModule,
    PLToastModule,
    PLModalModule,
    PLTabsModule,
    PLLinkModule,
    PLButtonModule,
} from '@root/index';
import { PLPermissionsModule } from '../permissions';

import { PLUsersComponent } from './pl-users/pl-users.component';
import { PLUserEditComponent } from './pl-user-edit/pl-user-edit.component';
import { PLUserViewComponent } from './pl-user-view/pl-user-view.component'

import { PLUserService } from './pl-user.service';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        PLDotLoaderModule,
        PLIconModule,
        PLInputModule,
        PLTableModule,
        PLTableFrameworkModule,
        PLToastModule,
        PLModalModule,
        PLTabsModule,
        PLLinkModule,
        PLButtonModule,
        PLPermissionsModule,
    ],
    exports: [PLUsersComponent],
    declarations: [
        PLUsersComponent,
        PLUserEditComponent,
        PLUserViewComponent,
    ],
    providers: [PLUserService],
})
export class PLUsersModule {}
