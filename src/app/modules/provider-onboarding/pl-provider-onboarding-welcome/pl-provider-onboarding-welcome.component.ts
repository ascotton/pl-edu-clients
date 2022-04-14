import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

@Component({
    selector: 'pl-provider-onboarding-welcome',
    templateUrl: './pl-provider-onboarding-welcome.component.html',
    styleUrls: ['./pl-provider-onboarding-welcome.component.less'],
})
export class PLProviderOnboardingWelcomeComponent {
    currentUser: any = { };
    beginLink = '/provider-onboarding/agreement';

    constructor(
        private store: Store<AppStore>,
    ) {
    }

    ngOnInit() {
        this.store.select('currentUser')
            .subscribe((user: any) => {
                if (user.uuid) {
                    this.currentUser = user;

                    // W2 provider?
                    if (this.currentUser.xProvider.isW2) this.beginLink = '/provider-onboarding/availability';
                }
            });
    }
}
