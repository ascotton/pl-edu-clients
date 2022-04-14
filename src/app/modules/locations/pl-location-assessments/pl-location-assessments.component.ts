import { Component, OnInit } from '@angular/core';
import { PLLocationService } from '../pl-location.service';

@Component({
    selector: 'pl-location-assessments',
    templateUrl: './pl-location-assessments.component.html',
})
export class PLLocationAssessmentsComponent implements OnInit {
    location: any = {};
    loading = false;

    constructor(
        private plLocation: PLLocationService,
    ) { }

    ngOnInit(): void {
        this.loading = true;
        this.plLocation.getFromRoute()
            .subscribe((res: any) => {
                this.location = res.location;
                this.loading = false;
            });
    }
}
