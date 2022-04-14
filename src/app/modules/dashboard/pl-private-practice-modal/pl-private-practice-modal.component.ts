import { Component, Input } from '@angular/core';
import {
    PLHttpService,
    PLUrlsService,
} from '@root/index';

@Component({
    selector: 'pl-private-practice-modal',
    templateUrl: './pl-private-practice-modal.component.html',
    styleUrls: ['./pl-private-practice-modal.component.less'],
})
export class PLPrivatePracticeModalComponent {
    @Input() onCancel: Function;
    email: string;
    isPaidAvailable: boolean;
    loading: boolean;
    notEligible: boolean;
    canSignup: boolean;
    alreadyExists: boolean;
    signUpComplete: boolean;

    constructor(
        private plUrls: PLUrlsService,
        private plHttp: PLHttpService,
    ) {

    }

    ngOnInit() {
        this.loading = true;

        // check for existing account
        const url = this.plUrls.urls.privatePractice + 'account_check/';

        this.plHttp.get('', {}, url, { suppressError: true }).subscribe(
            (res: any) => {
                this.loading = false;

                this.email = res.email;

                if (res.is_existing) {
                    this.alreadyExists = true;
                } else {
                    this.canSignup = true;
                    this.isPaidAvailable = res.is_paid_available;
                }
            },
            (res2: any) => {
                this.loading = false;
                this.notEligible = true;
            },
        );
    }

    cancel() {
        this.onCancel();
    }

    onClickFreeSignup() {
        this.loading = true;
        this.canSignup = false;

        const url = this.plUrls.urls.privatePractice + 'sign_up/';

        this.plHttp.save('', {}, url).subscribe(
            (res: any) => {
                this.loading = false;
                this.signUpComplete = true;
            },
        );
    }

    onClickPaidSignup() {
        this.loading = true;
        this.canSignup = false;

        const url = this.plUrls.urls.privatePractice + 'payment_link/';

        this.plHttp.get('', {}, url).subscribe(
            (res: any) => {
                window.location = res.url;
            },
        );
    }
}
