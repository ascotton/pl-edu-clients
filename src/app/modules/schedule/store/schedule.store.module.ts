import { NgModule } from '@angular/core';
// NgRx
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
// Module Services
import { PLScheduleServicesModule } from '../services/schedule.services.module';
// Store
import { featureKey } from './feature.state';
import { reducers, effects } from './feature.store';

@NgModule({
    imports: [
        StoreModule.forFeature(featureKey, reducers),
        EffectsModule.forFeature(effects),
        PLScheduleServicesModule,
    ],
})
// TODO: Move billing to Invoice Module
export class PLScheduleStoreModule { }
