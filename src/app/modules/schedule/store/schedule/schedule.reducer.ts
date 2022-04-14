import * as moment from 'moment';
import { createReducer, on, Action } from '@ngrx/store';
import { PL_CALENDAR_VIEW } from '../../models';
import { PLEventState } from '../feature.state';

import { eventAdapter } from './schedule.entities';
import {
    PLLoadEvents,
    PLLoadAppointment,
    PLLoadEventsFail,
    PLLoadEventsSuccess,
    PLSetAppointment,
    PLSetCalendarView,
    PLLoadEvaluationsSuccess,
    PLSaveEvent,
    PLDeleteEvent,
    PLRemoveEvent,
    PLRemoveRepeatingEvent,
    PLSchedulerError,
} from './schedule.actions';

export const initialState: PLEventState = eventAdapter.getInitialState({
    currentAppointmentId: '',
    evaluations: [],
    datesLoaded: null,
    loading: 0,
    view: {
        type: PL_CALENDAR_VIEW.Week,
        date: null,
    },
});

const _reducer = createReducer(
    initialState,
    on(PLLoadEvents, PLLoadAppointment, PLSaveEvent, PLDeleteEvent,
        state => ({ ...state, loading: state.loading + 1 })),
    on(PLLoadEventsFail, PLSchedulerError,
        state => ({ ...state, loading: state.loading - 1 })),
    on(PLLoadEventsSuccess, (state, { payload }) => {
        let { loading } = state;
        const { events } =  payload;
        loading -= 1;
        const newState = eventAdapter.removeAll({ ...state, loading });
        return eventAdapter.setAll(events,  newState);
    }),
    on(PLSetAppointment, (state, { appointment }) => {
        let { loading } = state;
        const { event, original_start } = appointment;
        loading -= 1;
        const newState = eventAdapter.removeOne(`evt__${event.uuid}${event.repeating
            ? `__${original_start}` : ''}`, state);
        return eventAdapter.upsertOne(appointment,  {
            ...newState,
            loading,
            currentAppointmentId: appointment.uuid,
        });
    }),
    on(PLRemoveEvent, (state, payload) => ({
        ...eventAdapter.removeOne(payload.uuid, state),
        loading: state.loading - 1,
    })),
    on(PLRemoveRepeatingEvent, (state, action) => ({
        ...eventAdapter.removeMany((item) => {
            const { uuid, signed, event, original_start } = item;
            let remove = [uuid, event.uuid].includes(action.uuid);
            if (remove && action.following) {
                remove = moment(original_start).isSameOrAfter(action.following);
            }
            return remove;
        },  state),
        loading: state.loading - 1,
    })),
    on(PLSetCalendarView, (state, action) => {
        const { viewType, date, unsigned } = action;
        const type = viewType ? viewType : state.view.type;
        return {
            ...state,
            view: {
                date,
                type,
                unsigned,
            },
        };
    }),
    on(PLLoadEvaluationsSuccess, (state, { payload: evaluations }) => ({ ...state, evaluations })),
);

export function reducer(state: PLEventState, action: Action) {
    return _reducer(state, action);
}
