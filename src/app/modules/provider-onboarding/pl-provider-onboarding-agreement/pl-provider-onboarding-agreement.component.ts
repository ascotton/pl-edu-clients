import { Component, HostListener } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as moment from 'moment';

import {
    PLHttpService,
    PLModalService,
    // PLUrlsService,
    PLToastService,
} from '@root/index';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLGenericModalComponent } from '@root/src/app/common/components';

@Component({
    selector: 'pl-provider-onboarding-agreement',
    templateUrl: './pl-provider-onboarding-agreement.component.html',
    styleUrls: ['./pl-provider-onboarding-agreement.component.less'],
})
export class PLProviderOnboardingAgreementComponent {
    mode = 'new';
    rateDisplay = '';
    rateDisplay2 = '';
    rateDisplay3 = '';
    existingRateDisplay = '';
    existingRateLabelDisplay = '';
    rateLabelDisplay = 'Your Hourly Rates:';
    formVals = {
        agree: false,
        firstName: '',
        lastName: '',
    };
    message = '';
    formValid = false;
    frameHeight = '0px';

    agreements: any[] = [
    ];

    currentUser: User;

    constructor(
        private plHttp: PLHttpService,
        private plToast: PLToastService,
        // private plUrls: PLUrlsService,
        private route: ActivatedRoute,
        private router: Router,
        private sanitizer: DomSanitizer,
        private store: Store<AppStore>,
        private plModal: PLModalService,
    ) {
    }

    ngOnInit() {
        this.store.select('currentUser')
            .subscribe((user: any) => {
                if (user && user.uuid) {
                    this.currentUser = user;
                    this.getAgreements();

                    const rate = user.xProvider.adjustedHourlyRate || user.xProvider.hourlyRate;
                    const rateTier1 = user.xProvider.adjustedHourlyRateTier1 || user.xProvider.hourlyRateTier1;
                    const rateTier2 = user.xProvider.adjustedHourlyRateTier2 || user.xProvider.hourlyRateTier2;

                    this.rateDisplay = rate.toFixed(2);
                    this.rateDisplay2 = rateTier1.toFixed(2);
                    this.rateDisplay3 = rateTier2.toFixed(2);

                    if (user.xProvider.adjustedHourlyRate) {
                        this.existingRateLabelDisplay = `Your Rollover Rate, for assignments that commenced before July 1, ${moment().format('YYYY')}:`;
                        this.existingRateDisplay = user.xProvider.hourlyRate.toFixed(2);
                        this.rateLabelDisplay = `Your Hourly Rates, for assignments that commence after July 1, ${moment().format('YYYY')}:`;
                    }
                }
            });
        this.route.queryParams
            .subscribe((routeParams: any) => {
                if (routeParams.mode) {
                    this.mode = routeParams.mode;
                }
            });

        setTimeout(() => {
            this.setFrameHeight();
        }, 1);
    }

    @HostListener('window:resize', ['$event']) onResize() {
        this.setFrameHeight();
    }

    private setFrameHeight() {
        const headlineHeight = (this.mode === 'renewal') ? 75 : 150;
        const lowerAreaHeight = 440;
        const height = Math.max(250, window.innerHeight - headlineHeight - lowerAreaHeight);

        this.frameHeight = height + 'px';
    }

    getAgreements() {
        const params = {
            provider_uuid: this.currentUser.uuid,
        };
        this.plHttp.get('agreements', params)
            .subscribe((res: any) => {
                res.forEach((agreement: any) => {
                    agreement.document_url = this.sanitizer.bypassSecurityTrustResourceUrl(agreement.document_url);
                });
                this.agreements = res;
                // If no agreements, skip to next step.
                if (res.length < 1) {
                    this.nextStep();
                }
            });
    }

    checkFormValid() {
        // Add timeout to allow checkbox value to update.
        setTimeout(() => {
            // Name must exactly match what we have.
            if (this.formVals.agree && this.formVals.firstName === this.currentUser.first_name &&
                this.formVals.lastName === this.currentUser.last_name) {
                this.formValid = true;
                this.message = '';
            } else {
                this.formValid = false;
                this.message = `Please enter <b>${this.currentUser.first_name}</b> for first name and ` +
                    `<b>${this.currentUser.last_name}</b> for last name.`;
            }
        }, 1);
    }

    save() {
        this.checkFormValid();
        if (this.formValid) {
            this.agreeToAll().then((res) => {
                this.nextStep();
            }, (err) => {
                this.plToast.show('error', 'Error saving agreements, please try again.');
                this.getAgreements();
            });
        }
    }

    agreeToAll() {
        return new Promise((resolve, reject) => {
            const promises: any[] = [];
            this.agreements.forEach((agreement: any) => {
                promises.push(new Promise((res1, rej1) => {
                    // let url = `${this.plUrls.urls.agreements}?provider_uuid=${this.currentUser.uuid}`;
                    let params: any = {
                        provider_uuid: this.currentUser.uuid,
                        agreement_id: agreement.agreement_id,
                    };
                    this.plHttp.save('agreements', params)
                        .subscribe((res: any) => {
                            console.log('agreement saved', res);
                            res1(res);
                        }, (err: any) => {
                            console.error('agreement agree failed', err);
                            rej1();
                        });
                }));
            });
            Promise.all(promises).then((res) => {
                resolve({});
            }, (err) => {
                reject();
            });
        });
    }

    displayLearnMore() {
        let modalRef: any;
        const params = {
            onCancel: () => {
                modalRef._component.destroy();
            },
            modalHeaderText: `Hourly Rates`,
            introText: `
            The new hourly pay rate structure was developed to provide higher potential earning opportunities for certain assignments. Every assignment will be offered with a specific pay rate attached to it. The hourly pay rate does not apply to Special Rate Services, such as evaluation components.
            <br /><br />
            <b>Base Rate</b>: The Base Rate is the minimum hourly rate you will be offered for any assignment. You will be informed that an assignment will be paid at your Base Rate at the time you are offered the assignment.
            <br /><br />
            <b>Tier I Rate</b>: Your Tier I Rate will be higher than your Base Rate. You will be offered your Tier I Rate for specific assignments in In-Demand States or identified high need assignments. You will be informed that an assignment will be paid at your Tier I Rate at the time you are offered the assignment. Your Tier I Rate will only be applicable for work you perform at your Tier I assignments.
            <br /><br />
            <b>Tier II Rate</b>: Your Tier II Rate will be higher than your Base Rate and your Tier I Rate. You will be offered your Tier II Rate for specific, highly complex assignments at certain locations within an In-Demand State. Tier II assignments will be very unusual and may not be requested. We will offer them as they arise, prioritizing the most tenured providers. You will be informed that an assignment will be paid at your Tier II Rate at the time you are offered the assignment. Your Tier II Rate will only be applicable for work you perform at your Tier II assignments.
            <br /><br />
            For more information, please refer to the <a target="_blank" href="https://presencelearning.helpjuice.com/71385-being-a-provider-with-presencelearning/provider-pay-rates-2021-2022">Provider Pay Rates 2021-22 Help Center</a> article.
            `,
            definitionHeaderText: ``,
        };
        this.plModal.create(PLGenericModalComponent, params)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }

    nextStep() {
        let loc = '/provider-onboarding/contact-info';
        if (this.mode === 'renewal') {
            this.plToast.show('success', 'Thanks for completing your agreement!', 3000, true);
            loc = '/';
        }
        this.store.dispatch({ type: 'UPDATE_PROVIDER_ONBOARDING_STEP', payload: { stepKey: 'agreement', step: { status: 'complete' } } });
        this.router.navigate([loc]);
    }
}
