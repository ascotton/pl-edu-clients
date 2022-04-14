import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { forkJoin, combineLatest } from 'rxjs';
import { PLProviderProfileService } from '@common/services';
import { PLProviderService } from '../../providers/pl-provider.service';

@Component({
    selector: 'pl-provider-onboarding-areas-of-specialty',
    templateUrl: './pl-provider-onboarding-areas-of-specialty.component.html',
    styleUrls: ['./pl-provider-onboarding-areas-of-specialty.component.less'],
})
export class PLProviderOnboardingAreasOfSpecialtyComponent {
    isBilingual = false;
    areaOptions: any[] = [];
    languageOptions: any[] = [];
    selectedAreaIds: any[];
    selectedLanguageCodes: any[];
    currentUser: any;

    constructor(
        private router: Router,
        private store: Store<any>,
        private plProviderProfileService: PLProviderProfileService,
        private plProviderService: PLProviderService,
    ) {
    }

    ngOnInit() {
        this.store.select('currentUser')
            .subscribe((user: any) => {
                if (!user.uuid) return;

                this.currentUser = user;

                combineLatest([
                    this.plProviderService.getProviderByUserId(user.uuid),
                    this.plProviderProfileService.getProviderLanguages(),
                    this.plProviderProfileService.getAreasOfSpecialty(),
                ]).subscribe(([provider, languages, areas]: [any, any[], any[]]) => {
                    this.selectedAreaIds = provider.areasOfSpecialty.map((obj: any) => obj.id);
                    this.selectedLanguageCodes = provider.languages.map((obj: any) => obj.code);
                    this.isBilingual = this.selectedLanguageCodes.length > 0;

                    this.languageOptions = languages;
                    this.areaOptions = areas;
                });
            });
    }

    onClickSave() {
        forkJoin([
            this.plProviderProfileService.setAreasOfSpecialty(this.currentUser.uuid, this.selectedAreaIds),
            this.plProviderProfileService.setProviderLanguages(this.currentUser.uuid, this.selectedLanguageCodes),
        ]).subscribe(() => {
            this.store.dispatch({
                type: 'UPDATE_PROVIDER_ONBOARDING_STEP',
                payload: { stepKey: 'areasOfSpecialty', step: { status: 'complete' } },
            });
            this.router.navigate(['/provider-onboarding/payment-info']);
        });
    }
}
