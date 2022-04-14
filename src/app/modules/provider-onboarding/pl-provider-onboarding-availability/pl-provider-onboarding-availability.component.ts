import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

@Component({
    selector: 'pl-provider-onboarding-availability',
    templateUrl: './pl-provider-onboarding-availability.component.html',
    styleUrls: ['./pl-provider-onboarding-availability.component.less'],
})
export class PLProviderOnboardingAvailabilityComponent {
    timezone = '';

    constructor(
        private router: Router,
        private store: Store<any>,
    ) {
    }

    ngOnInit() {
        this.store.select('currentUser')
            .subscribe((user: any) => {
                if (user.uuid) {
                    this.timezone = user.xProvider.timezone && user.xProvider.timezone.replace('_', ' ');
                }
            });
    }

    onSave(evt: any) {
        this.store.dispatch({
            type: 'UPDATE_PROVIDER_ONBOARDING_STEP',
            payload: { stepKey: 'availability', step: { status: 'complete' } },
        });
        this.router.navigate(['/provider-onboarding/practice-details']);
    }
}
