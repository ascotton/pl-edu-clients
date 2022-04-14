import { createReducer, createSelector, on, Action } from '@ngrx/store';

import { PLSetDocumentationAssistant } from './documentation.actions';

import { PLDocumentationState, selectFeatureState } from '../feature.state';

export const initialState: PLDocumentationState = {
    loaded: false,
    data: null,
};

const _reducer = createReducer(
    initialState,
    on(PLSetDocumentationAssistant,
        (state, { data }) => ({ ...state, data, loaded: true })),
);

export function reducer(state: PLDocumentationState, action: Action) {
    return _reducer(state, action);
}

// #region Selectors
const selectDocumentationState = createSelector(selectFeatureState, state => state.documentation);
export const selectDocumentationData = createSelector(selectDocumentationState, state => state.data);
export const selectDocumentationDataLoaded = createSelector(selectDocumentationState, state => state.loaded);
// #endregion
