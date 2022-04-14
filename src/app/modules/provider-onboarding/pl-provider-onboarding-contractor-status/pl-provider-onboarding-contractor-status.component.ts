import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

@Component({
    selector: 'pl-provider-onboarding-contractor-status',
    templateUrl: './pl-provider-onboarding-contractor-status.component.html',
    styleUrls: ['./pl-provider-onboarding-contractor-status.component.less'],
})
export class PLProviderOnboardingContractorStatusComponent {
    currentUser: any;

    iframeSrc: any = '';

    constructor(
        private router: Router,
        private sanitizer: DomSanitizer,
        private store: Store<AppStore>,
    ) {
    }

    ngOnInit() {
        this.store.select('currentUser')
            .subscribe((user: any) => {
                if (user.uuid && user.xProvider) {
                    this.currentUser = user;
                    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.tfaforms.com/4804923?tfa_7=${this.currentUser.xProvider.salesforce_id}`);
                }
            });
    }

    save() {
        this.store.dispatch({ type: 'UPDATE_PROVIDER_ONBOARDING_STEP', payload: { stepKey: 'contractorStatus', step: { status: 'complete' } } });
        this.router.navigate(['/provider-onboarding/payment-info']);
    }
}
