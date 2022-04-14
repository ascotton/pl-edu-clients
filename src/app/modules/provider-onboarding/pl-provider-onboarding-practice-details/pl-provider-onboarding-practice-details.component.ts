import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { environment } from '@root/src/environments/environment';

@Component({
    selector: 'pl-provider-onboarding-practice-details',
    templateUrl: './pl-provider-onboarding-practice-details.component.html',
    styleUrls: ['./pl-provider-onboarding-practice-details.component.less'],
})
export class PLProviderOnboardingPracticeDetailsComponent {
    iframeSrc: any = '';
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
                    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.tfaforms.com/4798377?tfa_7=${user.xProvider.salesforce_id}`);
                    // this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(`http://localhost:3010/c/form-assembly?page=practiceDetails`);
                }
            });

        if (environment.env_key === 'live') {
            this.setupPostMessage();
        } else {
            this.saveDisabled = false;
        }
    }

    save() {
        this.store.dispatch({ type: 'UPDATE_PROVIDER_ONBOARDING_STEP', payload: { stepKey: 'practiceDetails', step: { status: 'complete' } } });
        this.router.navigate(['/provider-onboarding/areas-of-specialty']);
    }

    setupPostMessage() {
        window.addEventListener('message', (evt) => {
            console.log('on message', evt.data);
            if (evt.data['formSubmitted'] && evt.data['page'] === 'practiceDetails') {
                console.log('on post message');
                this.saveDisabled = false;
            }
        });
    }
}
