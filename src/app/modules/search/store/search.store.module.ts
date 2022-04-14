import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
// Services
import { PLSearchService } from '../services';
// Store
import { reducer, featureKey } from './search.store';
import { SearchEffects } from './search.effects';

@NgModule({
    imports: [
        StoreModule.forFeature(featureKey, reducer),
        EffectsModule.forFeature([SearchEffects]),
    ],
    providers: [
        PLSearchService,
    ],
})
export class PLSearchStoreModule { }
