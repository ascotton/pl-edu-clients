import { Component } from '@angular/core';

import * as moment from 'moment';

import { PLLocationService } from '../pl-location.service';

import { User } from '@modules/user/user.model';
import { CurrentUserService } from '@modules/user/current-user.service';
import { PLMayService } from '@root/index';

@Component({
    selector: 'pl-location-overview',
    templateUrl: './pl-location-overview.component.html',
    styleUrls: ['../../../common/less/app/card-section.less', './pl-location-overview.component.less'],
})
export class PLLocationOverviewComponent {
    location: any = {};
    clientStats: any;

    private locationSubscription: any = null;

    constructor(
        private plLocation: PLLocationService,
        private plMay: PLMayService,
        private plCurrentUserService: CurrentUserService,
    ) {}

    ngOnInit() {
        this.locationSubscription = this.plLocation.getFromRoute()
            .subscribe((res: any) => {
                this.location = res.location;
                this.location.type = this.plLocation.getType(this.location);

                // add address fields to mirror the transformation in PLOrganizationsService.orgOverviewById()
                const address = res.location.shippingAddress;

                Object.assign(this.location, {
                    street: address.street || '',
                    city: address.city || '',
                    stateCode: address.state || '',
                    postalCode: address.postalCode || '',
                });

                // materials ordering: customer admins and providers only (where allowed)
                this.plCurrentUserService.getCurrentUser().subscribe((user: User) => {
                    if (
                        this.plMay.isAdminType(user) ||
                        this.plMay.isCustomerAdmin(user) ||
                        (this.plMay.isProvider(user) && !this.location.preventProvidersOrderingMaterials)
                     ) {
                        const link = `https://www.tfaforms.com/4847488/` +
                            `?accid=${this.location.salesforceId}` +
                            `&tfa_1=${encodeURIComponent(user.first_name)}` +
                            `&tfa_3083=${encodeURIComponent(user.last_name)}` +
                            `&tfa_2=${encodeURIComponent(user.email)}`
                        ;

                        Object.assign(this.location, {
                            equipmentOrderUrl: link,
                        });
                    }
                });

                this.plLocation.getLocationClientAggregates(this.location.id).subscribe((res2: any) => {
                    this.clientStats = res2.clientStats;
                    this.clientStats.nextMonthName = moment().add(1, 'months').format('MMMM');
                });
            });
    }

    ngOnDestroy() {
        this.locationSubscription.unsubscribe();
    }

    isVirtual(): boolean {
        return this.plLocation.isVirtual(this.location);
    }
}
