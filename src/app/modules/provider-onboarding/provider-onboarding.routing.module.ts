import { NgModule }     from '@angular/core';
import { RouterModule } from '@angular/router';

import { PLProviderOnboardingComponent } from
    './pl-provider-onboarding/pl-provider-onboarding.component';
import { PLProviderOnboardingAgreementComponent } from
    './pl-provider-onboarding-agreement/pl-provider-onboarding-agreement.component';
import { PLProviderOnboardingAvailabilityComponent } from
    './pl-provider-onboarding-availability/pl-provider-onboarding-availability.component';
import { PLProviderOnboardingContactInfoComponent } from
    './pl-provider-onboarding-contact-info/pl-provider-onboarding-contact-info.component';
import { PLProviderOnboardingContractorStatusComponent } from
    './pl-provider-onboarding-contractor-status/pl-provider-onboarding-contractor-status.component';
import { PLProviderOnboardingDoneComponent } from
    './pl-provider-onboarding-done/pl-provider-onboarding-done.component';
import { PLProviderOnboardingPaymentInfoComponent } from
    './pl-provider-onboarding-payment-info/pl-provider-onboarding-payment-info.component';
import { PLProviderOnboardingPracticeDetailsComponent } from
    './pl-provider-onboarding-practice-details/pl-provider-onboarding-practice-details.component';
import { PLProviderOnboardingWelcomeComponent } from
    './pl-provider-onboarding-welcome/pl-provider-onboarding-welcome.component';
import { PLProviderOnboardingAreasOfSpecialtyComponent } from
    './pl-provider-onboarding-areas-of-specialty/pl-provider-onboarding-areas-of-specialty.component';

@NgModule({
    imports: [
        RouterModule.forChild([{
            path: '',
            component: PLProviderOnboardingComponent,
            data: { title: 'SKIPHISTORY' },
            children: [
                { path: '', redirectTo: 'welcome', pathMatch: 'full' },
                { path: 'agreement', component: PLProviderOnboardingAgreementComponent },
                { path: 'availability', component: PLProviderOnboardingAvailabilityComponent },
                { path: 'contact-info', component: PLProviderOnboardingContactInfoComponent },
                { path: 'contractor-status', component: PLProviderOnboardingContractorStatusComponent },
                { path: 'done', component: PLProviderOnboardingDoneComponent },
                { path: 'payment-info', component: PLProviderOnboardingPaymentInfoComponent },
                { path: 'practice-details', component: PLProviderOnboardingPracticeDetailsComponent },
                { path: 'welcome', component: PLProviderOnboardingWelcomeComponent },
                { path: 'areas-of-specialty', component: PLProviderOnboardingAreasOfSpecialtyComponent },
            ],
        }]),
    ],
    exports: [RouterModule],
})
export class PLProviderOnBoardingRoutingModule {}
