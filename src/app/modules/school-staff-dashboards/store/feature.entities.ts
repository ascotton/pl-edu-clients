import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { PLLicenseType, PLOrganization } from '../models';
import { PLTrainingUser } from '../services';

export const organizationsAdapter: EntityAdapter<PLOrganization> =
    createEntityAdapter<PLOrganization>({
        selectId: ({ id }) => id,
        sortComparer: (a, b) => a.name.localeCompare(b.name),
    });

export const licensesAdapter: EntityAdapter<PLLicenseType> =
    createEntityAdapter<PLLicenseType>({
        selectId: ({ uuid }) => uuid,
    });

export const usersAdapter: EntityAdapter<PLTrainingUser> =
    createEntityAdapter<PLTrainingUser>({
        selectId: ({ uuid }) => uuid,
    });
