import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
// RxJs
import { map, first } from 'rxjs/operators';
// Service
import { PLAssignedLocationsService } from '../services';

@Injectable()
export class AssignedLocationsResolver implements Resolve<any[]> {

    constructor(private service: PLAssignedLocationsService) {}

    resolve() {
        return this.service.getAllLocationsOnce().pipe(
            map(({ locations }) => locations),
            first());
    }
}
