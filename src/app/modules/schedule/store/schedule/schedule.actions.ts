import { createAction, props } from '@ngrx/store';

import { PL_CREATE_ACTIONS } from '../helpers';
import { PL_EVENT_SOURCE, PL_CALENDAR_VIEW, PLEvent, PLEvaluation, PLEventRepeatMode } from '../../models';
import { featureNamespace } from '../feature.state';

export const PLSchedulerError = createAction(
    `${featureNamespace} Error`,
    props<{ error?: string; }>());

export const {
    initial: PLSaveEvent,
    fail: PLSaveEventFailed,
} = PL_CREATE_ACTIONS<{
    event: PLEvent,
    prevEvent?: PLEvent,
    repeat: PLEventRepeatMode,
    type?: string,
    document: boolean,
    keepOpen: boolean,
    runCancel?: Function,
}, {
    event: PLEvent,
    document: boolean,
    keepOpen: boolean,
}>(`${featureNamespace} Save Event`);

/**
 * Triggers an API call to delete the event,
 * If success triggers PLRemoveEvent or PLRemoveRepeatingEvent.
 *
 * @param event The Event to delete.
 */
export const PLDeleteEvent = createAction(`${featureNamespace} Delete Event`,
    props<{ event: PLEvent; deleteType: string, isAmendable?: boolean; }>());
/**
 * Remove a single event from the store.
 *
 * @param uuid The ID of the event to remove.
 */
export const PLRemoveEvent = createAction(`${featureNamespace} Remove Event`,
    props<{ uuid: string; }>());
/**
 * Remove a repeating event from the store.
 *
 * @param uuid The ID of the event to remove.
 * @param following The Date of the following events to remove.
 */
export const PLRemoveRepeatingEvent = createAction(`${featureNamespace} Remove Repeating Event`,
    props<{ uuid: string; following?: string }>());

export const PLGetEvents = createAction(
    `${featureNamespace} Get Events`,
    props<{ source: PL_EVENT_SOURCE, start?: Date, end?: Date, provider?: string, timezone?: string }>());

export const PLSetCalendarView = createAction(
    `${featureNamespace} Set view`, props<{
        date: Date,
        unsigned?: boolean,
        viewType?: PL_CALENDAR_VIEW,
        provider?: string,
    }>());

export const PLGoToCalendar = createAction(`${featureNamespace} Go to calendar`);

export const {
    initial: PLLoadEvents,
    success: PLLoadEventsSuccess,
    fail: PLLoadEventsFail,
    // tslint:disable-next-line: max-line-length
} = PL_CREATE_ACTIONS<{ source: PL_EVENT_SOURCE, start: Date, end: Date, provider?: string, timezone?: string }, { events: PLEvent[], start: Date, end: Date }>(`${featureNamespace} Load Events`);

export const PLLoadAppointment = createAction(
    `${featureNamespace} Load Appointment`,
    props<{ payload: string }>());
export const PLSetAppointment = createAction(
    `${featureNamespace} Set Local Appointment`,
    props<{ appointment: PLEvent, document?: boolean, keepOpen?: boolean }>());

export const {
    initial: PLLoadEvaluations,
    success: PLLoadEvaluationsSuccess,
    fail: PLLoadEvaluationsFail,
} = PL_CREATE_ACTIONS<{ statusIn: string, assignedTo?: string }, PLEvaluation[]>(`${featureNamespace} Load Evaluations`);
