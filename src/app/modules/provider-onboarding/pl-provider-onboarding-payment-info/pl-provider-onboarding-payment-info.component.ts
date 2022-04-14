import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { environment } from '@root/src/environments/environment';

@Component({
    selector: 'pl-provider-onboarding-payment-info',
    templateUrl: './pl-provider-onboarding-payment-info.component.html',
    styleUrls: ['./pl-provider-onboarding-payment-info.component.less'],
})
export class PLProviderOnboardingPaymentInfoComponent {
    iframeSrc: any = '';
    // iframeId = 'providerOnboardingPaymentInfoIFrame1';
    saveDisabled = true;

    constructor(
        private sanitizer: DomSanitizer,
        private router: Router,
        private store: Store<any>,
    ) {
    }

    ngOnInit() {
        this.store.select('currentUser')
            .subscribe((user: any) => {
                if (user.uuid && user.xProvider) {
                    // W2 provider? skip
                    if (user.xProvider.isW2) {
                        this.router.navigate(['/provider-onboarding/done']);
                    } else {
                        const fullName = `${user.first_name} ${user.last_name}`;
                        this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.tfaforms.com/4812795?tfa_13=${user.xProvider.salesforce_id}&tfa_15=${fullName}`);
                    	// this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(`http://localhost:3010/c/form-assembly?page=paymentInfo`);
                    }
                }
            });

        if (environment.env_key === 'live') {
            this.setupPostMessage();
        } else {
            this.saveDisabled = false;
        }
    }

    save() {
        this.store.dispatch({
            type: 'UPDATE_PROVIDER_ONBOARDING_STEP',
            payload: { stepKey: 'paymentInfo',
            step: { status: 'complete' } },
        });
        this.router.navigate(['/provider-onboarding/done']);
    }

    setupPostMessage() {
        // window.addEventListener('load', function() {
        //     var target_origin = 'http://localhost:3010';
        //     parent.postMessage( {'formSubmitted': 1}, target_origin );
        // });

        window.addEventListener('message', (evt) => {
            console.log('on message', evt.data);
            if (evt.data['formSubmitted'] && evt.data['page'] === 'paymentInfo') {
                console.log('on post message');
                this.saveDisabled = false;
            }
        });
    }
}
