import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PLAddReferralsNavigationService } from '../pl-add-referrals-navigation.service';
import { PLAddReferralsDataTableService } from '../pl-add-referrals-table-data.service';
import { PLAddReferralsLocationYearService } from '../pl-add-referrals-location-year.service';

@Component({
    selector: 'pl-provider-matching',
    templateUrl: './pl-provider-matching.component.html',
    styleUrls: ['./pl-provider-matching.component.less', '../pl-add-referrals.component.less']
})
export class PLProviderMatchingComponent {
    destroyed$ = new Subject<boolean>();
    locationName: string;
    model: any;

    constructor(private pLAddReferralsNavigationService: PLAddReferralsNavigationService,
            private locationService: PLAddReferralsLocationYearService,
            private tableDataService: PLAddReferralsDataTableService) {
        this.locationName = locationService.getSelectedLocationName();
        pLAddReferralsNavigationService.navigateRequested$.pipe(takeUntil(this.destroyed$)).subscribe(
            (stepIndex) => {
                pLAddReferralsNavigationService.confirmNavigate(stepIndex);
            });
        this.model = tableDataService.providerMatching;
    }

    ngOnDestroy() {
        // prevent memory leak when component destroyed
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }
};
