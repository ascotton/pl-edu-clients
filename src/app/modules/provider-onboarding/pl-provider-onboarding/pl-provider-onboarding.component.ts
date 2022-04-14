import { Component } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppConfigService } from '@app/app-config.service';

@Component({
    selector: 'pl-provider-onboarding',
    templateUrl: './pl-provider-onboarding.component.html',
    styleUrls: ['./pl-provider-onboarding.component.less'],
})
export class PLProviderOnboardingComponent {
    mode = 'new';
    modeSet = false;

    steps: any[] = [];

    steps1099 = [
        {
            key: 'agreement',
            text: 'Agreement & Rate',
            href: '/provider-onboarding/agreement',
        },
        {
            key: 'contactInfo',
            text: 'Contact Information',
            href: '/provider-onboarding/contact-info',
        },
        {
            key: 'availability',
            text: 'Time Zone & Availability',
            href: '/provider-onboarding/availability',
        },
        {
            key: 'practiceDetails',
            text: 'Qualifications',
            href: '/provider-onboarding/practice-details',
        },
        {
            key: 'areasOfSpecialty',
            text: 'Areas of Specialty',
            href: '/provider-onboarding/areas-of-specialty',
        },
        {
            key: 'paymentInfo',
            text: 'Payment Information',
            href: '/provider-onboarding/payment-info',
        },
    ];

    stepsW2 = [
        {
            key: 'availability',
            text: 'Time Zone & Availability',
            href: '/provider-onboarding/availability',
        },
        {
            key: 'practiceDetails',
            text: 'Qualifications',
            href: '/provider-onboarding/practice-details',
        },
        {
            key: 'areasOfSpecialty',
            text: 'Areas of Specialty',
            href: '/provider-onboarding/areas-of-specialty',
        },
    ];

    contact = {
        email: 'sarah.smith@presencelearning.com',
        name: 'Sarah Smith',
    };
    support = {
        email: 'asksupport@presencelearning.com',
        phone: '1-844-415-4592',
    };
    links: any[] = [];
    currentUser: any = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private appConfig: AppConfigService,
        private store: Store<any>,
    ) {
    }

    ngOnInit() {
        this.store.select('currentUser')
            .subscribe((user: any) => {
                if (user.uuid) {
                    this.currentUser = user;
                    this.checkAllowed();

                    // W2 provider?
                    this.steps = (this.currentUser.xProvider.isW2) ?
                        this.stepsW2 :
                        this.steps1099;
                }
            });

        this.route.queryParams
            .subscribe((routeParams: any) => {
                if (routeParams.mode) {
                    this.mode = routeParams.mode;
                }
                this.modeSet = true;
                this.checkAllowed();
            });
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.setLinks();
            }
        });
        this.setLinks();
        // setTimeout(() => {
        //     this.appConfig.showAppNav = false;
        //     this.appConfig.showNavHeader = true;
        // }, 0);
        this.store.select('providerOnboardingStore').subscribe((providerOnboardingStore: any) => {
            if (providerOnboardingStore.steps) {
                this.steps = providerOnboardingStore.steps;
            }
        });
        this.store.dispatch({ type: 'UPDATE_PROVIDER_ONBOARDING', payload: { steps: this.steps } });
    }

    // ngOnDestroy() {
    //     this.appConfig.showAppNav = true;
    //     this.appConfig.showNavHeader = false;
    // }

    checkAllowed() {
        if (this.modeSet && this.currentUser !== null) {
            if (this.currentUser.xProvider && this.currentUser.xProvider.is_onboarding_wizard_complete &&
                this.mode === 'new') {
                this.router.navigate(['landing']);
            } else if (this.mode === 'renewal') {
                const url = this.router.url;
                const pos = url.lastIndexOf('/');
                const path = url.slice((pos + 1), url.length);
                if (path !== 'agreement') {
                    this.router.navigate(['/provider-onboarding/agreement'], { queryParams: { mode: 'renewal' } });
                }
            }
        }
    }

    setLinks() {
        const url = this.router.url;

        // Running on leaving provider onboarding so need to skip in that case.
        if (url.indexOf('provider-onboarding') > -1) {
            // setTimeout(() => {
            //     this.appConfig.showAppNav = false;
            //     this.appConfig.showNavHeader = true;
            // }, 0);

            const pos = url.lastIndexOf('/');
            const path = url.slice((pos + 1), url.length);
            if (path === 'availability') {
                this.links = [
                    {
                        href: 'https://presencelearning.helpjuice.com/61244-technical-support-troubleshooting/update-your-availability',
                        label: 'Availability',
                    },
                ];
            } else if (path === 'practice-details') {
                this.links = [
                    {
                        href: 'https://presencelearning.helpjuice.com/71385-being-a-provider-with-presencelearning/cross-licensing',
                        label: 'Cross-Licensing',
                    },
                ];
            } else if (path === 'payment-info') {
                this.links = [
                ];
            } else {
                this.links = [];
            }
        }
    }
}
