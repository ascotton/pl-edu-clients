import * as moment from 'moment';
import {
    on,
    props,
    Action,
    createAction,
    createReducer,
    createSelector,
    createFeatureSelector,
} from '@ngrx/store';
import { PLInvoice, PLInvoicePeriod } from '@root/src/app/modules/billing/pl-invoice';

interface PLInvoiceState {
    periodLoaded: boolean;
    previewLoaded?: boolean;
    previewLoading?: boolean;
    invoicePreview?: PLInvoice;
    invoicePeriod?: PLInvoicePeriod;
}

export const featureKey = 'invoice';
const featureNamespace = '[Invoice]';

// #region Actions
export const PLFetchInvoicePreview =
    createAction(`${featureNamespace} Fetch Invoice Preview`, props<{ source?: string }>());
export const PLSetInvoicePreview =
    createAction(`${featureNamespace} Set Invoice Preview`, props<{ invoicePreview: PLInvoice }>());
export const PLClearInvoicePreview =
    createAction(`${featureNamespace} Clear Invoice Preview`);
// TODO: If we have a more "light" endpoint to get the period use this action
// export const PLFetchInvoicePeriod =
//     createAction(`${featureNamespace} Fetch Invoice Period`, props<{ source?: string }>());
export const PLSetInvoicePeriod =
    createAction(`${featureNamespace} Set Invoice Period`, props<{
        invoicePeriod: PLInvoicePeriod;
        source?: string; }>());
// #endregion

// #region Reducer
const getInvoicePeriod = () => {
    const data = localStorage.getItem('KEY_BILLING_PERIOD');
    if (data) {
        const now = moment();
        const invoicePeriod = JSON.parse(data);
        console.log('--- using cached invoice period', invoicePeriod);
        if (invoicePeriod && now.isSame(invoicePeriod.lastRefresh, 'd')) {
            return { invoicePeriod, periodLoaded: true };
        }
    }
    return { periodLoaded: false };
};

export const initialState: PLInvoiceState = {
    ...getInvoicePeriod(),
};

const _reducer = createReducer(
    initialState,
    on(PLFetchInvoicePreview, state => ({
        ...state,
        previewLoading: true,
    })),
    on(PLClearInvoicePreview, state => ({
        ...state,
        invoicePreview: null,
        previewLoaded: false,
        invoicePeriod: null,
        periodLoaded: false,
    })),
    on(PLSetInvoicePreview,
        (state, { invoicePreview }) => ({
            ...state,
            invoicePreview,
            previewLoaded: true,
            previewLoading: false,
        })),
    on(PLSetInvoicePeriod,
        (state, { invoicePeriod }) => ({
            ...state,
            invoicePeriod: invoicePeriod ? {
                ...invoicePeriod,
                monthName: moment.utc(invoicePeriod.start).clone().add(1, 'days').format('MMMM'),
            } : null,
            periodLoaded: true,
        })),
);

export function reducer(state: PLInvoiceState, action: Action) {
    return _reducer(state, action);
}
// #endregion

// #region Selectors
const selectFeatureState = createFeatureSelector<PLInvoiceState>(featureKey);
export const selectInvoicePeriod = createSelector(selectFeatureState, state => state.invoicePeriod);
export const selectInvoicePeriodLoaded = createSelector(selectFeatureState, state => state.periodLoaded);
export const selectInvoicePreview = createSelector(selectFeatureState, state => state.invoicePreview);
export const selectInvoicePreviewLoadState = createSelector(selectFeatureState, state => ({
    loaded: state.previewLoaded,
    loading: state.previewLoading,
}));
// #endregion
