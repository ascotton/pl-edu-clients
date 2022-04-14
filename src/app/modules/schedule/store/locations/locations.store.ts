// Something similar in modules/locations/store
import { createReducer, on, Action, createSelector, props, createAction } from '@ngrx/store';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';

import { PLAddManyPayload } from '@common/store';
import { featureNamespace, selectFeatureState, PLLocationState } from '../feature.state';
import { PLLocation } from '../../models';
import { PLActionResults } from '../helpers';

const entityName = 'Locations';

export const adapter: EntityAdapter<any> = createEntityAdapter<any>({
    selectId: item => item.uuid,
});

// #region Actions
interface LoadAllPayload {
    provider?: string;
    client?: string;
    checkLead?: boolean;
}
interface FetchPayload extends LoadAllPayload {
    page?: number;
}
const baseActionName = `${featureNamespace}.${entityName}.`;
export const PLLoadAllLocations = createAction(`${baseActionName}loadAll`,
    props<{ payload: LoadAllPayload }>());
const fetchActionName = `${baseActionName}fetch`;
export const PLFetchLocations = createAction(fetchActionName,
    props<{ payload: FetchPayload }>());
export const PLFetchLocationsFail = createAction(`${fetchActionName}.${PLActionResults.Fail}`);
export const PLAddLocations = createAction(`${baseActionName}addMany`,
    props<{ payload: PLAddManyPayload<PLLocation> }>());
export const PLStopLocationsLoading = createAction(`${baseActionName}stopLoading`);
export const PLClearLocations = createAction(`${baseActionName}clear`);
// #endregion

// #region Reducer
export const initialState: PLLocationState =
    adapter.getInitialState({
        loaded: false,
        loading: 0,
        total: 0,
    });

const _reducer = createReducer(
    initialState,
    on(PLFetchLocations, state => ({
        ...state,
        loading: state.loading + 1,
    })),
    on(PLStopLocationsLoading, state => ({
        ...state,
        loading: state.loading - 1,
    })),
    on(PLClearLocations, state =>
        adapter.removeAll({
            ...state,
            total: 0,
            loaded: false,
        })),
    on(PLAddLocations, (state, { payload }) =>
        adapter.addMany(payload.list,  {
            ...state,
            loaded: true,
            total: payload.count || state.total,
        })),
);

export function reducer(state: PLLocationState, action: Action) {
    return _reducer(state, action);
}
// #endregion

// #region Selectors
const selectLocationsState = createSelector(selectFeatureState, state => state.locations);

export const {
    selectEntities: selectLocationsEntities,
    selectAll: selectLocations,
    selectTotal: selectLocationsLoadedCount,
} = adapter.getSelectors(selectLocationsState);

export const selectLocationsTotal = createSelector(selectLocationsState, state => state.total);
export const selectAllLocationsLoaded = createSelector(selectLocationsLoadedCount, selectLocationsTotal,
    (loaded, count) => loaded >= count);
export const selectLocationsLoaded = createSelector(selectLocationsState, state => state.loaded);
export const selectLocationsLoading = createSelector(selectLocationsState, state => state.loading > 0);
export const selectLocationsByText = (text: string) => {
    return createSelector(selectLocations, locations => locations.filter(c => c.name.toLowerCase().includes(text)));
};
// #endregion
