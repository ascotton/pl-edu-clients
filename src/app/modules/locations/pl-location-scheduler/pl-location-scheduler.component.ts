import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
// RxJs
import { Observable, combineLatest } from 'rxjs';
import { map, tap, withLatestFrom, takeUntil, skip, first, filter } from 'rxjs/operators';
// NgRx
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import {
    selectReferrals,
    PLSelectSchoolYear,
    PLFetchReferrals,
    selectSchoolYears,
    selectSelectedSchoolYear,
    selectCurrentUser,
    selectIsCAM,
} from '@common/store';
import {
    selectProviders,
    selectAllProvidersLoaded,
    selectProvidersOpts,
    selectProvidersLoading,
    PLLoadAllProviders,
} from '@common/store/providers';
import {
    selectLocation,
    selectLocationSchedule,
    selectProvidersAvailability,
    selectLocationScheduleLoading,
    selectCurrentLocationId,
    selectLocationAvailability,
    selectLocationAvailabilityState,
    PLClearLocationSchedule,
    PLApproveLocationSchedule,
    PLFetchProvidersAvailability,
    PLFetchLocationSchedule,
    PLFetchLocationAvailability,
} from '../store';
// Common
import { PLTimeGridService } from '@common/services';
import { PLReferralFiltersFields, PLDestroyComponent } from '@common/components';
import {
    PLProviderProfile,
    PLReferral,
    PLLocationAvailability,
    PLSchoolYear,
    Option,
} from '@common/interfaces';
import { PL_REFERRAL_STATE } from '@common/enums';

import { User } from '../../user/user.model';
// Services
import {
    PLToastService,
    PLConfirmDialogService,
} from '@root/index';
// Models
import { PLLocation } from '../models';
import { PLFetchProviderSchedule } from '../store/location.store';

@Component({
    selector: 'pl-location-scheduler',
    templateUrl: './pl-location-scheduler.component.html',
    styleUrls: ['./pl-location-scheduler.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLLocationSchedulerComponent extends PLDestroyComponent implements OnInit {

    readonly storeKeys = {
        providers: 'PL_LOCATION_SCHEDULER_SelectedProviders',
    };

    mayView = true;
    reservingBlock = false;
    selectedTimezone: string;
    selectedReferrals: PLReferral[] = [];
    providers: PLProviderProfile[];
    selectedProviders: PLProviderProfile[] = [];
    selectedProvidersIds: string[] = [];
    schoolYears: PLSchoolYear[];

    referralFilters: PLReferralFiltersFields[] = [
        PLReferralFiltersFields.NotScheduled,
        PLReferralFiltersFields.MissingInfo,
        PLReferralFiltersFields.ProviderType,
        PLReferralFiltersFields.State,
    ];

    labelKeys: { label: string, key: string }[] = [
        { label: 'Open Therapy Time', key: 'open-time' },
        { label: 'Location Availability', key: 'location-availability' },
        { label: 'Provider Availability', key: 'provider-availability' },
        { label: 'Reserved Time', key: 'reserved' },
        { label: 'Computer Occupied', key: 'computer-not-available' },
        { label: 'Provider Booked', key: 'scheduled-other-school' },
    ];

    currentUser$ = this.store$.select(selectCurrentUser);
    locationId$ = this.store$.select(selectCurrentLocationId);
    location$: Observable<PLLocation> = this.store$.select(selectLocation);
    providers$ = this.store$.select(selectProviders);
    providersOpts$: Observable<Option[]> = this.providers$.pipe(
        withLatestFrom(this.locationId$),
        map(([providers, locationId]) => {
            const inLoc: Option[] = [];
            const outLoc: Option[] = [];
            providers.forEach(({ user, locations }) => {
                const value = user.id;
                const label = `${user.lastName}, ${user.firstName}`;
                if (locations.includes(locationId)) {
                    inLoc.push({ value, label });
                } else {
                    outLoc.push({ value, label: `${label} (*)` });
                }
            });
            return [...inLoc, ...outLoc];
        }));
    providersLoading$: Observable<boolean> = this.store$.select(selectProvidersLoading);
    allProvidersLoaded$: Observable<boolean> = this.store$.select(selectAllProvidersLoaded);

    locationsAssigned$: Observable<PLLocation[]> = this.route.data
        .pipe(map(({ locationsAssigned }) => locationsAssigned));
    locationsAssignedOpts$: Observable<Option[]> = this.locationsAssigned$.pipe(
        map(locations => locations
            .filter(loc => loc.locationType !== 'VIRTUAL')
            .map(({ id, name }) => ({
                value: id,
                label: name,
            })),
        ));
    locationsAssignedIds$ = this.locationsAssigned$.pipe(
        map(locations => locations.map(({ id }) => id)));
    locationSchedule$ = this.store$.select(selectLocationSchedule);
    locationAvailability$ = this.store$.select(selectLocationAvailability);

    schoolYearCode$ = this.store$.select(selectSelectedSchoolYear)
        .pipe(map(sy => sy.code));

    providersAvailability$ = this.store$.select(selectProvidersAvailability);
    referrals$ = this.store$.select(selectReferrals);
    canApprove$ = this.referrals$.pipe(map((referrals) => {
        const completeState = [PL_REFERRAL_STATE.Converted, PL_REFERRAL_STATE.Matched];
        return !!referrals.filter(r => !completeState.includes(<PL_REFERRAL_STATE>r.state) && r.isScheduled).length;
    }));
    providerView$: Observable<boolean> = this.route.queryParams.pipe(
        map(({ providerId }) => !!providerId));
    permisions$: Observable<{ mayApproveSchedule: boolean, mayEditReferrals: boolean }> = this.route.data.pipe(
        map((({ permisions }) => ({
            mayApproveSchedule: permisions.mayApproveSchedule,
            mayEditReferrals: permisions.mayEditReferrals,
        }))),
    );

    // TODO: Get more data from the store instead of resolver
    data$: Observable<{
        currentUser: User,
        providerView: boolean,
        location: PLLocation,
        mayApproveSchedule: boolean,
        mayEditReferrals: boolean,
    }> = this.route.data.pipe(
        withLatestFrom(
            this.providerView$,
            this.location$,
            this.currentUser$),
        map(([{ permisions }, providerView, location, user]) => ({
            location,
            providerView,
            currentUser: user,
            mayApproveSchedule: permisions.mayApproveSchedule,
            mayEditReferrals: permisions.mayEditReferrals,
        })),
        tap(({ location }) => {
            this.mayView = location.locationType !== 'VIRTUAL';
            this.selectedTimezone = location.timezone;
            this.setCalendarTime([], location);
            this.plTimeGrid.timezone = this.selectedTimezone;
        }),
    );
    loading$ = combineLatest([
        this.store$.select(selectLocationScheduleLoading),
        this.store$.select(selectLocationAvailabilityState).pipe(map(({ loading }) => loading)),
    ]).pipe(
        map(loading => loading.reduce((p, c) => p || c)));

    constructor(
        private store$: Store<AppStore>,
        private route: ActivatedRoute,
        private router: Router,
        private plTimeGrid: PLTimeGridService,
        private plToast: PLToastService,
        private plConfirm: PLConfirmDialogService) {
        super();
    }

    ngOnInit() {
        this.store$.select(selectSchoolYears).pipe(first())
            .subscribe(sy => this.schoolYears = sy);
        const isCam$ = this.store$.select(selectIsCAM);
        let camProviderLoaded = false;
        this.store$.select(selectAllProvidersLoaded)
            .pipe(
                takeUntil(this.destroyed$),
                filter(loaded => loaded),
                withLatestFrom(this.data$, this.providers$, isCam$),
            ).subscribe(([_, { providerView, currentUser }, providers, isCam]) => {
                if (isCam && !camProviderLoaded) {
                    this.store$.dispatch(PLLoadAllProviders({ payload: { }, dontClear: true }));
                }
                if (isCam) {
                    camProviderLoaded = true;
                }
                this.providers = providers;
                if (providerView && this.providers) {
                    const currentProvider = this.providers
                        .find((p: PLProviderProfile) => p.user.id === currentUser.uuid);
                    if (currentProvider) {
                        if (this.difference([currentUser.uuid], this.selectedProvidersIds)) {
                            this.onProvidersSelected([currentUser.uuid], this.providers);
                        }
                        this.selectedTimezone = currentProvider.timezone;
                    }
                    this.referralFilters = this.referralFilters.filter(f => f !== PLReferralFiltersFields.ProviderType);
                }
                this.loadStoredSelections(this.providers);
            });
        this.schoolYearCode$.pipe(
            skip(1), // Ignore first value since it was already taken by resolvers
            takeUntil(this.destroyed$),
            withLatestFrom(this.locationId$),
        ).subscribe(([sy, locationId]) => {
            this.fetchProvidersSchedule();
            this.store$.dispatch(PLFetchLocationSchedule({ locationId }));
            this.store$.dispatch(PLFetchLocationAvailability({ locationId }));
            this.store$.dispatch(PLFetchReferrals({ }));
        });
        this.locationAvailability$.pipe(
            takeUntil(this.destroyed$),
            withLatestFrom(this.data$),
        ).subscribe(([locationAvailability, { location }]) => {
            if (this.mayView) {
                if (!locationAvailability.length) {
                    this.plToast.show('error', 'Unable to schedule students because the location availability is unknown');
                } else {
                    this.setCalendarTime(locationAvailability, location);
                }
            }
        });
    }

    private loadStoredSelections(providers: PLProviderProfile[]) {
        const storedProviders = sessionStorage.getItem(this.storeKeys.providers);
        if (storedProviders) {
            let selectedProviders: string[] = JSON.parse(storedProviders);
            // Clear providers not on the list
            selectedProviders = selectedProviders.filter(id => providers.find(p => p.user.id === id));
            if (this.difference(selectedProviders, this.selectedProvidersIds)) {
                this.onProvidersSelected(selectedProviders, providers);
            }
        }
    }

    private difference(a: any[], b: any[]): boolean {
        const difference = a.filter(x => !b.includes(x));
        return !!difference.length;
    }

    private setCalendarTime(locationAvailability: PLLocationAvailability[], location: PLLocation) {
        const locTime = this.plTimeGrid.timeObj({ start: '07:00:00', end: '16:00:00' }, location.timezone);
        locTime.end = moment.max([
            locTime.end,
            ...(<PLLocationAvailability[]>locationAvailability)
                .map(av => this.plTimeGrid.timeObj(av, location.timezone).end),
        ]);
        this.plTimeGrid.buildTimeGrid(locTime);
    }

    private fetchProvidersSchedule() {
        this.selectedProvidersIds.forEach(providerId =>
            this.store$.dispatch(PLFetchProviderSchedule({ providerId })));
    }

    onApprove() {
        this.plConfirm.show({
            header: 'Please Confirm',
            content: `Are you sure you want to approve the schedule?`,
            primaryLabel: 'Yes',
            secondaryLabel: 'No',
            primaryCallback: () => this.store$.dispatch(PLApproveLocationSchedule()),
        });
    }

    onClear(providerView?: boolean) {
        let content = 'Are you sure you want to remove ALL therapy sessions from the schedule?<br/>This action applies to ALL therapists currently scheduled.<br/>This action CANNOT be undone.';
        if (providerView) {
            content = 'Are you sure you want to clear the schedule?<br/>It will permanently delete all therapy sessions currently scheduled.';
        }
        this.plConfirm.show({
            content,
            type: 'toast',
            toastType: 'error',
            leftIconSvg: 'alert',
            primaryLabel: 'Yes',
            secondaryLabel: 'No',
            primaryCallback: () => this.store$.dispatch(PLClearLocationSchedule()),
        });
    }

    onProvidersSelected(value: string[], providers: PLProviderProfile[]) {
        // TODO: For some reason is being trigerred multiple times on Init
        this.selectedProvidersIds = value;
        sessionStorage.setItem(this.storeKeys.providers, JSON.stringify(value));
        // Temp save providers
        this.selectedReferrals = [];
        this.selectedProviders = value.length > 0 ?
            providers.filter(({ user }) => this.selectedProvidersIds.includes(user.id)) : [];
        this.store$.dispatch(PLFetchProvidersAvailability({ providerIds: this.selectedProvidersIds }));
        this.fetchProvidersSchedule();
    }

    onLocationSelected(value: any, user: User) {
        this.router.navigateByUrl(`location/${value}/scheduler?providerId=${user.uuid}`);
    }

    onYearSelected(year: any): void {
        const schoolYear = this.schoolYears.find(sy => sy.code === year.model);
        this.store$.dispatch(PLSelectSchoolYear({ schoolYear: schoolYear.id }));
    }
}
