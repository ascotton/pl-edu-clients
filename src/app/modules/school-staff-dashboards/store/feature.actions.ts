import { createAction, props } from '@ngrx/store';
import { featureNamespace } from './feature.state';
import { Option } from '@common/interfaces';
import { PLLicenseType, PLPlatformUser, PLOrganization } from '../models';
import { PLQueryOptions } from '../services/models';
import { PLTrainingUser } from '../services';

//#region Licenses
/**
 * Triggers an API call to get Licenses Bought in an Org and SY
 * If success triggers PLSetLicenses and PLSetOcupations.
 *
 * @param SY School Year
 * @param orgId Organization ID
 */
export const PLFetchLicenses = createAction(
    `${featureNamespace} Fetch Licenses`,
    props<{ SY?: string, orgId?: string }>());

/**
 * Sets the Licenses list
 *
 * @param list Licenses List
 */
export const PLSetLicenses = createAction(
    `${featureNamespace} Set Licenses`,
    props<{ list: PLLicenseType[] }>());

/**
 * Triggers an API call to Post a User
 * If success triggers PLAddPlatformUser and PLFetchLicenses
 *
 * @param user User to be saved
 */
export const PLSetOcupations = createAction(
    `${featureNamespace} Set Ocupations`,
    props<{ list: Option[] }>());
//#endregion
//#region Platform Users
/**
 * Triggers an API call to get Platform Users
 * If success triggers PLSetUsers
 *
 * @param SY School Year
 * @param organization Organization sfAccountId
 */
export const PLFetchPlatformUsers = createAction(
    `${featureNamespace} Fetch Platform Users`,
    props<{ options: PLQueryOptions, SY?: string, organization?: string, platform?: boolean }>());

/**
 * Sets the User list
 *
 * @param list Licenses List
 */
export const PLSetPlatformUsers = createAction(
    `${featureNamespace} Set Platform Users`,
    props<{ list: PLTrainingUser[], total: number }>());

/**
 * Triggers an API call to get Platform Users
 * If success triggers PLSetUsers
 *
 * @param total Total Number if Users
 * @param completed Number of completed users
 */
export const PLUpdateSaveProgress = createAction(
    `${featureNamespace} Update Save Progress`,
    props<{ total: number, completed: number, errors?: number }>());

/**
 * Triggers an API call to Post a User
 * If success triggers PLAddPlatformUser and PLFetchLicenses
 *
 * @param user User to be saved
 */
export const PLAddSinglePlatformUser = createAction(
    `${featureNamespace} Add Single User`,
    props<{ user: PLPlatformUser }>());

/**
 * Triggers an API call to deactivate a user
 * @param user User to be deactivated
 */
export const PLDeactivatePlatformUser = createAction(
    `${featureNamespace} Deactivate Platform User`,
    props<{ uuid: string }>());

/**
 * Triggers an API call resend set password email
 * @param user User which email will be send
 */
export const PLSendSetPasswordEmail = createAction(
    `${featureNamespace} Send Set Password Platform User`,
    props<{ uuid: string }>());

/**
 * Triggers an API call to Post a list of users
 * If success triggers PLAddPlatformUser and PLFetchLicenses
 *
 * @param users Users to be saved
 * @param invalidUsers Users not valid as per FE
 */
export const PLAddMultiplePlatformUser = createAction(
    `${featureNamespace} Add Multiple User`,
    props<{ users: PLPlatformUser[], csv?: string }>());

/**
 * Used to let UI know a save action has been completed
 * @param multiple If is a bulk or single
 */
export const PLPlatformUserSaveCompleted = createAction(
    `${featureNamespace} Platform User Save Completed`,
    props<{ multiple?: boolean, errorMessage?: string | PLPlatformUser[] }>());
//#endregion

//#region Organizations
/**
 * Triggers an API call to get organizations
 * If success triggers PLSetOrganization.
 */
export const PLFetchOrganizations = createAction(
    `${featureNamespace} Fetch Organizations`);

/**
 * Triggers an API call to get a single organization
 * If success triggers PLAgregateOrganizations.
 */
export const PLFetchOrganization = createAction(
    `${featureNamespace} Fetch Single Organization`,
    props<{ id: string }>());

/**
 * Sets the Organizations list
 * After list is updated triggers PLSelectOrganization if needed
 *
 * @param list Organizations List
 */
export const PLSetOrganizations = createAction(
    `${featureNamespace} Set Organizations`,
    props<{ list: PLOrganization[] }>());

/**
 * Agregates a list of Organizations to current list
 *
 * @param list Organizations List
 */
export const PLAgregateOrganizations = createAction(
    `${featureNamespace} Agregate Organizations`,
    props<{ list: PLOrganization[], total?: number }>());

/**
 * Sets the selected organization
 *
 * @param item Selected organization
 */
export const PLSelectOrganization = createAction(
    `${featureNamespace} Select Organization`,
    props<{ item: PLOrganization }>());
//#endregion
