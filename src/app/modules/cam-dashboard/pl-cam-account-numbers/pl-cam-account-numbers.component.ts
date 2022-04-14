import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import * as moment from 'moment';

import { PLCamAccountNumbersService } from './pl-cam-account-numbers.service';
import { PLCamAccountNumbers } from './pl-cam-account-numbers';

@Component({
    selector: 'pl-cam-account-numbers',
    templateUrl: './pl-cam-account-numbers.component.html',
    styleUrls: ['./pl-cam-account-numbers.component.less'],
    providers: [PLCamAccountNumbersService],
})
export class PLCamAccountNumbersComponent implements OnChanges {
    @Input() schoolYearCode: string;
    @Input() schoolYearId: string;

    accountNumbers: PLCamAccountNumbers;
    readonly referralManagerRoute = ['/client-referrals/manager'];
    readonly assignmentManagerRoute = ['/assignment-manager'];

    constructor(private plCamAccountNumbers: PLCamAccountNumbersService) {}

    ngOnChanges(changes: SimpleChanges): void {
        if ('schoolYearCode' in changes) {
            this.fetch();
        }
    }

    private fetch(): void {
        const params = {
            schoolYearCode: this.schoolYearCode,
            referralsToConvertCreatedAtLtUtc: moment.utc().subtract({ days: 7 }),
        };

        this.plCamAccountNumbers.getAccountNumbers(params).subscribe((results) => {
            this.accountNumbers = results;
        });
    }

    referralsUnmatchedRouteQueryParams(): any {
        return {
            crmf_managedAccountsOnly: true,
            crmf_schoolYearCode_In: this.schoolYearCode,
            crmf_state_In: 'UNMATCHED_PL_REVIEW,UNMATCHED_OPEN_TO_PROVIDERS,PROPOSED',
        };
    }

    referralsMatchedRouteQueryParams(): any {
        return {
            crmf_managedAccountsOnly: true,
            crmf_schoolYearCode_In: this.schoolYearCode,
            crmf_state_In: 'MATCHED',
            crmf_olderThan: 'one-week',
        };
    }

    locationsSchedulingStatusRouteQueryParams(): any {
        return {
            schoolYearCode: this.schoolYearCode,
        };
    }

    assignmentManagerUnfulfilledRouteQueryParams(): any {
        return {
            camf_orgFilters_In: 'unfilled_accounts,my_accounts',
            camf_school_year: this.schoolYearId,
            camf_INIT: 1,
        };
    }

    assignmentManagerPendingRouteQueryParams(): any {
        return {
            camf_orgFilters_In: 'my_accounts',
            camf_status: 'pending,reserved,initiated',
            camf_school_year: this.schoolYearId,
            camf_INIT: 1,
        };
    }

    assignmentManagerProposedRouteQueryParams(): any {
        return {
            camf_orgFilters_In: 'my_accounts',
            camf_status: 'proposed,locked',
            camf_school_year: this.schoolYearId,
            camf_INIT: 1,
        };
    }
}
