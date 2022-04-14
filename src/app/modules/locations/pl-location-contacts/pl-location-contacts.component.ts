import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { PLLocationService } from '../pl-location.service';

@Component({
    selector: 'pl-location-providers',
    templateUrl: './pl-location-contacts.component.html',
    styleUrls: ['./pl-location-contacts.component.less'],
})
export class PLLocationContactsComponent implements OnInit {
    @Input() location: any = {};

    locationSubscription: any;
    isReady = false;
    sfAccountId: string;
    organization: any;

    constructor(
        private plLocation: PLLocationService,
    ) {
    }

    ngOnInit() {
        this.locationSubscription = this.plLocation.getFromRoute().subscribe((res: any) => {
            this.location = res.location;
            this.sfAccountId = this.location.sfAccountId;
            this.organization = this.location.parent;

            this.isReady = true;
        });
    }

    ngOnDestroy(): void {
        this.locationSubscription.unsubscribe();
    }
}
