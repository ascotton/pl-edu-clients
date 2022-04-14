import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';

import {
    PLToastService,
    PLClientStudentDisplayService,
    PLLodashService,
} from '@root/index';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';


import {
    referralProductTypeMap,
} from '@common/services/pl-client-referral';

interface Client {
    firstName: string;
    lastName: string;
    englishLanguageLearnerStatus: string;
    primaryLanguage: {
        name: string;
        code: string;
    };
}

interface Evaluation {
    discipline: string;
    locationName: string;
    organizationName: string;
    productTypeCode: string;
}

@Component({
    selector: 'pl-client-evaluation-reassign',
    templateUrl: './pl-client-evaluation-reassign.component.html',
    styleUrls: ['./pl-client-evaluation-reassign.component.less'],
})
export class PLClientEvaluationReassignComponent {
    @Input() client: Client;
    @Input() evaluation: Evaluation;
    @Input() onGetProviders: Function;
    @Input() onMatch: Function;
    @Input() onMatchDone: Function;
    @Input() onCancel: Function;

    currentUser: User;
    clientStudentText: string;
    requestLink = '';

    referralNotes: '';

    private providers: any[] = [];

    private selected: any = {
        provider: {
            user: {},
        },
    };
    public loading = true;
    public mayMatch = true;
    public noneSelectedError = false;
    public submitting = false;

    constructor(
        private plToast: PLToastService,
        private store: Store<AppStore>,
        private plLodash: PLLodashService,
    ) {}

    ngOnInit() {
        this.store.select('currentUser').subscribe((user) => {
            this.currentUser = user;
            this.clientStudentText = PLClientStudentDisplayService.get(user);

            this.setRequestLink();
            this.getProviders();
        });
    }

    productTypeName(): string {
        return referralProductTypeMap[this.evaluation.productTypeCode];
    }

    setRequestLink() {
        this.requestLink = `https://www.tfaforms.com/4649022?` +
        `tfa_874=${this.evaluation.locationName}&` +
        `tfa_875=${encodeURIComponent(this.currentUser.email)}`;
    }

    showLanguageNote(): boolean {
        const languageCode = this.client.primaryLanguage.code;
        const ellStatus = this.client.englishLanguageLearnerStatus;

        return  languageCode !== 'en' && ellStatus === 'CURRENTLY_IDENTIFIED';
    }

    getProviders() {
        this.loading = true;
        this.onGetProviders().subscribe((res: any) => {
            if (res.mayMatch) {
                this.mayMatch = res.mayMatch;
            }
            this.providers = this.formatProviders(res.providers);
            this.providers.sort((p1, p2) => p2.remainingAvailableHours - p1.remainingAvailableHours);
            this.loading = false;
        });
    }

    formatProviders(providers: any[]) {
        providers.forEach((provider: any) => {
            provider.xName = `${provider.user.firstName} ${provider.user.lastName}`;
            provider.remainingAvailableHours = Math.round(provider.remainingAvailableHours * 10) / 10;
        });
        return providers;
    }

    match() {
        if (!this.selected.provider.user || !this.selected.provider.user.id) {
            this.noneSelectedError = true;
        } else {
            this.noneSelectedError = false;
            this.submitting = true;
            const index = this.plLodash.findIndex(this.providers,
             'user.id', this.selected.provider.user.id);
            const selectedProviderUser = Object.assign({}, this.providers[index].user);
            const data = {
                providerId: selectedProviderUser.id,
                newNotes: this.referralNotes,
            };
            this.onMatch(data).subscribe((res: any) => {
                this.onMatchSuccess(selectedProviderUser);
            }, (err: any) => {
                // this.submitting = false;
                // In this case, no reassignment may happen, so just cancel.
                this.onCancel();
            });
        }
    }

    onMatchSuccess(selectedProviderUser: any) {
        this.submitting = false;
        const msg = `Provider ${selectedProviderUser.firstName} ` +
         `${selectedProviderUser.lastName} matched to ${this.client.firstName} ${this.client.lastName} ` +
         `for ${this.productTypeName()}`;
        this.plToast.show('success', msg, 2000, true);
        this.onMatchDone({});
    }

    cancel() {
        this.onCancel();
    }
}
