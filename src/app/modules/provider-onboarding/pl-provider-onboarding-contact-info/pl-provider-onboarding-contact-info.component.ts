import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

@Component({
    selector: 'pl-provider-onboarding-contact-info',
    templateUrl: './pl-provider-onboarding-contact-info.component.html',
    styleUrls: ['./pl-provider-onboarding-contact-info.component.less'],
})
export class PLProviderOnboardingContactInfoComponent {
    currentUser: any;

    contactInfo: any[] = [];

    constructor(
        private router: Router,
        private store: Store<AppStore>,
    ) {
    }

    ngOnInit() {
        this.store.select('currentUser')
            .subscribe((user: any) => {
                if (user.uuid) {
                    this.currentUser = user;
                    this.setContactInfo();
                }
            });
    }

    setContactInfo() {
        const provider = this.currentUser.xProvider;
        const address = `${provider.billing_street}`;
        const address2 = `${provider.billing_city}, ` +
            `${provider.billing_state}, ${provider.billing_postal_code}`;
        this.contactInfo = [
            {
                value: `${this.currentUser.first_name} ${this.currentUser.last_name}`,
                label: 'Full Name',
            },
            {
                value: address,
                value2: address2,
                label: 'Mailing Address',
            },
            {
                value: provider.phone,
                label: 'Phone Number',
            },
            {
                value: provider.email,
                label: 'Email',
            },
            {
                value: provider.email2,
                label: 'Alternate Email',
            },
            // {
            //     value: provider.phone,
            //     label: 'Preferred Contact Method',
            // },
        ];
    }

    save() {
        this.store.dispatch({ type: 'UPDATE_PROVIDER_ONBOARDING_STEP', payload: { stepKey: 'contactInfo', step: { status: 'complete' } } });
        this.router.navigate(['/provider-onboarding/availability']);
    }
}
