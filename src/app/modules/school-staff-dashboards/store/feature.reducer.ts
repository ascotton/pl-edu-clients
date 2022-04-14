import { createReducer, on, Action } from '@ngrx/store';
import { FeatureState } from './feature.state';
import {
    PLSetLicenses,
    PLSetOrganizations,
    PLSelectOrganization,
    PLSetOcupations,
    PLAddSinglePlatformUser,
    PLPlatformUserSaveCompleted,
    PLFetchLicenses,
    PLAddMultiplePlatformUser,
    PLUpdateSaveProgress,
    PLSetPlatformUsers,
    PLFetchPlatformUsers,
    PLAgregateOrganizations,
} from './feature.actions';
import {
    usersAdapter,
    licensesAdapter,
    organizationsAdapter,
} from './feature.entities';

export const initialState: FeatureState = {
    users: usersAdapter.getInitialState({ total: 0 }),
    licenses: licensesAdapter.getInitialState(),
    organizations: organizationsAdapter.getInitialState({ total: 0 }),
    userSaveProgress: {
        inProgress: false,
    },
};

const _reducer = createReducer(
    initialState,
    on(PLSetOrganizations,
        (state, { list }) => ({
            ...state,
            organizations: organizationsAdapter
                .setAll(list, { ...state.organizations, loaded: true }),
        })),
    on(PLAgregateOrganizations,
        (state, { list, total }) => ({
            ...state,
            organizations: organizationsAdapter
                .upsertMany(list, {
                    ...state.organizations,
                    loaded: total ?
                        list.length + state.organizations.ids.length >= total
                        : state.organizations.loaded,
                }),
        })),
    on(PLSelectOrganization,
        (state, { item }) => ({
            ...state,
            organizations: {
                ...state.organizations,
                selected: item,
            },
        })),
    on(PLFetchLicenses, state => ({
        ...state,
        licenses: {
            ...state.licenses,
            loading: true,
        },
    })),
    on(PLSetLicenses,
        (state, { list }) => ({
            ...state,
            licenses: licensesAdapter.setAll(list, {
                ...state.licenses,
                loaded: true,
                loading: false,
            }),
        })),
    on(PLSetOcupations,
        (state, { list }) => ({
            ...state,
            licenses: {
                ...state.licenses,
                ocupations: ([...list] || []).sort((a, b) => a.label.localeCompare(b.label)),
            },
        })),
    on(PLFetchPlatformUsers, state => ({
        ...state,
        users: {
            ...state.users,
            loading: true,
        },
    })),
    on(PLSetPlatformUsers,
        (state, { list, total }) => ({
            ...state,
            users: usersAdapter.setAll(list, {
                ...state.users,
                total,
                loaded: true,
                loading: false,
            }),
        })),
    on(PLAddSinglePlatformUser, state => ({
        ...state,
        userSaveProgress: {
            ...state.userSaveProgress,
            inProgress: true,
        },
    })),
    on(PLAddMultiplePlatformUser, (state, { users }) => ({
        ...state,
        userSaveProgress: {
            ...state.userSaveProgress,
            inProgress: true,
            completed: 0,
            total: users.length,
        },
    })),
    on(PLPlatformUserSaveCompleted, state => ({
        ...state,
        userSaveProgress: {
            ...state.userSaveProgress,
            inProgress: false,
        },
    })),
    on(PLUpdateSaveProgress, (state, { total, completed }) => ({
        ...state,
        userSaveProgress: {
            ...state.userSaveProgress,
            total,
            completed,
            inProgress: true,
        },
    })),
);

export function reducer(state: FeatureState, action: Action) {
    return _reducer(state, action);
}
