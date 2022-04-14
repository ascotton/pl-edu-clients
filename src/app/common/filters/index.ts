import { NgModule } from '@angular/core';

import { PLLocationFilterFactory } from './pl-location-filter-factory.service';
import { PLOrganizationFilterFactory } from './pl-organization-filter-factory.service';

@NgModule({
    providers: [
        PLLocationFilterFactory,
        PLOrganizationFilterFactory,
    ],
})
export class FiltersModule {}

export { PLMultiSelectApiFilter } from './pl-multi-select-api-filter';

export { PLLocationFilter } from './pl-location-filter';
export { PLLocationFilterFactory };
export { PLOrganizationFilter } from './pl-organization-filter';
export { PLOrganizationFilterFactory };
export { PLLocationsOrganizationsLimiter } from './pl-locations-organizations-limiter';
