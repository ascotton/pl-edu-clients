import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
    PLButtonModule,
    PLDotLoaderModule,
    PLIconModule,
    PLInputModule,
    PLTableModule,
    PLTableFrameworkModule,
    PLToastModule,
    PLLodashService,
    PLModalModule,
    PLTabsModule,
} from '@root/index';

import { PLCommonModule } from  '@common/index';

import { PLClientReferralManagerComponent } from './pl-client-referral-manager/pl-client-referral-manager.component';
import { PLClientReferralsProposeMatchesComponent } from './pl-client-referrals-propose-matches/pl-client-referrals-propose-matches.component';
import { PLClientReferralOpenComponent } from './pl-client-referral-open/pl-client-referral-open.component';
import { PLClientReferralsComponent } from './pl-client-referrals/pl-client-referrals.component';
import { PLClientReferralsService } from './pl-client-referrals.service';
import { PLReferralsService } from './pl-referrals.service';
import { PLReferralCyclesModalComponent } from './pl-referral-cycles-modal/pl-referral-cycles-modal.component';
import { PlClientReferralUnmatchComponent } from './pl-client-referral-unmatch/pl-client-referral-unmatch.component';
import { PLClientReferralReassignComponent } from './pl-client-referral-reassign/pl-client-referral-reassign.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        PLButtonModule,
        PLDotLoaderModule,
        PLIconModule,
        PLInputModule,
        PLTableModule,
        PLTableFrameworkModule,
        PLToastModule,
        PLModalModule,
        PLTabsModule,
        PLCommonModule,
    ],
    exports: [
        PLClientReferralManagerComponent,
        PLClientReferralOpenComponent,
        PLClientReferralsComponent,
    ],
    declarations: [
        PLClientReferralsComponent,
        PLClientReferralOpenComponent,
        PLReferralCyclesModalComponent,
        PlClientReferralUnmatchComponent,
        PLClientReferralManagerComponent,
        PLClientReferralsProposeMatchesComponent,
        PLClientReferralReassignComponent,
    ],
    providers: [
        PLLodashService,
        PLClientReferralsService,
        PLReferralsService,
    ],
    entryComponents: [
        PLReferralCyclesModalComponent,
        PlClientReferralUnmatchComponent,
        PLClientReferralsProposeMatchesComponent,
        PLClientReferralReassignComponent,
    ],
})
export class PLClientReferralsModule {
    static forRoot(): ModuleWithProviders<PLClientReferralsModule> {
        return {
            ngModule: PLClientReferralsModule,
            providers: [
                PLClientReferralsService,
                PLReferralsService,
            ],
        };
    }
}
