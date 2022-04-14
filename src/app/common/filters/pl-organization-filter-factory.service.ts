import { Injectable } from '@angular/core';
import { PLAssignedLocationsService } from '../services/locations/pl-assigned-locations.service';
import { PLOrganizationFilter } from './pl-organization-filter';

@Injectable()
export class PLOrganizationFilterFactory {
    constructor(private locationsService: PLAssignedLocationsService) {}

    create(options: { value: string, label: string }): PLOrganizationFilter {
        return new PLOrganizationFilter(options, this.locationsService);
    }
}
