import { createSelector } from '@ngrx/store';
import { selectFeatureState } from './feature.state';
import {
    usersAdapter,
    licensesAdapter,
    organizationsAdapter,
} from './feature.entities';
import { selectCurrentUser } from '@common/store';

//#region Licenses
const selectLicensesState = createSelector(selectFeatureState, state => state.licenses);
export const {
    selectEntities: selectLicensesEntities,
    selectAll: selectLicenses,
} = licensesAdapter.getSelectors(selectLicensesState);
export const selectLicensesLoaded = createSelector(selectLicensesState, state => state.loaded);
export const selectLicensesLoading = createSelector(selectLicensesState, state => state.loading);
export const selectOcupations = createSelector(selectLicensesState, state => state.ocupations);
export const selectPlatformUserSaveProgress = createSelector(selectFeatureState,
    state => state.userSaveProgress);
export const selectPlatformUserSaveInProgress = createSelector(selectPlatformUserSaveProgress,
    state => state.inProgress);
export const selectLicensesBought = createSelector(selectLicenses,
    licenses => licenses.filter(license => license.total_quantity || license.quantity_used));
//#endregion

//#region Organizations
const selectOrganizationsState = createSelector(selectFeatureState, state => state.organizations);
export const {
    selectEntities: selectOrganizationsEntities,
    selectAll: selectOrganizations,
} = organizationsAdapter.getSelectors(selectOrganizationsState);
export const selectOrganization =
    (id: string) => createSelector(selectOrganizationsEntities, entities => entities[id]);
export const selectSelectedOrganization = createSelector(selectOrganizationsState, state => state.selected);
export const selectCSContact = createSelector(selectSelectedOrganization, state => state.accountOwner);
export const selectOrganizationsLoaded = createSelector(selectOrganizationsState, state => state.loaded);
//#endregion

const selectPlatformUsersState = createSelector(selectFeatureState, state => state.users);
export const {
    selectEntities: selectPlatformUsersEntities,
    selectAll: selectPlatformUsers,
} = usersAdapter.getSelectors(selectPlatformUsersState);
export const selectPlatformUsersTotal = createSelector(selectPlatformUsersState, state => state.total);
export const selectPlatformUsersLoding = createSelector(selectPlatformUsersState, state => state.loading);

export const selectIsGroupPrivatePractice = createSelector(selectCurrentUser,
    user => user && user.groups ? user.groups.includes('Private Practice - Group') : false);
