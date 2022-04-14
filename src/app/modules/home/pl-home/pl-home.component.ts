import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

import { PLMayService } from '@root/index';

@Component({
    selector: 'pl-home',
    templateUrl: './pl-home.component.html',
    styleUrls: ['./pl-home.component.less'],
})
export class PLHomeComponent {
    loading = true;
    isClientContact = false;

    constructor(
        store: Store<AppStore>,
        router: Router,
        plMay: PLMayService,
    ) {
        store.select('currentUser').subscribe((user: User) => {
            // Do not try before user is loaded.
            if (user.groups) {
                if (plMay.isClinicalAccountManager(user)) {
                    router.navigate(['/cam-dashboard']);
                } else if (user.groups.some((g: any) => g.indexOf('School Staff') > -1)) {
                    router.navigate([
                        user.groups.includes('School Staff Admins') ?
                            '/school-staff' :
                            '/landing-home']);
                } else if (user.groups.some((g: any) => g.indexOf('Private Practice') > -1)) {
                    router.navigate(['/landing-home']);
                } else if (user.groups.some((g: any) => g.indexOf('Client Contact') > -1)) {
                    this.loading = false;
                    this.isClientContact = true;
                } else if (plMay.canAccessProviderLanding(user)) {
                    router.navigate(['/landing']);
                } else if (plMay.canAccessCustomerDashboard(user) || plMay.isCustomer(user)) {
                    router.navigate(['/dashboard']);
                } else {
                    router.navigate(['/clients']);
                }
            }
        });
    }
}
