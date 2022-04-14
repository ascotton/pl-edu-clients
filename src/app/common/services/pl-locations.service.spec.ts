import { from } from 'rxjs';

import {
    mock,
    instance,
    when,
    anything,
} from 'ts-mockito';

import {
    PLGraphQLService,
    PLLodashService,
} from '@root/index';

import { PLLocationsService } from './pl-locations.service';

describe('PLLocationsService', () => {
    describe('getOrganizationOptionsByLabel', () => {
        let service: PLLocationsService;
        let graphQLService: PLGraphQLService;
        let locationsQueryResults: any;

        beforeEach(() => {
            graphQLService = mock(PLGraphQLService);

            locationsQueryResults = {
                locations_totalCount: 3,
                locations_pageInfo: {
                    endCursor: '',
                    hasNextPage: false,
                },
                locations: [
                    { name: 'TP High', id: '1', state: '', parent: { id: 'org1', name: 'Twin Peaks Unified' } },
                    { name: 'B Elementary', id: '2', state: '', parent: { id: 'org2', name: 'Butte District 34' } },
                    { name: 'H Central', id: '3', state: '', parent: { id: 'org3', name: 'Helena District 33' } },
                ],
            };

            when(graphQLService.query(anything(), anything(), anything(), anything()))
            .thenReturn(from([locationsQueryResults]));

            service = new PLLocationsService(instance(mock(PLLodashService)), instance(graphQLService));

            service.beginFetch();
        });

        it('should include all organizations when search term is empty', () => {
            expect(service.getOrganizationOptionsByLabel('').length).toEqual(3);
        });

        it('should include orgs with simple string matching', () => {
            expect(service.getOrganizationOptionsByLabel('District').map(orgs => orgs.label))
              .toEqual(['Butte District 34', 'Helena District 33']);
        });

        it('should include org labels that match sequentially with multi-word search terms', () => {
            expect(service.getOrganizationOptionsByLabel('District 34').map(orgs => orgs.label))
              .toEqual(['Butte District 34']);
        });

        it('should be case-insensitive', () => {
            expect(service.getOrganizationOptionsByLabel('district').map(orgs => orgs.label))
              .toEqual(['Butte District 34', 'Helena District 33']);
        });
    });
});
