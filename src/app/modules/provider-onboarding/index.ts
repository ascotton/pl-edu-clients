import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PLDotLoaderModule, PLIconModule, PLInputModule, PLButtonModule } from '@root/index';

import { PLCommonModule } from  '@app/common';
import { PLScheduleAvailabilityComponentsModule } from  '../../modules/schedule';
import { PLProviderOnBoardingRoutingModule } from './provider-onboarding.routing.module';

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
import { PLProviderPreagreementComponent } from
    './pl-provider-preagreement/pl-provider-preagreement.component';
import { PLProviderPreagreementW2Component } from
    './pl-provider-preagreement-w2/pl-provider-preagreement-w2.component';
import { PLProviderOnboardingAreasOfSpecialtyComponent } from
    './pl-provider-onboarding-areas-of-specialty/pl-provider-onboarding-areas-of-specialty.component';

@NgModule({
    imports: [
        CommonModule,
        PLDotLoaderModule,
        PLCommonModule,
        PLIconModule,
        PLInputModule,
        PLButtonModule,
        PLScheduleAvailabilityComponentsModule,
        PLProviderOnBoardingRoutingModule,
    ],
    exports: [
        PLProviderOnboardingComponent,
        PLProviderOnboardingAgreementComponent,
        PLProviderOnboardingAvailabilityComponent,
        PLProviderOnboardingContactInfoComponent,
        PLProviderOnboardingContractorStatusComponent,
        PLProviderOnboardingDoneComponent,
        PLProviderOnboardingPaymentInfoComponent,
        PLProviderOnboardingPracticeDetailsComponent,
        PLProviderOnboardingWelcomeComponent,
        // PLProviderPreagreementComponent,
        // PLProviderPreagreementW2Component,
        PLProviderOnboardingAreasOfSpecialtyComponent,
    ],
    declarations: [
        PLProviderOnboardingComponent,
        PLProviderOnboardingAgreementComponent,
        PLProviderOnboardingAvailabilityComponent,
        PLProviderOnboardingContactInfoComponent,
        PLProviderOnboardingContractorStatusComponent,
        PLProviderOnboardingDoneComponent,
        PLProviderOnboardingPaymentInfoComponent,
        PLProviderOnboardingPracticeDetailsComponent,
        PLProviderOnboardingWelcomeComponent,
        // PLProviderPreagreementComponent,
        // PLProviderPreagreementW2Component,
        PLProviderOnboardingAreasOfSpecialtyComponent,
    ],
    providers: [],
})
export class PLProviderOnboardingModule {
}
