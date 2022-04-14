import { createReducer, on, Action, createSelector } from '@ngrx/store';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';

import { PL_CREATE_ACTIONS } from '../helpers';
import { featureNamespace, selectFeatureState, PLProviderState } from '../feature.state';

const entityName = 'Providers';

export const adapter: EntityAdapter<any> = createEntityAdapter<any>({
    selectId: item => item.uuid,
});

// #region Actions
export const {
    initial: PLLoadProviders,
    success: PLLoadProvidersSuccess,
    fail: PLLoadProvidersFail,
} = PL_CREATE_ACTIONS<string, any[]>(`${featureNamespace} Load ${entityName}`);
// #endregion

// #region Reducer
export const initialState: PLProviderState = adapter.getInitialState();

const _reducer = createReducer(
    initialState,
    on(PLLoadProvidersSuccess, (state, { payload }) => adapter.setAll(payload,  state)),
);

export function reducer(state: PLProviderState, action: Action) {
    return _reducer(state, action);
}
// #endregion

// #region Selectors
const selectProvidersState = createSelector(selectFeatureState, state => state.providers);

export const {
    selectEntities: selectProvidersEntities,
    selectAll: selectProviders,
} = adapter.getSelectors(selectProvidersState);

export const selectProvidersByText = (text: string) => {
    return createSelector(selectProviders, providers =>
        providers.filter(c => c.last_name.toLowerCase().includes(text) || c.first_name.toLowerCase().includes(text)));
};
// #endregion
