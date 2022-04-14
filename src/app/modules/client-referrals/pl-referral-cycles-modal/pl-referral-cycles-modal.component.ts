import { Store } from '@ngrx/store';
import { Component, Input, OnInit } from '@angular/core';

import { User } from '../../user/user.model';
import { AppStore } from '@root/src/app/appstore.model';
import { referralProductTypeMap } from '@common/services/pl-client-referral';
import { PLReferralCyclesModalService, ReferralDeclineHistory } from './pl-referral-cycles-modal.service';

interface Client {
    firstName: string;
    lastName: string;
}

interface Referral {
    id: string;
    discipline: string;
    locationName: string;
    organizationName: string;
    productTypeCode: string;
    provider?: {
        id: string;
    };
    duration: number;
    frequency: string;
    interval: string;
    grouping: string;
}

@Component({
    selector: 'pl-referral-cycles-modal',
    templateUrl: './pl-referral-cycles-modal.component.html',
    styleUrls: ['./pl-referral-cycles-modal.component.less'],
    providers: [PLReferralCyclesModalService],
})

export class PLReferralCyclesModalComponent implements OnInit {
    @Input() client: Client;
    // So far we only need locationName, check if something else is needed;
    // otherwise ask only for those prop when receiving referral
    @Input() referral: Referral;

    errorInModal = false;
    loadingDeclineHistory = false;
    referralDeclineHistory: ReferralDeclineHistory[] = [];
    requestLink = '';

    constructor(
        private store: Store<AppStore>,
        private plReferralCyclesModalSvc: PLReferralCyclesModalService,
        ) { }

    ngOnInit() {
        try {
            this.store.select('currentUser').subscribe(
                (user) => {
                    if (user && user.email && this.referral && this.referral.locationName) {
                        this.getReferralDeclineHistory(this.referral.id);
                        this.showErrorMsgInModal(false, '');
                        this.setRequestLink(this.referral, user);
                    } else {
                        this.showErrorMsgInModal(true, 'user or referral are empty.');
                    }
                },
                () => this.showErrorMsgInModal(true, 'issue when subscribing to the current user.'),
            );
        } catch (error) {
            this.showErrorMsgInModal(true, 'issue when fetching the current user.');
        }
    }

    productTypeName(): string {
        return referralProductTypeMap[this.referral.productTypeCode];
    }

    //#region Private functions

    private getReferralDeclineHistory(referralId: string) {
        this.loadingDeclineHistory = true;

        this.plReferralCyclesModalSvc.getReferralDeclineHistory(referralId).subscribe(
            (referralDeclineHistory) => {
                this.loadingDeclineHistory = false;
                this.showErrorMsgInModal(false, '');
                this.referralDeclineHistory = referralDeclineHistory;

                if (referralDeclineHistory.length === 0) {
                    console.log('Decline history is empty');
                }
            },
            (error) => {
                this.loadingDeclineHistory = false;
                this.showErrorMsgInModal(true, error);
            },
        );
    }

    private setRequestLink(referral: Referral, user: User) {
        this.requestLink = `https://www.tfaforms.com/4649022?` +
            `tfa_874=${referral.locationName}&` +
            `tfa_875=${encodeURIComponent(user.email)}`;
    }

    private showErrorMsgInModal(error: boolean, errorMsg: string) {
        this.errorInModal = error;

        if (error) {
            console.log(`There was an error in the cycles modal: ${errorMsg}`);
        }
    }

    //#endregion Private Functions
}
