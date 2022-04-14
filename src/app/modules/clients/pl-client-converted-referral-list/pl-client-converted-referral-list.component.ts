import { Component, Input } from '@angular/core';

import { serviceDurationPluralizationMapping } from '@common/services/pl-client-service';
import {
    referralGroupingOptions,
    referralIntervalOptions,
} from '@common/services/pl-client-referral';
import { PLClientService } from '../pl-client.service';

@Component({
    selector: 'pl-client-converted-referral-list',
    templateUrl: './pl-client-converted-referral-list.component.html',
    styleUrls: ['./pl-client-converted-referral-list.less'],
})
export class PLClientConvertedReferralListComponent {
    @Input() referrals: any[] = [];
    @Input() productType = '';
    @Input() isDirectService = false;
    @Input() client: any = {};

    readonly durationPluralization = serviceDurationPluralizationMapping;
    readonly intervalOptions = referralIntervalOptions;
    readonly groupingOptions = referralGroupingOptions;

    constructor(private plClientSvc: PLClientService) {}

    /**
     * paragraphs - split a string by new line characters
     *
     * Handles Windows \r\n and Unix \n newline conventions
     */
    paragraphs(text: string): string[] {
        return text ? text.replace(/\r\n/g, '\n').split(/\n/) : [];
    }

    getFrequencyLabel(frequency: number): string {
        return this.plClientSvc.buildFrequencyLabel(frequency);
    }

    heading(): string {
        const referrals = this.referrals.length === 1 ? 'Referral' : 'Referrals';
        const suffix = this.productType ? ` – ${this.productType}` : '';

        return `${referrals}${suffix}`;
    }

    orderedReferrals(): any[] {
        const reverseChronological = (a: any, b: any): number => {
            return (new Date(b.created)).valueOf() - (new Date(a.created)).valueOf();
        };

        return this.referrals.slice().sort(reverseChronological);
    }
}
