import {
    select,
    createSelector,
    createFeatureSelector,
} from '@ngrx/store';
import { pipe } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import { User } from '@modules/user/user.model';
import { AppStore } from '../../appstore.model';

const hasGroup = (user: User, group: string, allowToSuperUser = false) =>
    (allowToSuperUser && !!user['is_superuser'])
    || user.groups && user.groups.includes(group);

export const selectCurrentUser = createFeatureSelector<User>('currentUser');
export const selectLoadedUser = pipe(
    select((state: AppStore) => state.currentUser),
    filter(user => !!user && !!user.uuid),
);
export const selectCurrentUserLoaded = createSelector(selectCurrentUser,
    user => !!user && !!user.uuid);
export const selectCurrentUserId = createSelector(selectCurrentUser,
    ({ uuid }) => uuid);
export const selectIsServiceAndSupport = createSelector(selectCurrentUser,
    user => hasGroup(user, 'Service & Support', true));
export const selectIsCustomerAdmin = createSelector(selectCurrentUser,
    user => hasGroup(user, 'CustomerAdmin'));
export const selectIsCAM = createSelector(selectCurrentUser,
    user => hasGroup(user, 'Clinical Account Manager', true));
export const selectIsTechSupport = createSelector(selectCurrentUser,
    user => hasGroup(user, 'Tech Support', true));
export const selectIsW2User = createSelector(selectCurrentUser,
    ({ xProvider, xEnabledFeatures }) =>
        xProvider && xProvider.isW2 && xEnabledFeatures.includes('timesheet'));
