import { createSelector } from '@ngrx/store';
import { eventAdapter } from './schedule.entities';
import { selectFeatureState } from '../feature.state';

// #region Selectors
const selectEventState = createSelector(selectFeatureState, state => state.events);

export const {
    selectEntities: selectEventsEntities,
    selectAll: selectEvents,
} = eventAdapter.getSelectors(selectEventState);

export const selectScheduleView = createSelector(selectEventState, state => state.view);

export const selectIsLoadingEvents = createSelector(selectEventState, state => state.loading > 0);

export const selectCurrentEventId = createSelector(selectEventState, state => state.currentAppointmentId);

export const selectCurrentEvent  = createSelector(
    selectEventsEntities,
    selectCurrentEventId,
    (entities, key) => key ? entities[key] : null);

export const selectDatesLoaded = createSelector(selectEventState, state => state.datesLoaded);

export const selectEvaluations = createSelector(selectEventState, state => state.evaluations);
// #endregion
