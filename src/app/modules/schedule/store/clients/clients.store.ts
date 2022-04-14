import { createReducer, on, Action, createSelector, createAction, props } from '@ngrx/store';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';

import { PL_CREATE_ACTIONS, PLActionResults } from '../helpers';
import { PLClient, PLClientService } from '../../models';
import { featureNamespace, selectFeatureState, PLClientState } from '../feature.state';
import { PLAddManyPayload } from '@common/store';

const entityName = 'Clients';

const adapter: EntityAdapter<PLClient> = createEntityAdapter<PLClient>({
    selectId: item => item.uuid,
});

const serviceAdapter: EntityAdapter<PLClientService> = createEntityAdapter<PLClientService>({
    selectId: item => item.uuid,
});

// #region Actions
interface LoadAllPayload {
    provider?: string;
}
interface FetchPayload extends LoadAllPayload {
    page?: number;
}
const baseActionName = `${featureNamespace}.${entityName}.`;
export const PLLoadAllCaseload = createAction(`${baseActionName}Caseload.loadAll`,
    props<{ payload: LoadAllPayload }>());
export const PLFetchCaseload = createAction(`${baseActionName}Caseload.fetch`,
    props<{ payload: FetchPayload }>());
export const PLFetchCaseloadFail = createAction(`${baseActionName}Caseload.fetch.${PLActionResults.Fail}`);
export const PLAddCaseload = createAction(`${baseActionName}addMany`,
    props<{ payload: PLAddManyPayload<PLClient> }>());
export const PLStopClientsLoading = createAction(`${baseActionName}stopLoading`);
export const PLClearClients = createAction(`${baseActionName}clear`);

export const {
    initial: PLLoadClients,
    success: PLLoadClientsSuccess,
    fail: PLLoadClientsFail,
} = PL_CREATE_ACTIONS<string, PLClient[]>(`${featureNamespace} Load ${entityName}`);

export const {
    initial: PLGetClient,
    success: PLGetClientSuccess,
    fail: PLGetClientFail,
} = PL_CREATE_ACTIONS<string, PLClient>(`${featureNamespace} Get ${entityName} By Id`);

export const {
    initial: PLGetClientServices,
    success: PLGetClientServicesSuccess,
    fail: PLGetClientServicesFail,
} = PL_CREATE_ACTIONS<{ client: string, billingCode?: string, provider?: string }, PLClientService[]>(`${featureNamespace} Get ${entityName} Services`);
// #endregion

// #region Reducer
export const initialState: PLClientState = adapter.getInitialState({
    loading: 0,
    loaded: false,
    total: 0,
    services: serviceAdapter.getInitialState(),
});

const _reducer = createReducer(
    initialState,
    on(PLGetClientSuccess, (state, { payload }) => adapter.upsertOne(payload, state)),
    on(PLLoadClientsSuccess, (state, { payload }) => adapter.upsertMany(payload, state)),
    on(PLGetClientServicesSuccess, (state, { payload }) => ({
        ...state,
        services: serviceAdapter.addMany(payload, state.services),
    })),
    on(PLFetchCaseload, state => ({
        ...state,
        loading: state.loading + 1,
    })),
    on(PLStopClientsLoading, state => ({
        ...state,
        loading: state.loading - 1,
    })),
    on(PLClearClients, state => adapter.removeAll({
        ...state,
        total: 0,
        loaded: false,
    })),
    on(PLAddCaseload, (state, { payload }) =>
        adapter.addMany(payload.list,  {
            ...state,
            loaded: true,
            total: payload.count || state.total,
        })),
);

export function reducer(state: PLClientState, action: Action) {
    return _reducer(state, action);
}
// #endregion

// #region Selectors
const selectClientState = createSelector(selectFeatureState, state => state.clients);

export const {
    selectEntities: selectClientsEntities,
    selectAll: selectClients,
    selectTotal: selectClientsLoadedCount,
} = adapter.getSelectors(selectClientState);

export const selectClientsByText = (text: string) => {
    return createSelector(selectClients, clients =>
        clients.filter(c => c.last_name.toLowerCase().includes(text) || c.first_name.toLowerCase().includes(text)));
};

// TODO: in_caseload is coming null
export const selectCaseload = createSelector(selectClients, clients => clients.filter(c => c.in_caseload));
export const selectClientsLoaded = createSelector(selectClientState, state => state.loaded);
export const selectClientsLoading = createSelector(selectClientState, state => state.loading > 0);
export const selectClientsTotal = createSelector(selectClientState, state => state.total);

const selectClientServicesState = createSelector(selectClientState, state => state.services);

export const {
    selectAll: selectAllClientServices,
} = serviceAdapter.getSelectors(selectClientServicesState);

export const selectClientServices = (activeOnly = true, excludeLocked = true) => createSelector(
    selectAllClientServices,
    (clientServices) => {
        let result = clientServices;
        if (activeOnly) {
            result = clientServices.filter(clientService => clientService.is_active);
        }
        if (excludeLocked) {
            result = clientServices.filter(clientService => !clientService.locked);
        }
        return result;
    });
// #endregion
