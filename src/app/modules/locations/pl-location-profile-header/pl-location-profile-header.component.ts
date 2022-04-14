import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';

import { PLLinkService, PLApiUsStatesService } from '@root/index';
import { PLLocationService } from '../pl-location.service';

@Component({
    selector: 'pl-location-profile-header',
    templateUrl: './pl-location-profile-header.component.html',
    styleUrls: ['./pl-location-profile-header.component.less'],
})
export class PLLocationProfileHeaderComponent {
    @Input() location: any = {};

    backLink = '';

    constructor(
        private plLink: PLLinkService,
        private store: Store<any>,
        private locationService: PLLocationService,
        private plApiUSStates: PLApiUsStatesService,
    ) {
        store.select('backLink')
            .subscribe((previousState: any) => {
                this.backLink = previousState.title;
            });
    }

    ngOnInit() {
    }

    ngOnChanges(changes: any) {
        if (changes.location) {
            this.location = {
                ...this.location, 
                xWebsite: this.location.parent && this.location.parent.website
                    ? this.location.parent.website : '',
                xState: this.location.state ? this.plApiUSStates.getFromPostalCode(this.location.state)
                    : '',
            };
        }
    }

    showOrgLink(): boolean {
        return this.location && this.location.organization && !this.locationService.isVirtual(this.location);
    }

    onClose() {
        this.plLink.goBack();
    }

    isVirtual(): boolean {
        return this.locationService.isVirtual(this.location);
    }

    iconClass(): any {
        return {
            virtual: this.isVirtual(),
            'brick-and-mortar': !this.isVirtual(),
        };
    }
}
