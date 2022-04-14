import { from } from 'rxjs';

import { PLGraphQLService } from '@root/index';
import { PLProviderProfile } from '@common/interfaces';

import { PLProviderProfileService } from './pl-provider-profile.service';

import {
    anything,
    mock,
    capture,
    instance,
    when,
} from 'ts-mockito';

describe('PLProviderProfile', () => {
    let plGraphQLMock: PLGraphQLService;
    let service: PLProviderProfileService;

    const providerProfilesGraphQLResponse = {
        providerProfiles: [
            {
                id: '20',
                user: {
                    id: '42',
                    firstName: 'Dale',
                    lastName: 'Cooper',
                    username: 'dcooper',
                    permissions: {
                        viewSchedule: false,
                    },
                    email: 'dcooper@fbi.gov',
                    phone: '',
                },
            },
        ],
    };

    beforeEach(() => {
        plGraphQLMock = mock(PLGraphQLService);
        when(plGraphQLMock.query(anything(), anything()))
        .thenReturn(from([providerProfilesGraphQLResponse]));

        service = new PLProviderProfileService(instance(plGraphQLMock));
    });

    describe('getProviderProfiles', () => {
        it('should include active filters in graphQL query', () => {
            service.getProviderProfiles({ locationId: '5' });

            const params = capture(plGraphQLMock.query).last()[1];

            expect(Object.keys(params).includes('isActive')).toBeTruthy();
            expect(Object.keys(params).includes('userIsActive')).toBeTruthy();
        });
    });
});
