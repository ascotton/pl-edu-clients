import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
// Store
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
// RxJs
import { Observable, of } from 'rxjs';
import { first, map, catchError } from 'rxjs/operators';
// Services
import { PLGraphQLService } from '@root/index';
// Models
import { PLLocationAvailability } from '@common/interfaces';
import { PLLocation } from '../models';
// Queries
const locationQuery = require('../queries/location.graphql');

// TODO: Have this service replace PLLocationService
@Injectable()
export class PLLocationService2 {
    // What is it need for?
    private mayViewPhi = false;
    private mayViewPii = false;
    private mayViewLocation = false;
    private permissionCode: number;

    private readonly availabilityQuery = `query locationAvailability($id: UUID!, $schoolYear: String!) {
        locationAvailabilityBlocks(locationId: $id, schoolYear: $schoolYear) {
            edges {
                node {
                    uuid
                    day
                    start
                    end
                    dayName
                    availableStations
                }
            }
        }
    }`;

    constructor(private plGraphQL: PLGraphQLService, private store: Store<AppStore>) { }

    getAvailability(locationUuid: string, schoolYear: string): Observable<PLLocationAvailability[]> {
        return this.plGraphQL.query(this.availabilityQuery, { schoolYear, id: locationUuid }).pipe(
            map(({ locationAvailabilityBlocks }) => locationAvailabilityBlocks),
            first());
    }

    getLocation(id: string): Observable<PLLocation> {
        return this.plGraphQL.query(locationQuery, { id }).pipe(
            map(({ location }) => ({
                ...location,
                // TODO: Hack for those Locations that don't have timezone
                timezone: location.timezone || 'America/Los_Angeles',
            })),
            catchError((err: HttpErrorResponse) => {
                if (err.status === 403 || err.status === 404) {
                    // this.permissionCode = err.status;
                }
                return of(null);
            }),
            first(),
        );
    }
}
