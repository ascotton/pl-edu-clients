import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';

import { PLLodashService } from '@root/index';

import { PLCamAccountDetailsService } from './pl-cam-account-details.service';
import { PLLocationReferralStats } from './pl-location-referral-stats';
import { PLServiceStatus } from './pl-service-status';

@Component({
    selector: 'pl-cam-account-details',
    templateUrl: './pl-cam-account-details.component.html',
    styleUrls: ['./pl-cam-account-details.component.less'],
    providers: [PLCamAccountDetailsService],
})
export class PLCamAccountDetailsComponent implements OnInit {
    @Input() orgName: string;
    @Input() orgId: string;
    @Input() schoolYearCode: string;
    @Output() readonly dataLoaded: EventEmitter<boolean> = new EventEmitter<boolean>();

    services: PLServiceStatus [];
    locationReferralStats: PLLocationReferralStats[] = [];

    constructor(private componentService: PLCamAccountDetailsService, private lodash: PLLodashService) {}

    ngOnInit(): void {
        const params = {
            organizationId: this.orgId,
            schoolYearCode: this.schoolYearCode,
        };

        this.componentService.getDetails(params).subscribe((results) => {
            this.locationReferralStats = results.locationReferralStats;
            this.services = results.serviceStatuses;

            this.dataLoaded.emit(true);
        });
    }

    isServiceDetailVisible(
        { onboardingCount, inServiceCount, notInServiceCount, contractedReferralHours }: PLServiceStatus,
    ): boolean {
        return onboardingCount + inServiceCount + notInServiceCount + contractedReferralHours > 0;
    }

    orderByLocation(locationReferralStats: PLLocationReferralStats[]): PLLocationReferralStats[] {
        return this.lodash.sort2d([...locationReferralStats], 'location.name');
    }

    allAreVirtualLocations(locationReferralStats: PLLocationReferralStats[]): boolean {
        return locationReferralStats.every(s => s.location.isVirtual);
    }
}
