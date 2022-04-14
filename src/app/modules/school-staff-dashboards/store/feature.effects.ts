import { Injectable } from '@angular/core';
// NgRx
import { Store } from '@ngrx/store';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { AppStore } from '@app/appstore.model';
import { of, concat } from 'rxjs';
import { map, mergeMap, withLatestFrom, catchError, tap, toArray, switchMap } from 'rxjs/operators';

import {
    PLSetLicenses,
    PLFetchLicenses,
    PLSetOrganizations,
    PLFetchOrganizations,
    PLSelectOrganization,
    PLSetOcupations,
    PLAddSinglePlatformUser,
    PLPlatformUserSaveCompleted,
    PLFetchPlatformUsers,
    PLAddMultiplePlatformUser,
    PLUpdateSaveProgress,
    PLSetPlatformUsers,
    PLFetchOrganization,
    PLAgregateOrganizations,
    PLDeactivatePlatformUser,
    PLSendSetPasswordEmail,
} from './feature.actions';
import {
    selectOrganizations,
    selectSelectedOrganization,
    selectPlatformUserSaveProgress,
    selectLicenses,
    selectIsGroupPrivatePractice,
} from './feature.selectors';
import {
    selectSelectedSchoolYear,
    PLSuccessNotification,
    PLErrorNotification,
} from '@common/store';
import { PLPlatformUsersService, PLSchoolStaffService, PLBulkUploadService, PLQueryOptions } from '../services';

export const PLATFORM_ADMIN_STORE = {
    organization: 'selectedOrganization',
};

@Injectable()
export class PlatformAdminEffects {

    private readonly STORE = PLATFORM_ADMIN_STORE;

    private fetchPlatformUsersOptions: PLQueryOptions;

    private organizations$ = this.store$.select(selectOrganizations);
    // Does requieres the full object? id maybe?
    private selectedSY$ = this.store$.select(selectSelectedSchoolYear);
    private selectedOrg$ = this.store$.select(selectSelectedOrganization);
    private isGroup$ = this.store$.select(selectIsGroupPrivatePractice);
    // private user$ = this.store$.select('currentUser');
    private adminLicenseIds$ = this.store$.select(selectLicenses).pipe(
        map(licenses => licenses
            .filter(l => l.is_admin)
            .map(l => l.uuid)));

    // TODO: Add generic error handler
    fetchOrganizations$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLFetchOrganizations),
            mergeMap(() => this.schoolService.fetchOrganizations()),
            map(({ organizations, organizations_totalCount }) =>
                PLAgregateOrganizations({ list: organizations, total: organizations.length })),
        ));

    fetchSingleOrganization$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLFetchOrganization),
            mergeMap(({ id }) => this.schoolService.fetchOrganization(id)),
            map(({ organization }) =>
                PLAgregateOrganizations({ list: organization ?
                    [organization] : [] })),
        ));

    organizationsChanged$ = createEffect(() => this.actions$.pipe(
        ofType(PLSetOrganizations, PLAgregateOrganizations),
        withLatestFrom(this.selectedOrg$),
        tap(([{ list }, current]) => {
            let item = null;
            if (list.length >= 1) {
                item = list[0];
            }
            if (!current) {
                const stored = sessionStorage.getItem(this.STORE.organization);
                const existing = list.find(({ id }) => stored === id);
                if (existing) {
                    item = existing;
                }
                this.store$.dispatch(PLSelectOrganization({ item }));
            } else if (item && current.id !== item.id) {
                if (list.find(({ id }) => current.id === id)) {
                    item = current;
                }
            }
        }),
    ), { dispatch: false });

    organizationSelected$ = createEffect(() => this.actions$.pipe(
        ofType(PLSelectOrganization),
        tap(({ item }) => {
            sessionStorage.setItem(this.STORE.organization, item.id);
        }),
    ), { dispatch: false });

    fetchLicenses$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLFetchLicenses),
            withLatestFrom(this.selectedSY$, this.selectedOrg$, this.isGroup$),
            mergeMap(([{ SY: SYCode, orgId }, { code: SY }, org, isGroup]) =>
                this.platformUserService.fetchMergedLicenses(
                    orgId || org.id,
                    (isGroup || org.isGroupOrganization) ? '' : SYCode || SY,
                    (isGroup || org.isGroupOrganization) ? 'group-subscription' : 'school-staff')
                .pipe(
                    map(list => PLSetLicenses({ list })),
                    catchError((err) => {
                        this.store$.dispatch(PLErrorNotification({
                            title: 'Error',
                            message: 'Unable to get licensens',
                        }));
                        return of(PLSetLicenses({ list: [] }));
                    }),
                ),
            ),
        ));

    fetchUsers$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLFetchPlatformUsers),
            tap(({ options }) => this.fetchPlatformUsersOptions = options),
            withLatestFrom(this.selectedSY$, this.selectedOrg$, this.isGroup$),
            mergeMap(([{ options, SY: SYId, organization, platform: usePlatform }, { id: SY }, org, isGroup]) =>
                (usePlatform ?
                    this.platformUserService.fetchUserList(organization || org.id,
                        (isGroup || org.isGroupOrganization) ? '' : SYId || SY,
                        options) :
                    this.platformUserService.fetchUsers(organization || org.id,
                        (isGroup || org.isGroupOrganization) ? '' : SYId || SY,
                        options)
                ).pipe(
                    map(({ results, count }) => PLSetPlatformUsers({ list: results, total: count })),
                    catchError((err) => {
                        this.store$.dispatch(PLErrorNotification({
                            title: 'Error',
                            message: 'Unable to get users',
                        }));
                        return of(PLSetPlatformUsers({ list: [], total: 0 }));
                    }),
                ),
            ),
        ));

    setOcupations$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLSetLicenses),
            map(({ list }) => {
                const allOcupations = [].concat(
                    ...list
                        .filter(l => l.total_quantity)
                        .map(license => license.occupations));
                const ocupations = allOcupations.filter((item, pos) =>
                    allOcupations.indexOf(item) === pos)
                    .map(value => ({ value, label: value }));
                return PLSetOcupations({ list: ocupations });
            }),
        ));

    addSingleUser$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLAddSinglePlatformUser),
            withLatestFrom(this.selectedSY$, this.selectedOrg$, this.adminLicenseIds$),
            mergeMap(([{ user }, { id: SY }, { id: orgId }, adminIds]) =>
                this.platformUserService.addUser(user, orgId, SY, adminIds).pipe(
                    map(result => PLPlatformUserSaveCompleted({})),
                    catchError((respond: any) => {
                        let errorMessage = 'An unknown error has ocurred.';
                        if (respond && respond.error) {
                            if (typeof respond.error === 'string') {
                                errorMessage = respond.error || errorMessage;
                            } else {
                                const { detail, non_field_errors } = respond.error;
                                errorMessage = detail || non_field_errors || errorMessage;
                            }
                        }
                        return of(PLPlatformUserSaveCompleted({ errorMessage }));
                    }),
            )),
        ));

    sendSetPasswordEmail$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLSendSetPasswordEmail),
            withLatestFrom(this.selectedOrg$),
            mergeMap(([{ uuid }, org]) =>
                this.platformUserService.sendPasswordEmail(uuid, org.id).pipe(
                    map(() => PLSuccessNotification({
                        message: 'Set Password email has successfully sent.',
                        title: 'Sent!',
                    })),
                    catchError((respond: any) => {
                        let errorMessage = 'An unknown error has ocurred.';
                        if (respond && respond.error) {
                            const { detail, non_field_errors } = respond.error;
                            errorMessage = detail || non_field_errors || errorMessage;
                        }
                        return of(PLErrorNotification({
                            title: 'Unable to send the email',
                            message: errorMessage,
                        }));
                    }),
            )),
            tap(() => {
                this.store$.dispatch(PLFetchLicenses({ }));
                if (this.fetchPlatformUsersOptions) {
                    this.store$.dispatch(PLFetchPlatformUsers({
                        options: this.fetchPlatformUsersOptions,
                    }));
                }
            }),
        ));

    deactivateUser$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLDeactivatePlatformUser),
            mergeMap(({ uuid }) =>
                this.platformUserService.deactivateUser(uuid).pipe(
                    map(() => PLSuccessNotification({
                        message: 'License has been deactivated',
                        title: 'Congratulations!',
                    })),
                    catchError((respond: any) => {
                        let errorMessage = 'An unknown error has ocurred.';
                        if (respond && respond.error) {
                            const { detail, non_field_errors } = respond.error;
                            errorMessage = detail || non_field_errors || errorMessage;
                        }
                        return of(PLErrorNotification({
                            title: 'Unable to deactivate user',
                            message: errorMessage,
                        }));
                    }),
            )),
            tap(() => {
                this.store$.dispatch(PLFetchLicenses({ }));
                if (this.fetchPlatformUsersOptions) {
                    this.store$.dispatch(PLFetchPlatformUsers({
                        options: this.fetchPlatformUsersOptions,
                    }));
                }
            }),
        ));

    addMultipleUser$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLAddMultiplePlatformUser),
            withLatestFrom(this.selectedSY$, this.selectedOrg$, this.adminLicenseIds$),
            switchMap(([{ users, csv }, { id: SY }, { id: orgId }, adminIds]) => {
                const chunkSize = 10;
                const total = users.length;
                let completed = 0;
                const chunks = this.bulkHelper.getChunks(users, chunkSize);
                return concat(
                    ...chunks.map(chunk =>
                        this.platformUserService.addMultipleUsers(chunk, orgId, SY, adminIds).pipe(
                            tap(() => {
                                completed += chunk.length;
                                this.store$.dispatch(PLUpdateSaveProgress({ total, completed }));
                            }),
                            catchError((err) => {
                                const errors: { [key: string]: string } = {};
                                chunk.forEach(u => errors[u.email] = 'Unknown error');
                                return of({ errors, created: [] });
                            }),
                        )),
                ).pipe(
                    toArray(),
                    map(res => [].concat(
                        ...res.filter(({ errors }) => !!errors && Object.keys(errors).length)
                            .map(({ errors }) => Object.keys(errors)
                                .map(email => ({
                                    ...users.find(user => user.email === email),
                                    errors: errors[email],
                                })),
                            ),
                        ),
                    ),
                );
            }),
            map(errorRows => PLPlatformUserSaveCompleted({
                multiple: true,
                errorMessage: errorRows,
            })),
        ));

    userSaveCompleted$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PLPlatformUserSaveCompleted),
            withLatestFrom(this.store$.select(selectPlatformUserSaveProgress)),
            tap(([{ multiple, errorMessage }, { total, completed, errors }]) => {
                if (!errorMessage) {
                    this.store$.dispatch(PLFetchLicenses({}));
                    const message = multiple ?
                        `All ${total} licenses had been assigned` :
                        'License assigned';
                    this.store$.dispatch(
                        PLSuccessNotification({
                            message,
                            title: 'Congratulations!',
                        }));
                } else if (multiple) {
                    // TODO
                } else {
                    this.store$.dispatch(
                        PLErrorNotification({
                            title: 'Unable to create user',
                            message: <string>errorMessage,
                        }));
                }
            }),
        ), { dispatch: false });

    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private platformUserService: PLPlatformUsersService,
        private schoolService: PLSchoolStaffService,
        private bulkHelper: PLBulkUploadService,
    ) { }
}
