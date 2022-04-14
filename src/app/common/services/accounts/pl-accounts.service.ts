import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import { PLHttpService, PLUrlsService } from '@root/index';

import { PLApiAccount } from './pl-api-account';

interface QueryResults {
    count: number;
    results: PLApiAccount[];
}

interface QueryOptions {
    // On return accounts that the logged in user can manage.
    can_manage_account?: boolean;
    ordering?: string;
    limit?: number;
}

const immutableParams = {
    // Currently the service should _only_ return accounts that the calling user
    // can manage. If we want to make this an option that can be set via function
    // parameters, then change the order by which this object is merged with query
    // parameters.
    can_manage_account: true,
};

const emptyResult: QueryResults = {
    count: 0,
    results: [],
};

/**
 * PLAccountsService - fetch accounts (locations and organizations) assigned
 * to the logged-in user.
 *
 * This service will only return accounts that the logged-in user can manage.
 *
 * Note that the server will set an absolute limit on returned results to 1000
 * (as of 2018-11). If we need to fetch more than that, then we'll have to
 * support internal pagination.
 */
@Injectable()
export class PLAccountsService {
    public shareLevel: any = {
        ORG_ONLY: {
            code: 'ORG_ONLY',
            label: 'Organization',
        },
        LOC_ONLY: {
            code: 'LOC_ONLY',
            label: 'Location',
        },
    };

    constructor(
        private plHttp: PLHttpService,
        private plUrls: PLUrlsService,
    ) {}

    /**
     * getLocationsByID - fetch accounts by location IDs
     *
     * @return {Observable<QueryResults} - observable that emits a single result set
     * then completes.
     */
    getLocationsByID(ids: string[], options: QueryOptions = {}): Observable<QueryResults> {
        const params = {
            ...options,
            ...immutableParams,
            // API will clip at 20 unless we ask for more.
            limit: ids.length,
            location_id_in: ids.join(','),
        };

        if (ids.length > 0) {
            return this.plHttp.get('accounts', params);
        }

        return of(emptyResult);
    }

    /**
     * getOrgsByID - fetch accounts by organization IDs
     *
     * @return {Observable<QueryResults} - observable that emits a single result set
     * then completes.
     */
    getOrgsByID(ids: string[], options: QueryOptions = {}): Observable<QueryResults> {
        const params = {
            ...options,
            ...immutableParams,
            // API will clip at 20 unless we ask for more.
            limit: ids.length,
            organization_id_in: ids.join(','),
        };

        if (ids.length > 0) {
            return this.plHttp.get('accounts', params);
        }

        return of(emptyResult);
    }

    /**
     * getLocationsByName - fetch location accounts, searching by name. Note that
     * the API will clip the results to 20 unless a limit is specified in the query
     * options.
     *
     * @param {string} nameSearchTerm - search term for location name, case is ignored
     * @return {Observable<QueryResults} - observable that emits a single result set
     * then completes.
     */
    getLocationsByName(nameSearchTerm: string, options: QueryOptions = {}): Observable<QueryResults> {
        const params = {
            ...options,
            ...immutableParams,
            location_only: true,
            name__icontains: nameSearchTerm,
        };

        return this.plHttp.get('accounts', params);
    }

    /**
     * getOrgsByName - fetch organization accounts, searching by name. Note that
     * the API will clip the results to 20 unless a limit is specified in the query
     * options.
     *
     * @param {string} nameSearchTerm - search term for organization name, case is ignored
     * @return {Observable<QueryResults} - observable that emits a single result set
     * then completes.
     */
    getOrgsByName(nameSearchTerm: string, options: QueryOptions = {}): Observable<QueryResults> {
        const params = {
            ...options,
            ...immutableParams,
            organization_only: true,
            name__icontains: nameSearchTerm,
        };

        return this.plHttp.get('accounts', params);
    }

    getAccountPermissions(sfAccountId: any, perms: any[]): Observable<{ [key: string]: string[] }> {
        const params = {
            perms,
            account_uuid: sfAccountId,
        };

        return this.plHttp.get('', params, this.plUrls.urls.workplacePermissions);
    }

    getKeyDates(orgId: any, school_year: any) {
        const url = `${this.plUrls.urls.organizations}${orgId}/keydates/`;

        const params = {
            school_year,
        };

        return this.plHttp
            .get('', params, url)
            .pipe(
                map((res: any) => res.map((m: any) => (
                    { uuid: m.uuid, type: m.key_date_type.codename, date: m.date }
                ))),
            );
    }

    setKeyDates(orgId: any, dates: any[]) {
        const url = `${this.plUrls.urls.organizations}${orgId}/keydates/`;

        const calls: any[] = [];

        for (const d of dates) {
            const saveParams = {
                keydate__uuid: d.uuid,
                date: (d.date) ? d.date : null,
            };

            calls.push(this.plHttp.put('', saveParams, url));
        }

        return forkJoin(calls);
    }

    getBlackoutDates(orgId: any, school_year: any) {
        const url = `${this.plUrls.urls.organizations}${orgId}/blackoutdays/`;

        const params = {
            school_year,
        };

        return this.plHttp.get('', params, url);
    }

    setBlackoutDates(orgId: any, school_year: any, dates: any) {
        const url = `${this.plUrls.urls.organizations}${orgId}/blackoutdays/?school_year=${school_year}`;

        const saveParams = {
            uuid: '-', // need this to get PATCH instead of PUT...
            ...dates,
        };

        return this.plHttp.save('', saveParams, url);
    }
}
