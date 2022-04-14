import { Injectable } from '@angular/core';
import { PLHttpService } from '@root/index';
import { Observable, of, forkJoin } from 'rxjs';
import { map, first, catchError } from 'rxjs/operators';

import { Option } from '@common/interfaces';
import { PLLicenseType, PLPlatformUser } from '../models';
import { PLQueryOptions } from './models';
import { PLTrainingUserResults } from './pl-school-staff.service';

@Injectable()
export class PLPlatformUsersService {
    constructor(private plHttp: PLHttpService) { }

    getUserTypes(license: PLLicenseType, userTypes: Option[]) {
        return [...userTypes].filter(ut =>
            license.occupations.includes(<string>ut.value));
    }

    getLicenses(userType: string, licenses: PLLicenseType[]): PLLicenseType[] {
        return licenses.filter(l => l.total_quantity && l.occupations.includes(userType));
    }

    private mapUsers(user: PLPlatformUser, organization: string, school_year: string, adminLicenses: string[]) {
        const isAdminLicense = adminLicenses.includes(user.licenseType);
        return {
            school_year,
            organization,
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
            license: user.licenseType,
            occupation: user.occupation,
            is_admin: isAdminLicense ? false : !!user.adminAccess,
        };
    }

    /**
     * API call to create a user and assign a license
     * @param user User to be saved
     * @param organization Organization Id
     * @param school_year School Year Id
     */
    addUser(user: PLPlatformUser, organization: string, school_year: string, adminLicenses: string[]): Observable<any> {
        const body = this.mapUsers(user, organization, school_year, adminLicenses);
        const httpOpts = {
            body,
            method: 'POST',
            url: this.plHttp.formUrl('userLicense'),
        };
        return this.plHttp.go(httpOpts, '', { suppressError: true })
            .pipe(first());
    }

    /**
     * API call to create a list of users and assign a license
     * @param users List of users to be saved
     * @param organization Organization Id
     * @param school_year School Year Id
     */
    addMultipleUsers(users: PLPlatformUser[], organization: string, school_year: string, adminLicenses: string[])
        : Observable<any> {
        const user_licenses = users.map(user =>
            this.mapUsers(user, organization, school_year, adminLicenses));
        const httpOpts = {
            body: {
                organization,
                user_licenses,
            },
            method: 'POST',
            url: `${this.plHttp.formUrl('userLicense')}bulk_add/`,
        };
        return this.plHttp.go(httpOpts, '', { suppressError: true })
            .pipe(first());
    }

    /**
     * API call to desactivate a platform user
     * @param uuid
     */
    deactivateUser(uuid: string): Observable<any> {
        const httpOpts = {
            method: 'DELETE',
            url: `${this.plHttp.formUrl('userLicense')}${uuid}/change_activation/`,
        };
        return this.plHttp.go(httpOpts, '', { suppressError: true })
            .pipe(first());
    }

    /**
     * API call to re-send set password email
     * @param uuid
     */
     sendPasswordEmail(uuid: string, organization: string): Observable<any> {
        const httpOpts = {
            method: 'POST',
            url: `${this.plHttp.formUrl('userLicense')}${uuid}/send_reset_password_email/`,
            body: { organization },
        };
        return this.plHttp.go(httpOpts, '', { suppressError: true })
            .pipe(first());
    }

    private createUserParams(options: PLQueryOptions): string {
        const { limit, page, ordering, search } = options;
        let params = `&limit=${limit}&page=${page}`;
        if (ordering) {
            params = `${params}&ordering=${ordering}`;
        }
        if (search) {
            const { lastName, firstName, isActive } = search;
            if (lastName) {
                params = `${params}&user__last_name__icontains=${lastName}`;
            }
            if (firstName) {
                params = `${params}&user__first_name__icontains=${firstName}`;
            }
            if (!lastName && !firstName && isActive !== null) {
                params = `${params}&is_active=${isActive}`;
            }
        }
        return params;
    }

    /**
     * API call to get list of platform users
     * @param organization Organization sfAccountId
     * @param school_year School Year Id
     */
    fetchPlatformUserList(organization: string, SY: string, options: PLQueryOptions)
        : Observable<PLTrainingUserResults> {
        let params = this.createUserParams(options);
        if (!!SY) {
            params = `&school_year=${SY}${params}`;
        }
        const httpOpts = {
            url: `${this.plHttp.formUrl('platform_ssp')}?account=${organization}${params}`,
            method: 'GET',
        };
        return this.plHttp.go(httpOpts, '', { suppressError: true });
    }

    /**
     * API call to get list of platform users
     * @param organization Organization Id
     * @param school_year School Year Id
     */
    fetchUserList(organization: string, SY: string, options: PLQueryOptions): Observable<PLTrainingUserResults> {
        let params = this.createUserParams(options);
        if (!!SY) {
            params = `&school_year=${SY}${params}`;
        }
        const httpOpts = {
            url: `${this.plHttp.formUrl('ssp')}users/?organization=${organization}${params}`,
            method: 'GET',
        };
        return this.plHttp.go(httpOpts, '', { suppressError: true });
    }

    /**
     * API call to get list of platform users
     * @param organization Organization Id
     * @param school_year School Year Id
     */
    fetchUsers(organization: string, SY: string, options: PLQueryOptions)
        : Observable<PLTrainingUserResults> {
        const params = this.createUserParams(options);
        const httpOpts = {
            url: `${this.plHttp.formUrl('userLicense')}?organization=${organization}&school_year=${SY}${params}`,
            method: 'GET',
        };
        return this.plHttp.go(httpOpts, '', { suppressError: true });
    }

    /**
     * Merge 2 API calls to get licenses assigned to an account
     * @param organization Organization Id
     * @param school_year School Year Code
     */
    fetchMergedLicenses(organization: string, school_year?: string, type?: string): Observable<PLLicenseType[]> {
        return forkJoin([
            this.fetchLicenses(organization, school_year, type),
            this.fetchAccountLicenses(organization, school_year, type),
        ]).pipe(
            map(([licenses, accountLicenses]) =>
                Object.keys(accountLicenses).map((licenseName) => {
                    const license = licenses.find(l => l.license_name === licenseName);
                    if (license) {
                        const { used: quantity_used, total: total_quantity } =
                            accountLicenses[licenseName] || { total: 0, used: 0 };
                        const quantity_remaining = total_quantity - quantity_used;
                        return {
                            ...license,
                            quantity_used,
                            quantity_remaining,
                            total_quantity,
                        };
                    }
                    return null;
                }).filter(l => !!l),
            ),
        );
    }

    /**
     * API call to get list of licenses
     * @param organization Organization Id
     * @param school_year School Year Code
     */
    fetchLicenses(organization: string, school_year: string, type?: string): Observable<PLLicenseType[]> {
        let params: any = { organization };
        if (school_year) {
            params = { ...params, school_year };
        }
        if (type) {
            params = { ...params, type };
        }
        return this.plHttp.get('license', params,
            '', { suppressError: true }).pipe(
            map(({ results }) => results),
        );
    }

    /**
     * API call to get list of licenses assigned to an organization
     * @param organization Organization Id
     * @param school_year School Year Code
     */
    fetchAccountLicenses(organization: string, school_year: string, type?: string): Observable<any> {
        let params: any = { organization };
        if (school_year) {
            params = { ...params, school_year };
        }
        if (type) {
            params = { ...params, type };
        }
        return this.plHttp.get('accountLicense', params, '',
            { suppressError: true }).pipe(
            map(({ licenses }) => licenses || {}),
            catchError(err => of({})),
        );
    }
}
