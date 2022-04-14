// Something similar in modules/schedule/store/locations
import {
    on,
    Action,
    createReducer,
    createFeatureSelector,
    createAction,
    props,
    createSelector,
} from '@ngrx/store';
import { PLLoadedState, setLoadedState } from '@common/store';
import { EntityAdapter, createEntityAdapter, EntityState } from '@ngrx/entity';
import { PLAvailability, PLLocationAvailability } from '@common/interfaces';
import { PLProviderSession, PLLocation } from '../models';

const namespace = '[LOCATION]';
export const featureKey = 'location';

export const schedulerAdapter: EntityAdapter<PLProviderSession> = createEntityAdapter<PLProviderSession>({
    selectId: item => item.id,
});

interface PLLocationState {
    id: string; // Selected location
    location: PLLoadedState<PLLocation>;
    avalavility: PLLoadedState<PLLocationAvailability[]>;
    scheduler: {
        loaded: boolean; // TODO: Is really needed?
        loading: boolean;
        schedule: EntityState<PLProviderSession>;
        providersAvailability: {[key: string]: PLAvailability[]};
    };
}

// #region Actions
interface SetScheduleResult {
    locationId?: string;
    schedule: PLProviderSession[];
    update?: boolean;
}
// Location
export const PLFetchLocation = createAction(
    `${namespace} Fetch ${featureKey}`,
    props<{ locationId: string }>());
export const PLSetLocation = createAction(
    `${namespace} Set ${featureKey}`,
    props<{ location: PLLocation }>());
export const PLFetchLocationFail = createAction(`${namespace} Fetch ${featureKey} Fail`);
// Location Availability
export const PLFetchLocationAvailability = createAction(
    `${namespace} Fetch ${featureKey} Availability`,
    props<{ locationId: string }>());
export const PLFetchLocationAvailabilityError = createAction(`${namespace} Fetch ${featureKey} Availability Error`);
export const PLSetLocationAvailability = createAction(
    `${namespace} Set ${featureKey} Availability`,
    props<{ locationId: string; availability: PLLocationAvailability[] }>());
// Get
export const PLFetchLocationSchedule = createAction(
    `${namespace} Fetch ${featureKey} Schedule`,
    props<{ locationId: string }>());
export const PLFetchProviderSchedule = createAction(
    `${namespace} Fetch Provider Schedule`,
    props<{ providerId: string }>());
export const PLSetLocationSchedule = createAction(
    `${namespace} Set ${featureKey} Schedule`,
    props<SetScheduleResult>());
// Add
export const PLScheduleSession = createAction(
    `${namespace} Schedule Session`,
    props<{ appointment: PLProviderSession }>());
export const PLScheduleSessionSucceed = createAction(
    `${namespace} Schedule Session [Succeed]`,
    props<SetScheduleResult>());
// Delete
export const PLDeleteSession = createAction(
    `${namespace} Delete Session`,
    props<{ appointment: PLProviderSession }>());
export const PLDeleteSessionSucceed = createAction(
    `${namespace} Schedule Delete [Succeed]`,
    props<{ key: string }>());
// Clear
export const PLClearReferralSchedule = createAction(
    `${namespace} Clear Referral Schedule`,
    props<{ referralId: string }>());
export const PLClearReferralScheduleSucceed = createAction(`${namespace} Clear Referral Schedule [Succeed]`);
export const PLClearLocationSchedule = createAction(`${namespace} Clear Location Schedule`);
export const PLClearLocationScheduleSucceed = createAction(`${namespace} Clear Location Schedule [Succeed]`);
// Approve
export const PLApproveLocationSchedule = createAction(`${namespace} Approve ${featureKey} Schedule`);
export const PLApproveLocationScheduleSucceed = createAction(`${namespace} Approve ${featureKey} Schedule [Succeed]`);
// Provider Availability
export const PLFetchProvidersAvailability = createAction(
    `${namespace} Fetch Provider Availability`,
    props<{ providerIds: string[] }>());
export const PLSetProvidersAvailability = createAction(
    `${namespace} Set Provider Availability`,
    props<{ providersAvailability: { [key: string]: PLAvailability[] }}>());

export const PLLocationSchedulerError = createAction(`${namespace} ${featureKey} Scheduler Error`);
// //#endregion

// #region Reducer
const _reducer = createReducer<PLLocationState>(
    {
        id: '',
        location: setLoadedState(null),
        avalavility: setLoadedState([]),
        scheduler: {
            schedule: schedulerAdapter.getInitialState(),
            loading: false,
            loaded: false,
            providersAvailability: {},
        },
    },
    // Location
    on(PLFetchLocation, (state, { locationId }) => ({
        ...state,
        id: locationId,
        location: setLoadedState(state.location.value, false, true),
    })),
    on(PLFetchLocationFail, state => ({
        ...state,
        id: null,
        location: setLoadedState(null),
    })),
    on(PLSetLocation, (state, { location }) => ({
        ...state,
        location: setLoadedState(location, true),
    })),
    // Location Availability
    on(PLFetchLocationAvailability, state => ({
        ...state,
        avalavility: setLoadedState(state.avalavility.value, false, true),
    })),
    on(PLFetchLocationAvailabilityError, state => ({
        ...state,
        avalavility: setLoadedState([]),
    })),
    on(PLSetLocationAvailability, (state, { locationId, availability }) => ({
        ...state,
        id: locationId,
        avalavility: setLoadedState(availability, true),
    })),
    on(PLDeleteSession,
        PLScheduleSession,
        PLApproveLocationSchedule,
        PLClearLocationSchedule,
        PLFetchProvidersAvailability, state => ({
            ...state,
            scheduler: {
                ...state.scheduler,
                loading: true,
            },
        })),
    on(PLFetchLocationSchedule, (state, { locationId }) => ({
        ...state,
        scheduler: {
            ...state.scheduler,
            schedule: schedulerAdapter.removeMany(e => e.locationId === locationId, state.scheduler.schedule),
            loading: true,
        },
    })),
    on(PLFetchProviderSchedule, (state, { providerId }) => ({
        ...state,
        scheduler: {
            ...state.scheduler,
            schedule: schedulerAdapter.removeMany(e => e.providerId === providerId, state.scheduler.schedule),
            loading: true,
        },
    })),
    on(PLApproveLocationScheduleSucceed,
        PLClearLocationScheduleSucceed,
        PLLocationSchedulerError, state => ({
            ...state,
            scheduler: {
                ...state.scheduler,
                loading: false,
            },
        })),
    on(PLDeleteSessionSucceed,
        (state, { key }) => ({
            ...state,
            scheduler: {
                ...state.scheduler,
                schedule: schedulerAdapter.removeOne(key, state.scheduler.schedule),
                loading: false,
                loaded: true,
            },
        })),
    on(PLSetLocationSchedule,
        PLScheduleSessionSucceed,
        (state, { locationId, schedule }) => ({
            ...state,
            id: locationId,
            scheduler: {
                ...state.scheduler,
                schedule: schedulerAdapter.upsertMany(schedule, state.scheduler.schedule),
                loading: false,
                loaded: true,
            },
        })),
    on(PLSetProvidersAvailability, ((state, { providersAvailability }) => ({
        ...state,
        scheduler: {
            ...state.scheduler,
            providersAvailability: {
                ...state.scheduler.providersAvailability,
                ...providersAvailability,
            },
            loading: false,
        },
    }))),
);

export function reducer(state: PLLocationState, action: Action) {
    return _reducer(state, action);
}
// #endregion

// #region Selectors
const selectFeatureState = createFeatureSelector<PLLocationState>(featureKey);
export const selectCurrentLocationId = createSelector(selectFeatureState, state => state.id);
export const selectLocationState = createSelector(selectFeatureState, ({ location }) => location);
export const selectLocation = createSelector(selectLocationState, ({ value }) => value);
const selectSchedulerFeature = createSelector(selectFeatureState, state => state.scheduler);
const selectScheduleState = createSelector(selectSchedulerFeature, state => state.schedule);
export const { selectAll: selectLocationSchedule } = schedulerAdapter.getSelectors(selectScheduleState);
export const selectProvidersAvailability = createSelector(selectSchedulerFeature, state => state.providersAvailability);
export const selectLocationScheduleLoaded = createSelector(selectSchedulerFeature, state => state.loaded);
export const selectLocationScheduleLoading = createSelector(selectSchedulerFeature, state => state.loading);
export const selectLocationAvailabilityState = createSelector(selectFeatureState, state => state.avalavility);
export const selectLocationAvailability = createSelector(selectLocationAvailabilityState, ({ value }) => value);
export const selectLocationAvailabilityLoaded = createSelector(selectLocationAvailabilityState, ({ loaded }) => loaded);
// #endregion
