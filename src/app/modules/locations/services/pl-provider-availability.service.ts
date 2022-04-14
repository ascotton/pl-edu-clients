import * as moment from 'moment';

import { Injectable } from '@angular/core';
import { PLGraphQLService } from '@root/index';
// RxJs
import { Observable, of } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';
// Models
import { PLAvailability } from '@common/interfaces';

export interface PLProviderAvailability {
    availabilityPreference: {
        maxWeeklyHours: number;
        modified?: string;
    };
    availabilityBlocks: PLAvailability[];
}

export interface PLProviderAvailabilityFreshness {
    rawData: PLProviderAvailability;
    isFirstTime: boolean;
    status: {
        code: string;
        value: number;
    };
    daysStale?: number;
    daysLeft?: number;
}

@Injectable()
export class PLProviderAvailabilityService {

    private readonly GQL_GET_AVAILABILITY = `
    query ProviderAvailability($providerUuid: UUID) {
        availabilityPreference {
            maxWeeklyHours
            modified
        }
        availabilityBlocks(providerId: $providerUuid) {
            day
            start
            end
            uuid
            modified
        }
    }`;

    private _providers: { [key: string]: PLAvailability[] } = {};

    constructor(private plGraphQL: PLGraphQLService) { }

    getFreshnessInfo(providerAvailability: PLProviderAvailability): PLProviderAvailabilityFreshness {
        // how many days until refresh is required/forced
        const MAX_STALE_DAYS = 30;
        // how many days to show update warning message
        const WARNING_GRACE_PERIOD_DAYS = 5;
        // set some default values
        const result: PLProviderAvailabilityFreshness = {
            rawData: providerAvailability,
            isFirstTime: true,
            status: {
                code: 'FORCE',
                value: 2,
            },
        };
        const prefs = providerAvailability.availabilityPreference;
        if (prefs) {
            const today = moment().startOf('day');
            const lastModified = moment(prefs.modified).startOf('day');
            result.daysStale = today.diff(lastModified, 'days');
            result.daysLeft = MAX_STALE_DAYS - result.daysStale;
            result.isFirstTime = false;
            const days = MAX_STALE_DAYS - WARNING_GRACE_PERIOD_DAYS;
            if (result.daysStale >= days && result.daysStale < MAX_STALE_DAYS) {
                result.status = {
                    code: 'WARNING',
                    value: 1,
                };
            } else if (result.daysStale < days) {
                result.status = {
                    code: 'READY',
                    value: 0,
                };
            }
        }
        return result;
    }

    get(providerUuid: string): Observable<PLAvailability[]> {
        const availability = this._providers[providerUuid];
        return availability ?
            of(availability) :
            this.fetch(providerUuid).pipe(
                map(({ availabilityBlocks }) => availabilityBlocks),
                tap((availabilityBlocks) => {
                    this._providers[providerUuid] = availabilityBlocks;
                }));
    }

    fetch(providerUuid?: string): Observable<PLProviderAvailability> {
        let params: any = { };
        if (providerUuid) {
            params = { ...params, providerUuid };
        }
        return this.plGraphQL.query(this.GQL_GET_AVAILABILITY, params).pipe(
            first(),
        );
    }
}
