import { createReducer, on, Action, createSelector, createAction, props, createFeatureSelector } from '@ngrx/store';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { PLActionResults } from '@modules/schedule/store/helpers';
import { PLProviderProfile, Option } from '../../interfaces';
import { PLEntityState, PLAddManyPayload } from '../common.store';

export const featureKey = 'providers';
const featureNamespace = '[PROVIDERS]';
const entityName = 'Providers';
export interface PLProviderState extends PLEntityState<PLProviderProfile> {
    view?: string;
}

// #region Actions
interface LoadAllPayload {
    locationId?: string;
}
interface FetchPayload extends LoadAllPayload {
    page?: number;
}
const baseActionName = `${featureNamespace}.${entityName}.`;
export const PLLoadAllProviders = createAction(`${baseActionName}loadAll`,
    props<{ payload: LoadAllPayload, dontClear?: boolean }>());
const fetchActionName = `${baseActionName}fetch`;
export const PLFetchProviders = createAction(fetchActionName,
    props<{ payload: FetchPayload }>());
export const PLFetchProvidersFail = createAction(`${fetchActionName}.${PLActionResults.Fail}`,
    props<{ payload: any }>());
export const PLAddProviders = createAction(`${baseActionName}addMany`,
    props<{ payload: PLAddManyPayload<PLProviderProfile> }>());
export const PLClearProviders = createAction(`${baseActionName}clear`);
export const PLStopProvidersLoading = createAction(`${baseActionName}stopLoading`);

export const adapter: EntityAdapter<PLProviderProfile> = createEntityAdapter<PLProviderProfile>({
    selectId: item => item.id,
    sortComparer: (a, b) => `${a.user.lastName} ${a.user.firstName}`
        .localeCompare(`${b.user.lastName} ${b.user.firstName}`),
});

// #region Reducer
export const initialState: PLProviderState = adapter.getInitialState({
    loaded: false,
    loading: 0,
    total: 0,
});

const _reducer = createReducer(
    initialState,
    on(PLFetchProviders, (state, { payload }) => ({
        ...state,
        loading: state.loading + 1,
        view: `location-${payload.locationId}`,
    })),
    on(PLStopProvidersLoading, state => ({
        ...state,
        loading: state.loading - 1,
    })),
    on(PLClearProviders, state =>
        adapter.removeAll({
            ...state,
            total: 0,
            loaded: false,
        })),
    on(PLAddProviders, (state, { payload }) =>
        adapter.upsertMany(payload.list,  {
            ...state,
            loaded: true,
            total: payload.count || state.total,
        })),
);

export function reducer(state: PLProviderState, action: Action) {
    return _reducer(state, action);
}
// #endregion

// #region Selectors
const selectFeatureState = createFeatureSelector<PLProviderState>(featureKey);

export const {
    selectEntities: selectProvidersEntities,
    selectAll: selectProviders,
    selectTotal: selectProvidersLoadedCount,
} = adapter.getSelectors(selectFeatureState);

export const selectProvidersTotal = createSelector(selectFeatureState, state => state.total);
export const selectAllProvidersLoaded = createSelector(selectProvidersLoadedCount, selectProvidersTotal,
    (loaded, count) => loaded >= count);
export const selectProvidersLoaded = createSelector(selectFeatureState, state => state.loaded);
export const selectProvidersLoading = createSelector(selectFeatureState, state => state.loading > 0);
export const selectProvidersView = createSelector(selectFeatureState, state => state.view);
export const selectProvidersOpts = (byUser = true) => createSelector(selectProviders,
    providers => <Option[]>providers.map(({ user, id }) =>
        ({
            value: byUser ? user.id : id,
            label: `${user.lastName}, ${user.firstName}`,
        }),
    ));
export const selectProvidersByText = (text: string) => {
    const lText = text.toLowerCase();
    return createSelector(selectProviders, providers =>
        providers.filter(c => c.user.lastName.toLowerCase().includes(lText)
            || c.user.firstName.toLowerCase().includes(lText)));
};
// #endregion
