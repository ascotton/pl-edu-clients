import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// PL Componets
import { PLDotLoaderModule, PLInputModule, PLButtonModule, PLIconModule } from '@root/index';

import { PLSearchStoreModule } from './store/search.store.module';
import { PLGlobalSearchComponent } from './components/pl-global-search/pl-global-search.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        PLSearchStoreModule,
        PLInputModule,
        PLIconModule,
        PLButtonModule,
    ],
    declarations: [
        PLGlobalSearchComponent,
    ],
    exports: [
        PLGlobalSearchComponent,
    ],
})
export class PLSearchModule { }
