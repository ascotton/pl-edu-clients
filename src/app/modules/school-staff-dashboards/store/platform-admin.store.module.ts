import { NgModule } from '@angular/core';
// NgRx
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
// Module Services
import {
    PLSchoolStaffService,
    PLPlatformUsersService,
} from '../services';
// Store
import { featureKey } from './feature.state';
import { reducer } from './feature.reducer';
import { PlatformAdminEffects } from './feature.effects';

@NgModule({
    imports: [
        StoreModule.forFeature(featureKey, reducer),
        EffectsModule.forFeature([PlatformAdminEffects]),
    ],
    providers: [
        PLSchoolStaffService,
        PLPlatformUsersService,
    ],
})
export class PLPlatformAdminStoreModule { }
