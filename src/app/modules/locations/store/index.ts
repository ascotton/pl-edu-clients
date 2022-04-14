import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
// Services
import { PLMasterSchedulerService } from '../services';
// Store
import { featureKey, reducer } from './location.store';
import { PLLocationEffects } from './location.effects';

@NgModule({
    imports: [
        StoreModule.forFeature(featureKey, reducer),
        EffectsModule.forFeature([PLLocationEffects]),
    ],
    providers: [
        PLMasterSchedulerService,
    ],
})
export class PLLocationStoreModule { }

export {
    PLFetchLocation,
    PLFetchLocationSchedule,
    PLFetchProvidersAvailability,
    PLFetchLocationAvailability,
    PLSetLocationAvailability,
    PLApproveLocationSchedule,
    PLClearLocationSchedule,
    PLClearReferralSchedule,
    PLScheduleSession,
    PLDeleteSession,
    selectLocation,
    selectLocationState,
    selectCurrentLocationId,
    selectLocationSchedule,
    selectProvidersAvailability,
    selectLocationScheduleLoaded,
    selectLocationScheduleLoading,
    selectLocationAvailability,
    selectLocationAvailabilityState,
    selectLocationAvailabilityLoaded,
} from './location.store';
