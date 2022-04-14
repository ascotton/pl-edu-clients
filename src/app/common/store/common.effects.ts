import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
// NgRx
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
// RxJs
import { of } from 'rxjs';
import { catchError, map, exhaustMap, withLatestFrom, tap } from 'rxjs/operators';
// Actions
import * as commonStore from './common.store';
// Services
import { PLSchoolYearsService, PLProviderTypesService } from '../services';
import { PLReferralService } from '@modules/locations/services';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class PLCommonEffects {

    private get schoolYearService() {
        // Hack to avoid calling Apollo before initialize (PLSchoolYearsService.beginFetch())
        return this._injector.get(PLSchoolYearsService);
    }

    fetchCurrentSchoolYear$ = createEffect(() =>
        this.actions$.pipe(
            ofType(commonStore.PLFetchCurrentSchoolYear),
            exhaustMap(() => this.schoolYearService.getCurrentSchoolYear().pipe(
                map(currentSchoolYear => commonStore.PLFetchCurrentSchoolYearSuccess({ currentSchoolYear })),
                catchError(() => of(commonStore.PLFetchCurrentSchoolYearFail())),
            )),
        ));

    fetchSchoolYears$ = createEffect(() =>
        this.actions$.pipe(
            ofType(commonStore.PLFetchSchoolYears),
            exhaustMap(() => this.schoolYearService.getSchoolYearsInfo()),
            map(({ schoolYears }) => commonStore.PLSetSchoolYears({ list: schoolYears })),
        ));

    // TODO: Preserve Selected SY some how
    /*
    selectSchoolYear$ = createEffect(() =>
        this.actions$.pipe(
            ofType(commonStore.PLSelectSchoolYear),
            tap(({ schoolYear }) => {
                this.router.navigate([], {
                    queryParams: { sy: schoolYear },
                    queryParamsHandling: 'merge',
                });
            }),
        ), { dispatch: false });
    */

    fetchProviderTypes$ = createEffect(() =>
        this.actions$.pipe(
            ofType(commonStore.PLFetchProviderTypes),
            exhaustMap(() => this.providerTypesService.fetch().pipe(
                map(({ providerTypes }) => commonStore.PLFetchProviderTypesSucceed({ providerTypes })),
                catchError(() => of(commonStore.PLFetchCurrentSchoolYearFail())),
            )),
        ));

    fetchReferrals$ = createEffect(() =>
        this.actions$.pipe(
            ofType(commonStore.PLFetchReferrals),
            withLatestFrom(
                this.store$.select(commonStore.selectSelectedSchoolYear),
                this.store$.select(commonStore.selectReferralsState).pipe(
                    map(({ query }) => query),
                ),
            ),
            exhaustMap(([{ filters }, { code: schoolYearCode_In }, query]) => this.referralService
                .get({ schoolYearCode_In, ...(filters || query) }).pipe(
                    map(referrals => commonStore.PLFetchReferralsSucceed({ referrals })),
                )),
        ));

    successNotification$ = createEffect(() =>
        this.actions$.pipe(
            ofType(commonStore.PLSuccessNotification),
            map(({ title, message, config }) =>
                commonStore.PLNotify({
                    config,
                    message,
                    title: `🎉 ${title}`,
                    notificationType: 'success',
                })),
            ));

    errorNotification$ = createEffect(() =>
        this.actions$.pipe(
            ofType(commonStore.PLErrorNotification),
            map(({ title, message, config }) =>
                commonStore.PLNotify({
                    config,
                    message,
                    title: `❌ ${title}`,
                    notificationType: 'error',
                })),
            ));

    notifyUser$ = createEffect(() =>
        this.actions$.pipe(
            ofType(commonStore.PLNotify),
            tap(({ title, message, notificationType, config = {} }) => {
                const toastDefaultConfig = {
                    positionClass: 'toast-bottom-right',
                };
                this.toast[notificationType](message, title, { ...toastDefaultConfig, ...config });
            }),
        ), { dispatch: false });

    constructor(
        private router: Router,
        private actions$: Actions,
        private store$: Store<AppStore>,
        private _injector: Injector,
        private toast: ToastrService,
        // private schoolYearService: PLSchoolYearsService,
        private referralService: PLReferralService,
        private providerTypesService: PLProviderTypesService) { }
}
