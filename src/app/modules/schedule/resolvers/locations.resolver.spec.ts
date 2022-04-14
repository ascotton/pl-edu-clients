import { TestBed } from '@angular/core/testing';
import { Store, MemoizedSelector } from '@ngrx/store';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
// Store
import * as scheduleStore from '../store/schedule';
// Models
import { User } from '../../user/user.model';
// Resolvers
import { LocationsResolver } from './locations.resolver';

describe('Location Resolver', () => {
    let resolver: LocationsResolver;
    let store: MockStore<scheduleStore.ScheduleEffects>;

    let user: MemoizedSelector<any, User>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                LocationsResolver,
                provideMockStore(),
            ],
        });
        store = TestBed.get<Store<scheduleStore.ScheduleEffects>>(Store);
        resolver = TestBed.get<LocationsResolver>(LocationsResolver);

        user = store.overrideSelector('currentUser', null);
        // loggedIn = store.overrideSelector(fromAuth.getLoggedIn, false);
    });

    it('should be created', () => {
        expect(resolver).toBeTruthy();
    });
});
