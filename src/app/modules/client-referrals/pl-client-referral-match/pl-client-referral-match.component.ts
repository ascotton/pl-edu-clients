import {
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { concat, EMPTY } from 'rxjs';
import { last } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import {
    PLClientStudentDisplayService,
    PLLodashService,
} from '@root/index';

import { PLReferral, PLReferralsService } from '../pl-referrals.service';
import { Provider, PLClientReferralMatchReferralService } from './pl-client-referral-match-referral.service';

import { Option } from '@common/interfaces';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

import { serviceDurationPluralizationMapping } from '@common/services/pl-client-service';

import {
    referralIntervalOptions,
    referralGroupingOptions,
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
    locations: any[];
}

interface Referral {
    id: string;
    discipline: string;
    locationName: string;
    organizationName: string;
    productTypeCode: string;
    provider?: {
        id: string;
    };
    duration: number;
    frequency: number;
    interval: string;
    grouping: string;
}

interface MatchEvent {
    referral: PLReferral;
}

@Component({
    selector: 'pl-client-referral-match',
    templateUrl: './pl-client-referral-match.component.html',
    styleUrls: ['./pl-client-referral-match.component.less'],
    providers: [PLClientReferralMatchReferralService],
})
export class PLClientReferralMatchComponent {
    @Input() client: Client;
    @Input() referral: Referral;
    @Input() notesFromReferral: string;

    @Output() readonly match: EventEmitter<MatchEvent> = new EventEmitter();
    @Output() readonly proposeMatch: EventEmitter<MatchEvent> = new EventEmitter();
    @Output() readonly cancel: EventEmitter<any> = new EventEmitter();

    currentUser: User;
    clientStudentText: string;
    requestLink = '';

    notes: string;

    providers: Provider[] = [];
    locationId: string;

    public selectedProviderUserId: string;
    public loading = true;
    public noneSelectedError = false;
    public submitting = false;

    readonly durationPluralization = serviceDurationPluralizationMapping;
    readonly intervalOptions: Option[] = referralIntervalOptions;
    readonly groupingOptions: Option[] = referralGroupingOptions;

    constructor(
        private store: Store<AppStore>,
        private plLodash: PLLodashService,
        private plReferralsService: PLReferralsService,
        private plClientReferralMatchService: PLClientReferralMatchReferralService,
    ) {}

    ngOnInit() {
        this.store.select('currentUser').subscribe((user) => {
            this.currentUser = user;
            this.clientStudentText = PLClientStudentDisplayService.get(user);

            this.setRequestLink();
            this.getProviders();
        });

        this.notes = this.notesFromReferral;
        this.setLocationId();
    }

    productTypeName(): string {
        return referralProductTypeMap[this.referral.productTypeCode];
    }

    setRequestLink() {
        this.requestLink = `https://www.tfaforms.com/4649022?` +
        `tfa_874=${this.referral.locationName}&` +
        `tfa_875=${encodeURIComponent(this.currentUser.email)}`;
    }

    isEvaluationProductType(): boolean {
        return this.referral.productTypeCode === 'evaluation_with_assessments';
    }

    isDirectTherapyProductType(): boolean {
        return this.referral.productTypeCode === 'direct_service';
    }

    showLanguageNote(): boolean {
        const languageCode = this.client.primaryLanguage.code;
        const ellStatus = this.client.englishLanguageLearnerStatus;

        return  languageCode !== 'en' && ellStatus === 'CURRENTLY_IDENTIFIED';
    }

    getProviders() {
        this.loading = true;

        this.plClientReferralMatchService.getProviders(this.referral.id).subscribe((providers) => {
            this.providers = providers;
            this.providers.sort((p1, p2) => p2.remainingAvailableHours - p1.remainingAvailableHours);
            const referralProvider = this.referral.provider;
            const selectedProvider = referralProvider && providers.find(p => p.userId === referralProvider.id);
            this.selectedProviderUserId = selectedProvider ? selectedProvider.userId : '';

            this.loading = false;
        });
    }

    onSaveMatchClick(): void {
        if (!this.selectedProviderUserId) {
            this.noneSelectedError = true;
        } else {
            let referralNotesObserver: any = EMPTY;
            this.noneSelectedError = false;
            this.submitting = true;

            const proposeMatchParams = {
                referralId: this.referral.id,
                providerUserId: this.selectedProviderUserId,
            };

            // If there are notes, save them; otherwise skip to match referral.
            // Notes can be empty, there's a scenario when the user deletes the note, hence we must save it.
            if (this.notes !== null && this.notes !== undefined) {
                referralNotesObserver = this.plReferralsService.saveReferralNotes(this.notes, this.referral.id);
            }

            concat(
                referralNotesObserver,
                this.plReferralsService.proposeMatch(proposeMatchParams),
            ).pipe(
                last(), // only emit results of proposeMatch
            ).subscribe({
                next: (newReferral: PLReferral) => {
                    this.submitting = false;

                    this.proposeMatch.emit({ referral: newReferral });
                },
                error: () => {
                    this.submitting = false;
                    this.cancel.emit();
                },
            });
        }
    }

    onConfirmMatchClick(): void {
        if (!this.selectedProviderUserId) {
            this.noneSelectedError = true;
        } else {
            this.noneSelectedError = false;
            this.submitting = true;

            const params = {
                referralId: this.referral.id,
                providerUserId: this.selectedProviderUserId,
            };

            // If there are notes, save them; otherwise skip to match referral
            concat(
                this.notes ? this.plReferralsService.saveReferralNotes(this.notes, this.referral.id) : EMPTY,
                this.plReferralsService.matchReferral(params),
            ).pipe(
                last(), // only emit results of matchReferral
            ).subscribe({
                next: (matchedReferral: PLReferral) => {
                    this.submitting = false;

                    this.match.emit({ referral: matchedReferral });
                },
                error: () => {
                    this.submitting = false;
                    this.cancel.emit();
                },
            });
        }
    }

    onCancelClick() {
        this.cancel.emit();
    }

    setLocationId(): void {
        if (this.client && this.client.locations && this.client.locations.length) {
            this.locationId = this.client.locations[0].id;
        }
    }

}
