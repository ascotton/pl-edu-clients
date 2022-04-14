import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { PLLocationsService, PLSchoolYearsService } from '@common/services/';
import { Option } from '@common/interfaces';
import { Subscription, Subject, Observable } from 'rxjs';

@Injectable()
export class PLAddReferralsLocationYearService implements OnDestroy, OnInit {
    selectedOrganizationID: string = null;
    organizationOpts: Option[] = [];

    selectedLocationID: string = null;
    loadingLocations: boolean = true;
    locationOpts: Option[] = [];

    schoolYearOpts: Option[] = [];
    selectedSchoolYearCode: string = null;

    locationsSubscription: Subscription;
    yearsSubscription: Subscription;
    currentSchoolYear$: Observable<any>;

    private locationsObservers: any[] = [];

    constructor(private locationsService: PLLocationsService, private yearsService: PLSchoolYearsService) {
        if (!this.locationsService.loadingLocations) {
            this.locationsService.beginFetch();
        }

        this.locationsSubscription = this.locationsService.getLocationsData().subscribe(
            (result:any) => {
                this.loadingLocations = this.locationsService.loadingLocations;
                setTimeout(() => {
                    this.updateValuesFromLocationService();
                }, 0);
            },
        );
        this.yearsSubscription = this.yearsService.getYearsData().subscribe(
            (result:any) => {
                this.loadingLocations = false;
                setTimeout(() => {
                    this.updateValuesFromYearsService();
                }, 0);
            },
        );
        this.currentSchoolYear$ = this.yearsService.getCurrentSchoolYear();
    }

    refetch() {
        if (!this.locationsService.loadingLocations) {
            for (const obs of this.locationsObservers) {
                obs.next(this);
            }

            this.locationsService.beginFetch();
        }
    }

    getLocationsLoaded() {
        return new Observable((observer: any) => {
            this.locationsObservers.push(observer);
            for (const obs of this.locationsObservers) {
                obs.next(this);
            }
        });
    }

    updateValuesFromYearsService() {
        this.schoolYearOpts = this.yearsService.getYearOptions().slice(-3).reverse();
    }

    updateValuesFromLocationService() {
        if (!this.loadingLocations) {
            this.locationOpts = this.locationsService.getLocationOptions();
            this.organizationOpts = this.locationsService.getOrganizationOptions();
            for (const obs of this.locationsObservers) {
                obs.next(this);
            }
        }
    }

    ngOnInit() {
    }

    ngOnDestroy() {
        // prevent memory leak when component destroyed
        this.locationsSubscription.unsubscribe();
    }

    reset() {
        this.selectedOrganizationID = null;
        this.selectedLocationID = null;
        this.selectedSchoolYearCode = null;
    }

    singleLocation() {
        return this.locationsService.getLocationCount() === 1;
    }

    singleOrganization() {
        return this.locationsService.getOrganizationCount() === 1;
    }

    filterLocationOptionsByParentOrg(orgId: string) {
        this.locationOpts = this.locationsService.getLocationOptionsForParentOrg(orgId);
        this.selectedLocationID = null;
    }

    getSelectedLocationName() {
        return this.selectedLocationID ? this.locationsService.getLocationNameForID(this.selectedLocationID) : '';
    }

    getSelectedOrganizationName() {
        return this.selectedOrganizationID ?
            this.locationsService.getOrganizationNameForID(this.selectedOrganizationID) : '';
    }

    getLocationForId(id: string) {
        return this.locationsService.getLocationForID(id);
    }
}
