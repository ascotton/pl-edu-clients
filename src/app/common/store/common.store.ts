import {
    on,
    props,
    Action,
    createAction,
    createReducer,
    createSelector,
    createFeatureSelector,
} from '@ngrx/store';
// Models
import {
    PLReferralFilters,
    PLSchoolYear,
    PLReferral,
    Option,
} from '../interfaces';
import { PLProviderType } from '@modules/schedule/models';
import { EntityState, createEntityAdapter, EntityAdapter } from '@ngrx/entity';

export const featureKey = 'common';
const namespace = '[COMMON]';

export interface PLLoadedState<T> {
    loaded: boolean;
    loading: boolean;
    value: T;
}

export interface PLEntityState<T> extends EntityState<T> {
    loaded: boolean;
    loading: number;
    total?: number;
    selected?: string;
}

export interface PLAddManyPayload<T> {
    list: T[];
    count?: number;
}

export interface PLSchoolYearsState extends EntityState<PLSchoolYear> {
    selected?: string;
    current?: string;
    loaded?: boolean;
}

export const schoolYearsAdapter: EntityAdapter<PLSchoolYear> =
    createEntityAdapter<PLSchoolYear>({
        sortComparer: (a, b) => b.name.localeCompare(a.name),
    });
interface PLCommonState {
    schoolYears: PLSchoolYearsState;
    providerTypes: PLLoadedState<PLProviderType[]>;
    referrals: {
        loading: boolean;
        query: PLReferralFilters,
        results: PLReferral[],
    };
}

// tslint:disable-next-line: max-line-length
export const setLoadedState = <T>(value: T, loaded = false, loading = false): PLLoadedState<T> => ({ value, loaded, loading });

//#region Notification Actions
export const PLSuccessNotification = createAction(
    `${namespace} Success Notification`,
    props<{ title: string, message: string, config?: any }>());
export const PLErrorNotification = createAction(
    `${namespace} Error Notification`,
    props<{ title: string, message: string, config?: any }>());
export const PLNotify = createAction(
    `${namespace} Notify User`,
    props<{ title: string, message: string, notificationType: string, config?: any }>());
//#endregion
//#region School Year Actions
export const PLFetchCurrentSchoolYear = createAction(`${namespace} Fetch Current School Year`);
export const PLFetchCurrentSchoolYearSuccess = createAction(
    `${namespace}_{SUCCESS} Fetch Current School Year`,
    props<{ currentSchoolYear: PLSchoolYear }>());
export const PLFetchCurrentSchoolYearFail = createAction(`${namespace}_{FAIL} Fetch Current School Year`);

export const PLFetchSchoolYears = createAction(`${namespace} Fetch School Years`);
export const PLSetSchoolYears = createAction(`${namespace} Set School Years`,
    props<{ list: PLSchoolYear[] }>());
export const PLSelectSchoolYear = createAction(`${namespace} Select School Year`,
    props<{ schoolYear: string }>());
//#endregion

// #region Common Actions
export const PLFetchReferrals = createAction(
    `${namespace} Fetch Referrals`,
    props<{ filters?: PLReferralFilters }>());
export const PLFetchReferralsSucceed = createAction(
    `${namespace} Fetch Referrals [Succeed]`,
    props<{ referrals: PLReferral[] }>());
export const PLUpdateReferral = createAction(
    `${namespace} Update Referral`,
    props<{ referral: PLReferral }>());

export const PLFetchProviderTypes = createAction(`${namespace} Fetch Provider Types`);
export const PLFetchProviderTypesSucceed = createAction(
    `${namespace} Fetch Provider Types [Succeed]`,
    props<{ providerTypes: PLProviderType[]}>());
export const PLFetchProviderTypesFail = createAction(`${namespace} Fetch Provider Types [Fail]`);
// #endregion

// #region Initial State
const initialState: PLCommonState = {
    providerTypes: setLoadedState<PLProviderType[]>([]),
    schoolYears: schoolYearsAdapter.getInitialState(),
    referrals: {
        query: {},
        results: [],
        loading: false,
    },
};
// #endregion

// #region Reducer
const _reducer = createReducer(
    initialState,
    on(PLFetchProviderTypes, state => ({
        ...state,
        providerTypes: setLoadedState(state.providerTypes.value, false, true),
    })),
    on(PLFetchProviderTypesSucceed, (state, { providerTypes }) => ({
        ...state,
        providerTypes: setLoadedState(providerTypes, true, false),
    })),
    on(PLFetchProviderTypesFail, state => ({
        ...state,
        providerTypes: setLoadedState(state.providerTypes.value),
    })),
    on(PLFetchReferrals, (state, { filters }) => ({
        ...state,
        referrals: {
            ...state.referrals,
            query: filters || state.referrals.query,
            loading: true,
        },
    })),
    on(PLFetchReferralsSucceed, (state, { referrals }) => ({
        ...state,
        referrals: {
            ...state.referrals,
            results: referrals,
            loading: false,
        },
    })),
    on(PLUpdateReferral, (state, { referral }) => ({
        ...state,
        referrals: {
            ...state.referrals,
            results: [
                ...state.referrals.results
                    .filter(({ id }) =>  referral.id !== id),
                referral,
            ],
        },
    })),
    on(PLSetSchoolYears, (state, { list }) => {
        const currentSY = list.find(({ isCurrent }) => isCurrent);
        const current = currentSY ? currentSY.id : null;
        const selectedSY = state.schoolYears.selected;
        return {
            ...state,
            schoolYears:
                schoolYearsAdapter.setAll(list, {
                    ...state.schoolYears,
                    current,
                    selected: selectedSY || current,
                    loaded: true,
                }),
        };
    }),
    on(PLSelectSchoolYear, (state, { schoolYear: selected }) => ({
        ...state,
        schoolYears: { ...state.schoolYears, selected },
    })),
);

export function reducer(state: PLCommonState, action: Action) {
    return _reducer(state, action);
}
// #endregion

// #region Selectors
const selectFeatureState = createFeatureSelector<PLCommonState>(featureKey);
// School Year
export const selectSchoolYearsState = createSelector(selectFeatureState, state => state.schoolYears);
export const {
    selectAll: selectAllSchoolYears,
    selectEntities: selectSchoolYearEntities,
} = schoolYearsAdapter.getSelectors(selectSchoolYearsState);
export const selectSchoolYears = createSelector(selectAllSchoolYears, list => list.slice(0, 5));
export const selectSelectedSchoolYearId = createSelector(selectSchoolYearsState, state => state.selected);
export const selectSelectedSchoolYear = createSelector(
    selectSchoolYearEntities, selectSelectedSchoolYearId,
    (entities, selected) => entities[selected]);
export const selectCurrentSchoolYearId = createSelector(selectSchoolYearsState, state => state.current);
export const selectCurrentSchoolYear = createSelector(
    selectSchoolYearEntities, selectCurrentSchoolYearId,
    (entities, current) => entities[current]);
// Provider Types
export const selectProviderTypesState = createSelector(selectFeatureState, state => state.providerTypes);
export const selectProviderTypes = createSelector(selectProviderTypesState, state => state.value);
export const selectProviderTypesShort = createSelector(selectProviderTypesState,
    (state): Option[] => state.value.map(pt => ({ value: pt.id, label: pt.shortName })));
export const selectProviderTypesLong = createSelector(selectProviderTypesState,
    (state): Option[] => state.value.map(pt => ({ value: pt.id, label: pt.longName })));
// Referrals
export const selectReferralsState = createSelector(selectFeatureState, state => state.referrals);
export const selectReferrals = createSelector(selectReferralsState, state => state.results);
// #endregion
