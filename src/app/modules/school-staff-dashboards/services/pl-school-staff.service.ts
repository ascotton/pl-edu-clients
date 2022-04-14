import { Injectable, OnDestroy } from '@angular/core';
import { PLGraphQLService, PLHttpService } from '@root/index';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { first, catchError } from 'rxjs/operators';
import { PLOrganization } from '../models';
import { PLQueryOptions } from './models';

interface PLProviderType {
    name: string;
    count: number;
}

interface PLLicenseType {
    name: string;
    total: number;
    assigned: number;
}

interface PLLicensesType {
    total: number;
    assigned: number;
    available: number;
    results: PLLicenseType[];
}

export interface PLTrainingUser {
    uuid: string;
    email: string;
    first_name: string;
    last_name: string;
    is_admin: boolean;
    license: string;
    license_type: any; // TODO
    live_training_date: any; // TODO
    teletherapy_foundations_training_date: any; // TODO
    occupation: string;
    username: string;
    live_training_state: string;
    teletherapy_foundations_training_progress: number;
    teletherapy_foundations_training_version: string;
    most_recent_activity?: any; // TODO
    sessions_last_30_days?: number;
}

export interface PLTrainingUserResults {
    results: PLTrainingUser[];
    count: number;
}

interface PLLiveTraining {
    attended: number;
    total?: number;
}

interface PLTeletherapyFoundationsTraining {
    completed: number;
    in_progress: number;
    total?: number;
}

@Injectable()
export class PLSchoolStaffService implements OnDestroy {

    private _dashboard$: BehaviorSubject<{ loading: boolean, data?: any }> = new BehaviorSubject({ loading: true });
    private _userActivity$: BehaviorSubject<{ loading: boolean, data?: any }> = new BehaviorSubject({ loading: true });

    get dashboard$() {
        return this._dashboard$.asObservable();
    }
    get userActivity$() {
        return this._userActivity$.asObservable();
    }

    private readonly GQL_ORGANIZATION_FIELDS = `
        id
        name
        sfAccountId
        isGroupOrganization
        accountCam {
            firstName
            lastName
        }
        accountOwner {
            email
            firstName
            lastName
            profile {
                primaryPhone
            }
        }`;

    private readonly GQL_ORGANIZATIONS = `
        query organizations($first: Int!, $offset: Int, $orderBy: String, $name_Icontains: String) {
            organizations(includeProspects: true, excludeIfHasVirtualLocation: true, first: $first, offset: $offset, orderBy: $orderBy, name_Icontains: $name_Icontains) {
                totalCount
                edges {
                    node {
                        ${this.GQL_ORGANIZATION_FIELDS}
                    }
                }
            }
        }`;

    private readonly GQL_ORGANIZATION = `
        query organization($id: ID!) {
            organization(id: $id) {
                ${this.GQL_ORGANIZATION_FIELDS}
            }
        }`;

    constructor(private plGQL: PLGraphQLService, private plHttp: PLHttpService) { }

    ngOnDestroy() {
        this._dashboard$.complete();
        this._userActivity$.complete();
    }

    fetchOrganizations() {
        return this.plGQL
            .query(this.GQL_ORGANIZATIONS, { first: 100 }, { debug: false })
            .pipe(first());
    }

    fetchOrganization(id: string) {
        return this.plGQL
            .query(this.GQL_ORGANIZATION, { id }, { debug: false })
            .pipe(first());
    }

    fetchPlatformUserActivity(account: string, schoolYear?: string): Observable<{ days: { [key: number]: number }}> {
        let params = `account=${account}`;
        if (!!schoolYear) {
            params = `${params}&school_year=${schoolYear}`;
        }
        const httpOpts = {
            url: `${this.plHttp.formUrl('usage')}user_activity/?${params}`,
            method: 'GET',
        };
        return this.plHttp.go(httpOpts).pipe(
            first(),
            // TODO: Handle Errors
            catchError(() => of(null)),
        );
    }

    /**
     * API call to get a csv file of User Activity
     *
     * @param start Start Date
     * @param end End Data,
     * @param sy: School Year Id
     * @param account: Organization sfAccountId
     */
    userActivityReport(account: string, start: string, end: string, sy?: string): Observable<Blob> {
        let params = `account=${account}&start_date=${start}&end_date=${end}`;
        if (!!sy) {
            params = `${params}&school_year=${sy}`;
        }
        const httpOpts = {
            url: `${this.plHttp.formUrl('usage')}user_activity_report/?${params}`,
            method: 'GET',
            responseType: 'blob',
        };
        return this.plHttp.go(httpOpts);
    }

    private fetchSSP<T>(url: string, organization: string, params = ''): Observable<T> {
        const httpOpts = {
            url: `${this.plHttp.formUrl('ssp')}${url}/?organization=${organization}${params}`,
            method: 'GET',
        };
        return this.plHttp.go(httpOpts)
            .pipe(
                first(),
                // TODO: Handle Errors
                catchError(() => of(null)),
            );
    }

    fetchDashboardData(organization: string, schoolYear?: string): Observable<any> {
        let params = '';
        if (!!schoolYear) {
            params = `&school_year=${schoolYear}${params}`;
        }
        return this.fetchSSP<{
            total_providers: number;
            providers_type: PLProviderType[];
            licenses_type: PLLicensesType;
            teletherapy_foundations_training: PLTeletherapyFoundationsTraining;
            live_training: { attended: number, total: number };
        }>('admin_dashboard', organization, params);
    }

    fetchProviderByType(organization: string) {
        return this.fetchSSP<{ results: PLProviderType[] }>('type_count', organization);
    }

    fetchPlatformLicenses(organization: string) {
        return this.fetchSSP<PLLicensesType>('licenses_count', organization);
    }

    /**
     * API call to get Teletherapy Foundation Training Data
     *
     * @param organization: Organization Id
     * @param school_year: TBD
     */
    fetchTeletherapyFoundationsTraining(organization: string, school_year?: string):
        Observable<PLTeletherapyFoundationsTraining> {
        let params = `organization=${organization}`;
        if (!!school_year) {
            params = `${params}&school_year=${school_year}`;
        }
        const httpOpts = {
            url: `${this.plHttp.formUrl('coassemble')}foundations_training_progress?${params}`,
            method: 'GET',
        };
        return this.plHttp.go(httpOpts);
    }

    /**
     * API call to get Live Training Data
     *
     * @param organization: Organization Id
     * @param school_year: TBD
     */
    fetchLiveTraining(organization: string, school_year?: string): Observable<PLLiveTraining> {
        let params = `organization=${organization}`;
        if (!!school_year) {
            params = `${params}&school_year=${school_year}`;
        }
        const httpOpts = {
            url: `${this.plHttp.formUrl('ssp')}live_training_count?${params}`,
            method: 'GET',
        };
        return this.plHttp.go(httpOpts);
    }

    fetchUser(uuid: string): Observable<PLTrainingUser> {
        const httpOpts = {
            url: `${this.plHttp.formUrl('ssp')}users/${uuid}`,
            method: 'GET',
        };
        return this.plHttp.go(httpOpts);
    }
}
