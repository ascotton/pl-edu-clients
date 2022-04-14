import { NgModule } from '@angular/core';
// NgRx
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { featureKey, reducer } from './providers.store';
import { ProvidersEffects } from './providers.effects';
// Services
import { PLProviderProfileService } from '../../services/pl-provider-profile.service';

@NgModule({ 
    imports: [
        StoreModule.forFeature(featureKey, reducer),
        EffectsModule.forFeature([ ProvidersEffects ]),
    ],
    providers: [
        PLProviderProfileService,
    ],
})
export class PLProvidersStoreModule { }

export {
    selectProvidersEntities,
    selectProviders,
    selectProvidersByText,
    selectProvidersLoaded,
    selectProvidersLoading,
    selectProvidersView,
    selectProvidersTotal,
    selectAllProvidersLoaded,
    selectProvidersOpts,
    PLFetchProviders,
    PLClearProviders,
    PLLoadAllProviders,
} from './providers.store';
