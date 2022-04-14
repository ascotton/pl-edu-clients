import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
// NgRx
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import * as commonStore from '@common/store';
import * as locationStore from './location.store';
// RxJs
import { forkJoin, of } from 'rxjs';
import { map, mergeMap, withLatestFrom, catchError, tap } from 'rxjs/operators';
// Services
import {
    PLMasterSchedulerService,
    PLProviderAvailabilityService,
    PLLocationService2,
} from '../services';

@Injectable()
export class PLLocationEffects {

    private readonly toastConfig = {
        positionClass: 'toast-bottom-right',
    };

    private schoolYear$ = this.store$.select(commonStore.selectSelectedSchoolYear)
        .pipe(map(sy => sy ? sy.code : null));
    private locationId$ = this.store$.select(locationStore.selectCurrentLocationId);
    private locationSchedule$ = this.store$.select(locationStore.selectLocationSchedule);

    fetchLocation$ = createEffect(() =>
        this.actions$.pipe(
            ofType(locationStore.PLFetchLocation),
            mergeMap(({ locationId }) =>
                this.locationService.getLocation(locationId).pipe(
                    map(location => locationStore.PLSetLocation({ location })),
                    catchError(err => of(locationStore.PLFetchLocationFail())),
                ),
            ),
        ));

    fetchLocationAvailability$ = createEffect(() =>
        this.actions$.pipe(
            ofType(locationStore.PLFetchLocationAvailability),
            withLatestFrom(this.schoolYear$),
            mergeMap(([{ locationId }, syCode]) =>
                this.locationService.getAvailability(locationId, syCode).pipe(
                    map(availability => locationStore.PLSetLocationAvailability({ availability, locationId })),
                    catchError(err => of(locationStore.PLFetchLocationAvailabilityError())),
                ),
            ),
        ));

    fetchLocationSchedule$ = createEffect(() =>
        this.actions$.pipe(
            ofType(locationStore.PLFetchLocationSchedule),
            withLatestFrom(this.schoolYear$),
            mergeMap(([{ locationId }, syCode]) =>
                this.scheduler.getLocationSchedule(syCode, locationId).pipe(
                    map(schedule => locationStore.PLSetLocationSchedule({ locationId, schedule })),
                    catchError(err => of(locationStore.PLLocationSchedulerError())),
                ),
            ),
        ));

    fetchProviderSchedule$ = createEffect(() =>
        this.actions$.pipe(
            ofType(locationStore.PLFetchProviderSchedule),
            withLatestFrom(this.schoolYear$, this.locationId$),
            mergeMap(([{ providerId }, syCode, locationId]) =>
                /*
                forkJoin(
                    this.scheduler.getProviderSchedule(syCode, providerId),
                    this.scheduler.getProviderRealSchedule(syCode, providerId, locationId),
                )
                */
                this.scheduler.getProviderSchedule(syCode, providerId).pipe(
                    map(schedule => locationStore.PLSetLocationSchedule({ locationId, schedule })),
                    catchError(err => of(locationStore.PLLocationSchedulerError())),
                ),
            ),
        ));

    fetchProvidersAvailability$ = createEffect(() =>
        this.actions$.pipe(
            ofType(locationStore.PLFetchProvidersAvailability),
            // TODO: In future we should check for SY
            withLatestFrom(this.store$.select(locationStore.selectProvidersAvailability)),
            mergeMap(([{ providerIds }, providersAvailability]) => {
                const loadedIds = Object.keys(providersAvailability);
                const missing = providerIds
                    .filter(id => !loadedIds.includes(id));
                let result$ = of(locationStore.PLSetProvidersAvailability({ providersAvailability: {} }));
                if (missing.length  > 0) {
                    result$ = forkJoin(missing
                            .map(id => this.plProviderAvailability.fetch(id)
                                .pipe(map(({ availabilityBlocks }) => ({ id, availability: availabilityBlocks })))),
                    ).pipe(
                        map(results => locationStore.PLSetProvidersAvailability({
                            providersAvailability: results
                                .reduce((obj, { id, availability }) =>
                                    ({ ...obj, [id]: availability }), {}),
                        })));
                }
                return result$;
            }),
        ),
    );

    scheduleSession$ = createEffect(() =>
        this.actions$.pipe(
            ofType(locationStore.PLScheduleSession),
            withLatestFrom(
                this.locationSchedule$,
                this.store$.select(commonStore.selectReferrals),
            ),
            mergeMap(([{ appointment }, schedule, referrals]) => this.scheduler.create(appointment).pipe(
                map((result) => {
                    const { locationId, referralIds } = appointment;
                    const _referrals = referrals
                        .filter(r => referralIds.includes(r.id))
                        .map(({ id, client, interval, frequency }) => ({ id, client, interval, frequency }));
                    this.toastr.success('Added to schedule!', 'Complete', this.toastConfig);
                    return locationStore.PLScheduleSessionSucceed({ locationId, schedule: [
                        ...schedule,
                        { ...result, referrals: _referrals },
                    ]});
                }),
                catchError(err => of(locationStore.PLLocationSchedulerError())),
            )),
        ));

    deleteSession$ = createEffect(() =>
        this.actions$.pipe(
            ofType(locationStore.PLDeleteSession),
            mergeMap(({ appointment }) => this.scheduler.delete(appointment).pipe(
                map(() => {
                    const { locationId, id } = appointment;
                    this.toastr.success('Removed from schedule!', 'Complete', this.toastConfig);
                    return locationStore.PLDeleteSessionSucceed({ key: id });
                }),
                catchError(err => of(locationStore.PLLocationSchedulerError())),
            )),
        ));

    clearLocationSchedule$ = createEffect(() =>
        this.actions$.pipe(
            ofType(locationStore.PLClearLocationSchedule),
            withLatestFrom(this.locationId$, this.schoolYear$),
            mergeMap(([action, locationId, schoolYear]) => this.scheduler.clear(locationId, schoolYear).pipe(
                map(() => locationStore.PLClearLocationScheduleSucceed()),
                catchError(err => of(locationStore.PLLocationSchedulerError())),
            )),
        ));

    clearReferralSchedule$ = createEffect(() =>
        this.actions$.pipe(
            ofType(locationStore.PLClearReferralSchedule),
            withLatestFrom(this.schoolYear$),
            mergeMap(([{ referralId }, schoolYear]) => this.scheduler.removeReferral(referralId).pipe(
                map(() => locationStore.PLClearReferralScheduleSucceed()),
                catchError(err => of(locationStore.PLLocationSchedulerError())),
            )),
        ));

    approveLocationSchedule$ = createEffect(() =>
        this.actions$.pipe(
            ofType(locationStore.PLApproveLocationSchedule),
            withLatestFrom(this.locationId$, this.schoolYear$),
            mergeMap(([action, locationId, schoolYear]) => this.scheduler.approve(locationId, schoolYear).pipe(
                tap(updated =>
                    this.toastr.success(
                        `${updated} matches were confirmed and moved from proposed to matched`,
                        'Confirm matches',
                        this.toastConfig)),
                map(() => locationStore.PLApproveLocationScheduleSucceed()),
                catchError(err => of(locationStore.PLLocationSchedulerError())),
            )),
        ));

    reloadScheduler$ = createEffect(() =>
        this.actions$.pipe(
            ofType(
                locationStore.PLClearLocationScheduleSucceed,
                locationStore.PLClearReferralScheduleSucceed),
            withLatestFrom(this.locationId$),
            map(([action, locationId]) => locationStore.PLFetchLocationSchedule({ locationId })),
        ));

    reloadReferrals$ = createEffect(() =>
        this.actions$.pipe(
            ofType(
                locationStore.PLApproveLocationScheduleSucceed,
                locationStore.PLClearLocationScheduleSucceed,
                locationStore.PLScheduleSessionSucceed,
                locationStore.PLDeleteSessionSucceed),
            map(() => commonStore.PLFetchReferrals({ })),
        ));

    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private toastr: ToastrService,
        private scheduler: PLMasterSchedulerService,
        private locationService: PLLocationService2,
        private plProviderAvailability: PLProviderAvailabilityService) { }
}
