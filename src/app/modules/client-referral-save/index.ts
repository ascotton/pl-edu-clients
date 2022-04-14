import { NgModule } from '@angular/core';
import { PLModalModule } from '@root/index';
import { PLClientReferralSaveModalComponent } from './pl-client-referral-save-modal/pl-client-referral-save-modal.component';

@NgModule({
    imports: [PLModalModule],
    exports: [PLClientReferralSaveModalComponent],
    declarations: [PLClientReferralSaveModalComponent],
    entryComponents: [PLClientReferralSaveModalComponent],
    providers: [],
})

export class PLClientReferralSaveModule { }
