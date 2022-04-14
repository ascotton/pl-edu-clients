import {Component} from '@angular/core';

@Component({
    selector: 'pl-location-banner',
    template:  `<div class="location-banner">
                    <pl-icon [svg]="'location'" [scale]="2.0"></pl-icon>
                    <span>{{locationName}}</span>
                </div>`,
    styleUrls: ['./pl-location-banner.component.less'],
    inputs: ['locationName'],
})
export class PLLocationBannerComponent {
    locationName = '';
}
