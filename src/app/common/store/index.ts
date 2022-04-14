import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
// Services
// import { PLGraphQLModule } from '@root/index';
import { PLSchoolYearsService, PLProviderTypesService } from '../services';
import { PLReferralService } from '@modules/locations/services';
// Store
import { reducer, featureKey } from './common.store';
import { PLCommonEffects } from './common.effects';
// Shared Stores
import { PLBillingStoreModule } from './billing';
import { PLInvoiceStoreModule } from './invoice';
import { PLTimesheetStoreModule } from './timesheet';
import { PLProvidersStoreModule } from './providers';

@NgModule({
    imports: [
        StoreModule.forFeature(featureKey, reducer),
        EffectsModule.forFeature([PLCommonEffects]),
        PLBillingStoreModule,
        PLInvoiceStoreModule,
        PLTimesheetStoreModule,
        PLProvidersStoreModule,
    ],
    providers: [
        PLSchoolYearsService,
        PLProviderTypesService,
        PLReferralService,
    ],
})
export class PLCommonStoreModule { }

export {
    PLLoadedState,
    PLEntityState,
    PLAddManyPayload,
    setLoadedState,
    PLSelectSchoolYear,
    PLFetchCurrentSchoolYear,
    PLFetchProviderTypes,
    PLFetchReferrals,
    PLFetchCurrentSchoolYearSuccess,
    PLFetchSchoolYears,
    PLNotify,
    PLErrorNotification,
    PLSuccessNotification,
    selectSchoolYearsState,
    selectSchoolYears,
    selectCurrentSchoolYear,
    selectCurrentSchoolYearId,
    selectSelectedSchoolYear,
    selectSelectedSchoolYearId,
    selectProviderTypes,
    selectProviderTypesState,
    selectReferrals,
    selectReferralsState,
    selectProviderTypesShort,
    selectProviderTypesLong,
} from './common.store';

export {
    selectLoadedUser,
    selectCurrentUser,
    selectCurrentUserId,
    selectCurrentUserLoaded,
    selectIsServiceAndSupport,
    selectIsTechSupport,
    selectIsW2User,
    selectIsCAM,
} from './user.selectors';
