import { createFeatureSelector } from '@ngrx/store';
import { EntityState } from '@ngrx/entity';
import {
    PL_CALENDAR_VIEW,
    PLEvent,
    PLClient,
    PLEvaluation,
    PLClientService,
    PLLocation,
} from '../models';
import { PLEntityState } from '@common/store';

export interface PLDocumentationState {
    loaded: boolean;
    data: any;
}

export interface PLEventState extends EntityState<PLEvent> {
    loading: number;
    currentAppointmentId: string;
    evaluations: PLEvaluation[];
    datesLoaded: { start: Date; end: Date };
    view: {
        type: PL_CALENDAR_VIEW;
        date: Date;
        provider?: string;
        unsigned?: boolean;
    };
}

export interface PLClientState extends PLEntityState<PLClient> {
    services: EntityState<PLClientService>;
}

export interface PLLocationState extends PLEntityState<PLLocation> { }

export interface FeatureState {
    events: PLEventState;
    clients: PLClientState;
    locations: PLLocationState;
    documentation: PLDocumentationState;
}

export const featureKey = 'schedule';
export const featureNamespace = '[Schedule]';
export const selectFeatureState = createFeatureSelector<FeatureState>(featureKey);
