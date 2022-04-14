import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PLInputModule, PLIconModule, PLModalModule, PLClosablePageHeaderModule, PLStepsModule,
         PLDotLoaderModule, PLTableModule, PLTableFrameworkModule,} from '@root/index';

import { PLCommonModule } from '@common/index';
import { CanDeactivateGuard } from '@common/can-deactivate-guard.service';

import { PLClientMergeComponent } from './pl-client-merge.component';
import { PLMergeTipsComponent } from './pl-merge-tips/pl-merge-tips.component';
import { PLSelectClientsComponent } from './pl-select-clients/pl-select-clients.component';
import { PLCompareClientsComponent } from './pl-compare-clients/pl-compare-clients.component';
import { PLConfirmClientsComponent } from './pl-confirm-clients/pl-confirm-clients.component';
import { PLMergeCompleteComponent } from './pl-merge-complete/pl-merge-complete.component';


import { PLClientMergeService } from './pl-client-merge.service';
import { PLClientMergePermissionsService } from './pl-client-merge-permissions.service';
import { PLSelectClientsTableService } from './pl-select-clients/pl-select-clients-table.service';
import { PLCompareClientsService } from './pl-compare-clients/pl-compare-clients.service';

@NgModule({
    imports: [
        CommonModule, 
        RouterModule.forChild([{
            path: '',
            component: PLClientMergeComponent,
            canDeactivate: [CanDeactivateGuard],
            data: { title: 'Client Merge' },
            children: [
                { path: '', redirectTo: 'select-clients', pathMatch: 'full' },
                { path: 'select-clients', component: PLSelectClientsComponent },
                { path: 'compare-clients', component: PLCompareClientsComponent },
                { path: 'confirm', component: PLConfirmClientsComponent },
                { path: 'complete', component: PLMergeCompleteComponent },
            ],
        }]), 
        PLInputModule, 
        PLIconModule, 
        PLModalModule, 
        PLTableModule,
        PLTableFrameworkModule, 
        PLClosablePageHeaderModule, 
        PLStepsModule, 
        PLDotLoaderModule, 
        PLCommonModule
    ],

    exports: [
        PLClientMergeComponent, 
        PLMergeTipsComponent, 
        PLSelectClientsComponent, 
        PLCompareClientsComponent,
        PLConfirmClientsComponent, 
        PLMergeCompleteComponent,
    ],

    declarations: [
        PLClientMergeComponent, 
        PLMergeTipsComponent, 
        PLSelectClientsComponent, 
        PLCompareClientsComponent,
        PLConfirmClientsComponent, 
        PLMergeCompleteComponent
    ],
    entryComponents: [PLMergeTipsComponent],
    providers: [
        PLClientMergeService, 
        PLClientMergePermissionsService, 
        PLSelectClientsTableService,
        PLCompareClientsService
    ],
})
export class PLClientMergeModule {
    static forRoot(): ModuleWithProviders<PLClientMergeModule> {
        return {
            ngModule: PLClientMergeModule,
            providers: [
                PLClientMergeService, 
                PLClientMergePermissionsService, 
                PLSelectClientsTableService,
                PLCompareClientsService],
        };
    }
}