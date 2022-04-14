import { 
    on, 
    props, 
    Action, 
    createAction, 
    createReducer, 
    createSelector, 
    createFeatureSelector,
} from '@ngrx/store';
import { 
    EntityState, 
    EntityAdapter, 
    createEntityAdapter, 
} from '@ngrx/entity';
import { PLBillingCode, PLNoteScheme } from '@common/interfaces';

interface PLBillingState {
    codes: EntityState<PLBillingCode>,
    notes: EntityState<PLNoteScheme>,
}

export const featureKey = 'billing';
const featureNamespace = '[Billing]';
// #region Adapters
const billingCodesAdapter: EntityAdapter<PLBillingCode> = 
    createEntityAdapter<PLBillingCode>({
        selectId: item => item.uuid,
    });
const notesSchemaAdapter: EntityAdapter<PLNoteScheme> = 
    createEntityAdapter<PLNoteScheme>({
        selectId: item => item.uuid,
    });
// #endregion

// #region Actions
export const PLFetchBillingCodes =
    createAction(`${featureNamespace} Fetch Codes`, props<{ client?: string }>());
export const PLSetBillingCodes =
    createAction(`${featureNamespace} Set Codes`, props<{ codes: PLBillingCode[] }>());
export const PLFetchNotesSchemes = createAction(`${featureNamespace} Fetch Note Schemes`);
export const PLSetNotesSchemes =
    createAction(`${featureNamespace} Set Note Schemes`, props<{ schemes: PLNoteScheme[] }>());
// #endregion

// #region Reducer
const initialState: PLBillingState = {
    codes: billingCodesAdapter.getInitialState(),
    notes: notesSchemaAdapter.getInitialState(),
};

const _reducer = createReducer(
    initialState,
    on(PLSetBillingCodes, (state, { codes }) => ({
        ...state,
        codes: billingCodesAdapter.setAll(codes, state.codes)
    })),
    on(PLSetNotesSchemes, (state, { schemes }) => ({ 
        ...state,
        notes: notesSchemaAdapter.setAll(schemes, state.notes) 
    })),
);

export function reducer(state: PLBillingState, action: Action) {
    return _reducer(state, action);
}
// #endregion

// #region Selectors
const selectFeatureState = createFeatureSelector<PLBillingState>(featureKey);
const selectBillingCodeState = createSelector(selectFeatureState, state => state.codes);
const selectNoteSchemaState = createSelector(selectFeatureState, state => state.notes);
export const {
    selectEntities: selectBillingCodesEntities,
    selectAll: selectBillingCodes,
} = billingCodesAdapter.getSelectors(selectBillingCodeState);
export const {
    selectEntities: selectNotesSchemeEntities,
    selectAll: selectNotesScheme,
} = notesSchemaAdapter.getSelectors(selectNoteSchemaState);
export const selectBillingCodesCanProvide = createSelector(
    selectBillingCodes,
    codes => codes.filter(code => code.is_active && code.can_provide));
export const selectBillingCodeInfo = (uuid: string) =>
    createSelector(selectBillingCodesEntities, entities => entities[uuid]);
// #endregion
