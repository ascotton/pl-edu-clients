import { Injectable } from '@angular/core';

import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs/operators';
import { Observable, ReplaySubject, zip, combineLatest } from 'rxjs';

import {
    PLJWTDecoder,
    PLHttpAuthService,
    PLHttpService,
    PLGraphQLService,
} from '@root/index';

import { User } from './user.model';
import { AppStore } from '@app/appstore.model';
import { PLUserService } from '../users/pl-user.service';

const userSelfQuery = require('./queries/user-self.graphql');
const lastSeenMutation = require('./queries/last-seen.graphql');
const providerProfileQuery = require('./queries/provider-profile.graphql');

@Injectable()
export class CurrentUserService {
    public static PROVIDER_CODE_SLP = 'slp';
    public static PROVIDER_CODE_OT = 'ot';
    public static PROVIDER_CODE_MHP = 'mhp';
    public static PROVIDER_CODE_PA = 'pa';

    public static MAP_PROVIDER_TYPE_TO_SERVICE_TYPE = {
        mhp: 'bmh',
        ot: 'ot',
        slp: 'slt',
        pa: 'pa',
        sped: 'sped',
    };

    // isLoggedIn: boolean = false;
    // this ensures that the router can always get the most recent value set, but only once it becomes available at all
    private _isLoggedIn$ = new ReplaySubject(1);
    get isLoggedIn$() { return this._isLoggedIn$.asObservable(); }

    private _jwt$ = new ReplaySubject<PLJWTDecoder>(1);
    get jwt$() { return this._jwt$.asObservable(); }

    // store the URL so we can redirect after logging in
    // redirectUrl: string;
    userCache: any = {};
    jwt: string = '';

    constructor(
        private plHttp: PLHttpService, 
        private store: Store<AppStore>,
        private plUserSvc: PLUserService,
        private plGraphQL: PLGraphQLService,
        private plHttpAuth: PLHttpAuthService, 
    ) {}

    login() {
        this.plHttpAuth.login();
    }

    logout() {
        this.plHttpAuth.logout();
    }

    /**
     * getCurrentUser - long-running observable for the current user. By default, the
     * user store initially emits an empty object. This does not emit the empty object
     * to obviate the need to do logic checks everywhere.
     */
    getCurrentUser(): Observable<User> {
        return this.store.select('currentUser').pipe(filter(user => !!user.uuid));
    }

    getProvider(user: any) {
        return (user && user.xProvider) ? user.xProvider : null;
    }

    getUserPermissions() {
        const authPermissionsObserver = this.plHttp.get('permissions');
        const workplacePermissionsObserver = this.plGraphQL.query(userSelfQuery, {}, {});

        return new Observable((observer: any) => {
            zip(
                authPermissionsObserver,
                workplacePermissionsObserver,
            )
            .pipe(
                map(([authPermissions, workplacePermissions]: [any, any]) => {
                    workplacePermissions.currentUser =  Object.assign(
                        {},
                        workplacePermissions.currentUser,
                        { authPermissions },
                    );

                    return workplacePermissions;
                }),
            )
            .subscribe(
                (res: any) => observer.next(res),
                // Return as success anyway; will have no permissions.
                (err: any) => observer.next({}),
            );
        });
    }

    saveUser(user: any) {
        if (user) {
            const fetchData$: Array<Observable<any>> = [
                this.getUserPermissions(),
                this.getProviderTypes$(),
                this.getServiceTypes$(),
                this.plUserSvc.getUserOnce(user.uuid),
            ];

            // add fetch provider
            const fetchProvider = user.groups && user.groups.indexOf('Provider') > -1;
            if (fetchProvider) fetchData$.push(this.getProvider$(user));

            combineLatest(
                fetchData$
            ).subscribe((res: any) => {
                const perms = res[0];
                const providerTypes = res[1].results;
                const serviceTypes = res[2].results;
                const assignments = res[3].assignments;

                user.xPermissions = (perms.currentUser && perms.currentUser.permissions) || {};
                user.xGlobalPermissions = (perms.currentUser && perms.currentUser.globalPermissions) || {};
                user.xAuthPermissions = (perms.currentUser && perms.currentUser.authPermissions) || {};
                user.xEnabledUiFlags = (perms.currentUser && perms.currentUser.enabledUiFlags) || [];
                user.xEnabledFeatures = (perms.currentUser && perms.currentUser.enabledFeatures) || [];
                user.xAssignments = assignments;

                if (fetchProvider) {
                    const provider = this.providerGQLToRestFormat(res[4]);
                    // if (provider.results && provider.results.length) {
                        // const p = user.xProvider = provider.results[0];
                    if (provider && provider.id) {
                        const p = user.xProvider = provider;
                        if (localStorage.getItem('SET_W2')) {
                            p.isW2 = true;
                        }
                        const pTypes = user.xProvider.providerTypes = p.provider_types
                            .map((uuid: any) => providerTypes
                            .find((item: any) => item.uuid === uuid));
                        const sTypes = user.xProvider.serviceTypes = pTypes
                            .filter((x: any) => typeof(x) !== 'undefined')
                            .map((pt: any) => serviceTypes
                            .find((st: any) => CurrentUserService.MAP_PROVIDER_TYPE_TO_SERVICE_TYPE[pt.code] === st.code));
                        const ptc = user.xProvider.providerTypeCode = this.getProviderTypeCode(user);
                        user.xProvider.providerType = this.getProviderType(user);
                        const stc = user.xProvider.serviceTypeCode = this.getServiceTypeCodeForProviderTypeCode(ptc);
                        user.xProvider.serviceType = sTypes.find((item: any) => item.code === stc);
                        const setTimezone = localStorage.getItem('SET_TIMEZONE');
                        if (setTimezone) {
                            p.timezone = setTimezone;
                            console.log('--- using SET_TIMEZONE', setTimezone, provider);
                        }
                    }
                    this.userCache = user;
                    this.store.dispatch({ type: 'UPDATE_CURRENT_USER', payload: {...user} });
                } else {
                    this.userCache = user;
                    this.store.dispatch({ type: 'UPDATE_CURRENT_USER', payload: {...user} });
                }
            });
        }
    }

    status() {
        this.plHttp.get('status', { withCredentials: true })
            .subscribe((res: any) => {
                this.saveUser(res.user);
            });
    }

    checkAndLogin(lastActive = 0) {
        return new Observable((observer: any) => {
            if (this.userCache.uuid) {
                this._isLoggedIn$.next(true);
                observer.next(true);
            } else {
                return this.plHttp.get('status', { lastActive, withCredentials: true })
                    .subscribe((res: any) => {
                        if (res.user) {
                            this.saveUser(res.user);
                            this.jwt = res.token;
                            this._jwt$.next(new PLJWTDecoder(this.jwt));
                            this._isLoggedIn$.next(true);
                            observer.next(true);
                        } else {
                            observer.next(false);
                            this.login();
                        }
                    }, (err: any) => {
                        observer.next(false);
                        this.login();
                    });
            }
        });
    }

    updateUserSeen() {
        const vars: any = {};
        return this.plGraphQL.mutate(lastSeenMutation, vars, {});
    }

    isSlp(user: any) {
        return user.xProvider && user.xProvider.providerTypes
            .find((item: any) => item.code === CurrentUserService.PROVIDER_CODE_SLP);
    }

    isOt(user: any) {
        return user.xProvider && user.xProvider.providerTypes
            .find((item: any) => item.code === CurrentUserService.PROVIDER_CODE_OT);
    }

    isMhp(user: any) {
        return user.xProvider && user.xProvider.providerTypes
            .find((item: any) => item.code === CurrentUserService.PROVIDER_CODE_MHP);
    }

    isPa(user: any) {
        return user.xProvider && user.xProvider.providerTypes
            .find((item: any) => item.code === CurrentUserService.PROVIDER_CODE_PA);
    }

    getProviderTypeCode(user: any) {
        if (this.isSlp(user)) {
            return CurrentUserService.PROVIDER_CODE_SLP;
        } else if (this.isOt(user)) {
            return CurrentUserService.PROVIDER_CODE_OT;
        } else if (this.isMhp(user)) {
            return CurrentUserService.PROVIDER_CODE_MHP;
        }
    }

    getProviderType(user: any) {
        const slp = this.isSlp(user);
        const ot = this.isOt(user);
        const mhp = this.isMhp(user);
        return slp || ot || mhp || null;
    }

    getServiceTypeCodeForProviderTypeCode(providerTypeCode: string) {
        return CurrentUserService.MAP_PROVIDER_TYPE_TO_SERVICE_TYPE[providerTypeCode];
    }

    private getProviderTypes$() {
        return this.plHttp.get('providerTypes');
    }

    private getServiceTypes$() {
        return this.plHttp.get('serviceTypes');
    }

    private getProvider$(user: any) {
        // return this.plHttp.get('providers', { user: user.uuid })
        return this.plGraphQL.query(providerProfileQuery, { userId: user.uuid }, {});
    }

    providerGQLToRestFormat(res: any) {
        if (!res || !res.providerProfile || !res.providerProfile.id) {
            return {};
        }
        res = res.providerProfile;
        const devTimezoneOverride = localStorage.getItem('KEY_TIMEZONE');
        return Object.assign(res, {
            uuid: res.id,
            is_active: res.isActive || true,
            user: res.user.id,
            salesforce_id: res.salesforceId || "",
            provider_types: res.providerTypes.map((type: any) => {
                return type.id;
            }),
            phone: res.phone,
            email: res.email,
            email2: res.email2,
            billing_street: res.billingAddress.street,
            billing_city: res.billingAddress.city,
            billing_postal_code: res.billingAddress.postalCode,
            billing_state: res.billingAddress.state,
            billing_country: res.billingAddress.country,
            first_name: res.user.firstName,
            last_name: res.user.lastName,
            timezone: devTimezoneOverride || res.timezone,
            username: res.user.username,
            caseload_clients_count: res.caseloadCount,
            is_onboarding_wizard_complete: res.isOnboardingWizardComplete,
        });
    }
}
