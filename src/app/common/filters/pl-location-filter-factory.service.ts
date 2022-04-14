import { Injectable } from '@angular/core';
import { PLAssignedLocationsService } from '../services/locations/pl-assigned-locations.service';
import { PLLocationFilter } from './pl-location-filter';

@Injectable()
export class PLLocationFilterFactory {
    constructor(private plAssignedLocationsService: PLAssignedLocationsService) {}

    create(options: { value: string, label: string, placeholder?: string }): PLLocationFilter {
        return new PLLocationFilter(options, this.plAssignedLocationsService);
    }
}
