import { createFeatureSelector } from '@ngrx/store';
import { EntityState } from '@ngrx/entity';
import { PLOrganization, PLLicenseType } from '../models';
import { Option } from '@common/interfaces';
import { PLTrainingUser } from '../services';

export interface PLOrganizationsState extends EntityState<PLOrganization> {
    selected?: PLOrganization;
    total: number;
    loaded?: boolean;
    loading?: boolean;
}

export interface PLLicensesState extends EntityState<PLLicenseType> {
    loaded?: boolean;
    loading?: boolean;
    ocupations?: Option[];
}

export interface PLPlatformUsersState extends EntityState<PLTrainingUser> {
    total: number;
    loaded?: boolean;
    loading?: boolean;
}

export interface FeatureState {
    organizations: PLOrganizationsState;
    licenses: PLLicensesState;
    users: PLPlatformUsersState;
    userSaveProgress: {
        inProgress: boolean;
        errors?: boolean;
        total?: number;
        completed?: number;
    };
}

export const featureKey = 'platform-admin';
export const featureNamespace = '[PlatformAdmin]';
export const selectFeatureState = createFeatureSelector<FeatureState>(featureKey);
