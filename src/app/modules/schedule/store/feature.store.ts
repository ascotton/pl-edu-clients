import { ActionReducerMap } from '@ngrx/store';
import { FeatureState } from './feature.state';

import * as schedule from './schedule';
import * as clients from './clients';
import * as locations from './locations';
import * as documentation from './documentation';

export const reducers: ActionReducerMap<FeatureState> = {
    events: schedule.reducer,
    clients: clients.reducer,
    locations: locations.reducer,
    documentation: documentation.reducer,
};

export const effects = [
    schedule.ScheduleEffects,
    clients.ClientsEffects,
    locations.LocationsEffects,
    documentation.DocumentationEffects,
];
