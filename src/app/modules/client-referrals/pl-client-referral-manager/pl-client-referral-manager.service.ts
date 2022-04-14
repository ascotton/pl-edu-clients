import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Option } from '@common/interfaces';
import {
    PLAssignedLocationsService,
    PLLocationsOrgsMapping,
} from '@common/services';

interface GetOrganizationOptions {
    accountCam?: string;
}

@Injectable()
export class PLClientReferralManagerService {
    constructor(private locationsService: PLAssignedLocationsService) {}

    getOrganizationOptions(options: GetOrganizationOptions = {}): Observable<Option[]> {
        return this.locationsService.getAllLocationsOnceAsMapping(options).pipe(
            map((mapping: PLLocationsOrgsMapping) => mapping.getOrganizationOptions()),
        );
    }
}
