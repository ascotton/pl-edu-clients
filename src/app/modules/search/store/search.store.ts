import {
    on,
    props,
    Action,
    createAction,
    createReducer,
    createSelector,
    createFeatureSelector,
} from '@ngrx/store';
import { EntityAdapter, createEntityAdapter, EntityState } from '@ngrx/entity';

import { GET_STORAGE, SET_STORAGE, NORMALIZE_TEXT } from '../../../common/helpers';
import { PLSearchState, PLSearchResult, PL_SEARCH_CATEGORY, PL_SEARCH_CATEGORY_ORDER } from '../models';

export const featureKey = 'search';

const searchAdapter: EntityAdapter<PLSearchResult> = createEntityAdapter<PLSearchResult>({
    selectId: item => item.uuid,
});

// #region Actions
const namespace = '[Search]';

interface PLSearchActionProps {
    limit: number;
    page: number;
}

interface PLSearchSuccessActionProps {
    results: PLSearchResult[];
    totalCount: number;
    userId: string;
}

export const PLLoadHistory = createAction(
    `${namespace} Load History`,
    props<{ userId: string }>());

export const PLAddRecentItem = createAction(
    `${namespace} Add Recent Item`,
    props<{ item: PLSearchResult, userId: string }>());

export const PLAddRecentProvider = createAction(
    `${namespace} Add Recent Provider`,
    props<{ provider: any }>());

export const PLAddRecentLocation = createAction(
    `${namespace} Add Recent Location`,
    props<{ location: any }>());

export const PLAddRecentOrganization = createAction(
    `${namespace} Add Recent Organization`,
    props<{ organization: any }>());
// #region Search Actions
export const PLLoadCachedSearch = createAction(`${namespace} Load Cached Search`, props<{ userId: string }>());

export const PLSearchClients = createAction(`${namespace} Clients`, props<PLSearchActionProps>());
export const PLSearchClientsSuccess = createAction(`${namespace} Clients Success`, props<PLSearchSuccessActionProps>());
export const PLSearchClientsFail = createAction(`${namespace} Clients Fail`);

export const PLSearchLocations = createAction(`${namespace} Locations`, props<PLSearchActionProps>());
// tslint:disable-next-line: max-line-length
export const PLSearchLocationsSuccess = createAction(`${namespace} Locations Success`, props<PLSearchSuccessActionProps>());
export const PLSearchLocationsFail = createAction(`${namespace} Locations Fail`);

export const PLSearchProviders = createAction(`${namespace} Providers`, props<PLSearchActionProps>());
// tslint:disable-next-line: max-line-length
export const PLSearchProvidersSuccess = createAction(`${namespace} Providers Success`, props<PLSearchSuccessActionProps>());
export const PLSearchProvidersFail = createAction(`${namespace} Providers Fail`);

export const PLSearchOrganizations = createAction(`${namespace} Organizations`, props<PLSearchActionProps>());
// tslint:disable-next-line: max-line-length
export const PLSearchOrganizationsSuccess = createAction(`${namespace} Organizations Success`, props<PLSearchSuccessActionProps>());
export const PLSearchOrganizationsFail = createAction(`${namespace} Organizations Fail`);
// #endregion
// #endregion

// #region Initial State and Caching
const searchStorageKey = 'PL_SEARCH_RESULTS';
const recentHistoryStorageKey = 'PL_RECENT_HISTORY';
const searchExpirationTime = 15;

const initialState: PLSearchState = {
    results: searchAdapter.getInitialState(),
    recentHistory: searchAdapter.getInitialState(),
    cached: null,
    clientsCount: null,
    providersCount: null,
    locationsCount: null,
    organizationsCount: null,
};

const setResults = (results: PLSearchResult[], state: PLSearchState, userId?: string) => {
    const response = searchAdapter.addMany(results, state.results);
    SET_STORAGE(`${searchStorageKey}_${userId}`, response, searchExpirationTime);
    return response;
};
// #endregion

// #region Reducer
const _reducer = createReducer(
    initialState,
    on(PLLoadHistory, (state, { userId }) => {
        let recentHistory: EntityState<PLSearchResult> = GET_STORAGE(`${recentHistoryStorageKey}_${userId}`);
        if (!recentHistory) {
            recentHistory = state.recentHistory;
        }
        return { ...state, recentHistory };
    }),
    on(PLLoadCachedSearch, (state, { userId }) => {
        let results: EntityState<PLSearchResult> = GET_STORAGE(`${searchStorageKey}_${userId}`);
        let cached = true;
        if (!results) {
            results = state.results;
            cached = false;
        }
        return { ...state, results, cached };
    }),
    on(PLAddRecentItem, (state, { item, userId }) => {
        const recentHistory = searchAdapter.upsertOne(item, state.recentHistory);
        const results = searchAdapter.upsertOne(item, state.results);
        SET_STORAGE(`${recentHistoryStorageKey}_${userId}`, recentHistory);
        SET_STORAGE(`${searchStorageKey}_${userId}`, results, searchExpirationTime);
        return { ...state, recentHistory, results };
    }),
    on(PLSearchClientsSuccess, (state, { results, totalCount, userId }) => ({
        ...state,
        clientsCount: totalCount,
        results: setResults(results, state, userId),
    })),
    on(PLSearchLocationsSuccess, (state, { results, totalCount, userId }) => ({
        ...state,
        locationsCount: totalCount,
        results: setResults(results, state, userId),
    })),
    on(PLSearchOrganizationsSuccess, (state, { results, totalCount, userId }) => ({
        ...state,
        organizationsCount: totalCount,
        results: setResults(results, state, userId),
    })),
    on(PLSearchProvidersSuccess, (state, { results, totalCount, userId }) => ({
        ...state,
        providersCount: totalCount,
        results: setResults(results, state, userId),
    })),
);

export function reducer(state: PLSearchState, action: Action) {
    return _reducer(state, action);
}
// #endregion

// #region Selectors
const selectFeatureState = createFeatureSelector<PLSearchState>(featureKey);
const selectResultsState = createSelector(selectFeatureState, state => state.results);
const selectHistoryState = createSelector(selectFeatureState, state => state.recentHistory);

export const selectSearchHasCache = createSelector(selectFeatureState, state => state.cached);
export const selectSearchClientsCount = createSelector(selectFeatureState, state => state.clientsCount);
export const selectSearchProvidersCount = createSelector(selectFeatureState, state => state.providersCount);
export const selectSearchLocationsCount = createSelector(selectFeatureState, state => state.locationsCount);
export const selectSearchOrganizationsCount = createSelector(selectFeatureState, state => state.organizationsCount);

export const { selectAll: selectAllSearchResults } = searchAdapter.getSelectors(selectResultsState);
export const { selectAll: selectAllHistory } = searchAdapter.getSelectors(selectHistoryState);

export const selectHistory = createSelector(selectAllHistory,
    // tslint:disable-next-line: align
    history => history.sort((a, b) => {
        const alv = new Date(a.lastViewed);
        const blv = new Date(b.lastViewed);
        return alv > blv ? -1 : 1;
    }).filter((item, idx) => idx < 10));

export const filterResults = (searchText: string, category: PL_SEARCH_CATEGORY) => {
    const normalizedSearchText = NORMALIZE_TEXT(searchText);
    const regEx = new RegExp(normalizedSearchText, 'ig');
    return createSelector(selectAllSearchResults, (results) => {
        return results.filter(r => NORMALIZE_TEXT(r.name).match(regEx) &&
            (r.type === category || category === PL_SEARCH_CATEGORY.All))
            .sort((a, b) => {
                const categoryOrderA = PL_SEARCH_CATEGORY_ORDER[a.type];
                const categoryOrderB = PL_SEARCH_CATEGORY_ORDER[b.type];
                // Category Sort
                let order = categoryOrderA - categoryOrderB;
                if (order === 0) {
                    const nameNormalizedA = NORMALIZE_TEXT(a.name);
                    const nameNormalizedB = NORMALIZE_TEXT(b.name);
                    const idxA = nameNormalizedA.search(regEx);
                    const idxB = nameNormalizedB.search(regEx);
                    // Starts with Sort
                    if (idxA === 0 || idxB === 0) {
                        order = idxA - idxB;
                    }
                    if (order === 0) {
                        // Alphabetical Sort
                        order = nameNormalizedA.localeCompare(nameNormalizedB);
                    }
                }
                return order;
            });
    });
};
// #endregion
