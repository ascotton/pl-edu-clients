import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import {
    PLHttpService,
    PLUrlsService,
} from '@root/index';

@Component({
    selector: 'pl-provider-onboarding-done',
    templateUrl: './pl-provider-onboarding-done.component.html',
    styleUrls: ['./pl-provider-onboarding-done.component.less']
})
export class PLProviderOnboardingDoneComponent {
    currentUser: any;

    constructor(
        private plHttp: PLHttpService,
        private plUrls: PLUrlsService,
        private router: Router,
        private store: Store<any>,
    ) {
    }

    ngOnInit() {
        this.store.select('currentUser')
            .subscribe((user: any) => {
                if (user && user.uuid) {
                    this.currentUser = user;
                }
            });
    }

    save() {
        // Need to update store too otherwise will be redirected back here.
        const payload = { ...this.currentUser };
        payload.xProvider = {
            ...payload.xProvider,
            is_onboarding_wizard_complete: true
        };
        this.currentUser = payload;
        this.store.dispatch({ type: 'UPDATE_CURRENT_USER', payload });

        // let url = `${this.plUrls.urls.providers}${this.currentUser.uuid}/`;
        const params = {
            // user: this.currentUser.uuid,
            uuid: this.currentUser.uuid,
            is_onboarding_wizard_complete: true,
        };
        // this.plHttp.put('', params, url)
        this.plHttp.save('providers', params)
            .subscribe((res: any) => {
                this.router.navigate(['/']);
            });
    }
}
