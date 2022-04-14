import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';

import { FormGroup } from '@angular/forms';
import { PLAddReferralsNavigationService } from '../pl-add-referrals-navigation.service';
import { PLAddReferralsLocationYearService } from '../pl-add-referrals-location-year.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'pl-select-location',
    templateUrl: './pl-select-location.component.html',
    styleUrls: [
        './pl-select-location.component.less',
        '../pl-add-referrals.component.less',
    ],
})
export class PLSelectLocationComponent implements OnDestroy, OnInit {

    destroyed$ = new Subject<boolean>();
    locationSelectForm: FormGroup = new FormGroup({});
    model: any = {};

    // innocent until proven guilty, don't show error messages until we check validity
    orgSelected = true;
    locSelected = true;
    yearSelected = true;

    // lock organization, location selection when there's exactly one to choose from
    organizationLocked = false;
    locationLocked = false;

    // Flags for clearing the filters within the drop down option of Organization and Location
    clearDropDownLocationFilter = false;
    clearDropDownOrganizationFilter = false;

    constructor(private pLAddReferralsNavigationService: PLAddReferralsNavigationService,
                private locationService: PLAddReferralsLocationYearService,
                private activatedRoute: ActivatedRoute) {
        this.model = locationService;
        locationService.refetch();

        locationService.currentSchoolYear$.subscribe((currentSchoolYear: any) => {
            if (currentSchoolYear && currentSchoolYear.code) {
                this.model.selectedSchoolYearCode = currentSchoolYear.code;
            }
        });

        // in rare cases we can get an infinite redirect bug if we don't wait a smidge before calling this
        // https://presencelearning.atlassian.net/browse/DEV-2749
        setTimeout(() => {
            this.checkLockedLocationAndOrganization();
        }, 0);

        pLAddReferralsNavigationService.navigateRequested$.pipe(takeUntil(this.destroyed$)).subscribe(
            (stepIndex) => {
                if (this.checkValidity()) {
                    this.pLAddReferralsNavigationService.confirmNavigate(stepIndex);
                }
            },
        );

        locationService.getLocationsLoaded().pipe(takeUntil(this.destroyed$)).subscribe(
            (result: any) => {
                // in rare cases we can get an infinite redirect bug if we don't wait a smidge before calling this
                // https://presencelearning.atlassian.net/browse/DEV-2749
                setTimeout(() => {
                    this.checkLockedLocationAndOrganization();
                }, 0);
            },
        );
    }

    ngOnInit(): void {
        this.setOrgAndLocationFromQueryParams();
    }

    ngOnDestroy() {
        // prevent memory leak when component destroyed
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    setOrgAndLocationFromQueryParams(): void {
        this.activatedRoute.queryParams
            .pipe(first())
            .subscribe((params) => {
                if (params.location) {
                    this.model.selectedLocationID = params.location;
                }
                if (params.org) {
                    this.model.selectedOrganizationID = params.org;
                }
            });
    }

    checkValidity() {
        this.locSelected = this.model.selectedLocationID !== null;
        this.orgSelected = this.model.selectedOrganizationID !== null;
        this.yearSelected = this.model.selectedSchoolYearCode !== null;
        return this.locSelected && this.orgSelected && this.yearSelected;
    }

    clearOrganization() {
        this.model.selectedOrganizationID = null;
        this.clearDropDownFilters('organization');

        setTimeout(() => {
            this.locationService.filterLocationOptionsByParentOrg(null);
        }, 0);
    }

    clearYear() {
        this.model.selectedSchoolYearCode = null;
    }

    clearLocation() {
        this.model.selectedLocationID = null;
        this.clearDropDownFilters('location');
    }

    clearDropDownFilters(filterName: string) {
        let orgFilter = false;

        if (filterName === 'organization') {
            orgFilter = !orgFilter;
        }

        this.clearDropDownLocationFilter = true;
        this.clearDropDownOrganizationFilter = orgFilter;

        setTimeout(() => {
            this.clearDropDownLocationFilter = false;
            this.clearDropDownOrganizationFilter = false;
        }, 100);
    }

    // when an location is selected, select its parent location
    locationSelected(event: any) {
        const location = this.model.getLocationForId(event.model);
        this.model.selectedOrganizationID = location.parentId;
        this.locSelected = this.model.selectedLocationID !== null;
    }

    // when an organization is selected, filter the list of locations to those that have this org as their parent
    organizationSelected(event: any) {
        this.locationService.filterLocationOptionsByParentOrg(event.model);
        this.model.selectedLocationID = null;
        this.orgSelected = this.model.selectedOrganizationID !== null;
    }

    schoolYearSelected(event: any) {
        this.yearSelected = this.model.selectedSchoolYearCode !== null;
    }

    // there is a sliver of time where singleOrganization() can return true but organizationOpts is null,
    // hence the timeouts above
    private checkLockedLocationAndOrganization() {
        if (this.model.singleOrganization()) {
            this.model.selectedOrganizationID = this.model.organizationOpts[0].value;
            this.organizationLocked = true;
        } else {
            this.organizationLocked = false;
        }

        if (this.model.singleLocation()) {
            this.model.selectedLocationID = this.model.locationOpts[0].value;
            this.locationLocked = true;
        } else {
            this.locationLocked = false;
        }
    }

}
