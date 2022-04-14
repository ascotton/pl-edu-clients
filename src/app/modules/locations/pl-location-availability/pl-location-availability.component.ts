import { Component, OnDestroy, OnInit } from '@angular/core';

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

import { PLLocationService } from '../pl-location.service';

import { PLSchoolYearsService } from '@common/services';

import { CanComponentDeactivate } from '@common/can-deactivate-guard.service';

import { PLConfirmDialogService } from '@root/index';

@Component({
    selector: 'pl-location-availability',
    templateUrl: './pl-location-availability.component.html',
    styleUrls: ['./pl-location-availability.component.less'],
})
export class PLLocationAvailabilityComponent implements OnDestroy, OnInit, CanComponentDeactivate {
    locationSubscription: any;
    location: any;
    selectedSchoolYear: String;
    isDirty = false;

    private unload: any;

    constructor(
        private plLocation: PLLocationService,
        private schoolYearService: PLSchoolYearsService,
        private plConfirm: PLConfirmDialogService,
    ) {}

    ngOnInit() {
        this.locationSubscription = this.plLocation.getFromRoute().subscribe((res: any) => {
            this.location = res.location;

            this.schoolYearService
                .getCurrentSchoolYearCode()
                .pipe(first())
                .subscribe((year: string) => {
                    this.selectedSchoolYear = year;
                });
        });

        this.unload = (event: any) => {
            if (this.isDirty) event.returnValue = 'Are you sure you want to close this window?';
        };

        window.addEventListener('beforeunload', this.unload);
    }

    ngOnDestroy(): void {
        this.locationSubscription.unsubscribe();
        window.removeEventListener('beforeunload', this.unload);
    }

    canDeactivate() {
        if (!this.isDirty) return true;

        return new Observable<boolean>((observer: any) => {
            this.plConfirm.show({
                header: 'Unsaved Changes',
                content:   `<div style="padding-bottom:12px;">Are you sure you want to leave this page?</div>
                            <div>Click 'Yes' to exit (and lose any changes), or 'No' to return.</div>`,
                primaryLabel: 'Yes',
                secondaryLabel: 'No',
                primaryCallback: () => {
                    observer.next(true);
                },
                secondaryCallback: () => {
                    observer.next(false);
                },
                closeCallback: () => {
                    observer.next(false);
                },
            });
        });
    }

    onYearSelected(year: string): void {
        this.selectedSchoolYear = year;
    }

    onIsDirtyChanged(isDirty: boolean) {
        this.isDirty = isDirty;
    }

    isVirtual(): boolean {
        return this.plLocation.isVirtual(this.location);
    }
}
