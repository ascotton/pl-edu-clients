import {
    Action, createAction, createFeatureSelector,
    createReducer, createSelector, on, props,
} from '@ngrx/store';

// TODO: move the below interface to timesheets.ts where all interfaces live?
interface PLTimesheetState {
    loaded: boolean;
    timesheetPreview?: any; // TODO: should this be of type PLTimesheetPreview
}

const featureNameSpace = '[Timesheet]';
export const timesheetStoreSelectorKey = 'timesheet';

//#region Actions
export const PLFetchTimesheetPreview = createAction(`${featureNameSpace} Fetch Timesheet Preview`);
export const PLClearTimesheetPreview = createAction(`${featureNameSpace} Clear Timesheet Preview`);
export const PLSetTimesheetPreview = createAction(
    `${featureNameSpace} Set Timesheet Preview`,
    props<{ timesheetPreview: any }>(),
);
//#endregion

//#region Selectors
const featureStateSelector = createFeatureSelector<PLTimesheetState>(timesheetStoreSelectorKey);
export const selectTimesheetPreview = createSelector(featureStateSelector, state => state.timesheetPreview);
export const selectTimesheetPreviewLoaded = createSelector(featureStateSelector, state => state.loaded);
//#endregion

const initialState: PLTimesheetState = {
    loaded: false,
    timesheetPreview: 'Timesheet preview in initial state.',
};

const _reducer = createReducer(
    initialState,
    on(PLFetchTimesheetPreview, state => ({
        ...state,
        timesheetPreview: 'Fetching the preview of the timesheet.',
    })),
    on(PLSetTimesheetPreview, (state, { timesheetPreview }) => ({
        ...state,
        timesheetPreview,
        loaded: true,
    })),
    on(PLClearTimesheetPreview, state => ({
        ...state,
        timesheetPreview: null,
        loaded: false,
    })),
);

export function reducer(state: PLTimesheetState, action: Action) {
    return _reducer(state, action);
}
