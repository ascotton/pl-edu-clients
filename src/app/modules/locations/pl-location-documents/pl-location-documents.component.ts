import { Component, OnDestroy, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { PLLocationService } from '../pl-location.service';
import { PLSchoolYearsService } from '@common/services/';

@Component({
    selector: 'pl-location-documents',
    templateUrl: './pl-location-documents.component.html',
    styleUrls: ['./pl-location-documents.component.less'],
})
export class PLLocationDocumentsComponent implements OnDestroy, OnInit {
    location: any;
    locationId: string;
    locationSubscription: any;
    selectedSchoolYear: string;
    selectedSchoolYearId: any;
    mayUpload = true;
    mayDelete = true;

    constructor(
        private plLocation: PLLocationService,
        private schoolYearService: PLSchoolYearsService,
    ) { }

    ngOnInit() {
        this.locationSubscription = this.plLocation.getFromRoute().subscribe((res: any) => {
            this.location = res.location;
            this.locationId = res.location.id;
        });

        this.schoolYearService.getYearsData().pipe(first()).subscribe(() => {
            this.schoolYearService.getCurrentSchoolYear().pipe(first()).subscribe((year: any) => {
                this.selectedSchoolYearId = year.id;
            });
        });
    }

    ngOnDestroy(): void {
        this.locationSubscription.unsubscribe();
    }

    onYearSelected(evt: any): void {
        this.selectedSchoolYear = evt.model;
        const selectedSchoolYearFull = this.schoolYearService.getYearForCode(this.selectedSchoolYear);
        if (selectedSchoolYearFull) {
            this.selectedSchoolYearId = selectedSchoolYearFull.id;
        }
    }

}
