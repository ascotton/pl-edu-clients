import { fakeAsync, tick } from '@angular/core/testing';

import { of } from 'rxjs';

import {
    anything,
    capture,
    mock,
    instance,
    when,
} from 'ts-mockito';

import { PLLocationFilter } from './pl-location-filter';
import {
    PLAssignedLocationsService,
    PLAssignedLocationsResults,
} from '../services/locations/pl-assigned-locations.service';
import { plLocationMock } from '../services/locations/pl-location.mock';

describe('PLLocationFilter', () => {
    let filter: PLLocationFilter;
    let locationsService: PLAssignedLocationsService;

    const listLocationsQueryResults:  PLAssignedLocationsResults = {
        filteredTotalCount: 2,
        locations: [
            plLocationMock({ id: '42', name: 'Super School' }),
            plLocationMock({ id: '56', name: 'New School' }),
        ],
    };

    const expectedModelOptions = [
        { value: '56', label: 'New School' },
        { value: '42', label: 'Super School' },
    ];

    beforeEach(() => {
        locationsService = mock(PLAssignedLocationsService);

        when(locationsService.getLocations(anything())).thenReturn(of(listLocationsQueryResults));

        const filterOptions = { value: 'locationID', label: 'Locations' };
        filter = new PLLocationFilter(filterOptions, instance(locationsService));
    });

    describe('clearSelection', () => {
        it('should clear textArray', () => {
            filter.textArray = ['1', '2', '3'];

            filter.clearSelection();

            expect(filter.textArray).toEqual([]);
        });
    });

    describe('searching by locations name', () => {
        it('should query locations for those named with search term', (done) => {
            filter.setOptionsSearchTerm('School of Hard Knocks');

            filter.updateOptions();

            setTimeout(
                () => {
                    const queryParams = capture(locationsService.getLocations).last()[0];
                    expect(queryParams).toEqual(jasmine.objectContaining({ name_Icontains: 'School of Hard Knocks' }));

                    done();
                },
                0,
            );
        });
    });

    describe('limiting by parent organizations', () => {
        it('should query locations by org parent IDs in orgIDs', (done) => {
            filter.limitByParentOrganizations(['1', '2', '3']);

            filter.updateOptions();

            setTimeout(
                () => {
                    const queryParams = capture(locationsService.getLocations).last()[0];
                    expect(queryParams).toEqual(jasmine.objectContaining({ organizationId_In: '1,2,3' }));

                    done();
                },
                0,
            );
        });
    });

    describe('updateOptions', () => {
        it('sets selectOptsMultiApi to the results locations', (done) => {
            filter.updateOptions();

            setTimeout(
                () => {
                    expect(filter.selectOptsMultiApi).toEqual(expectedModelOptions);

                    done();
                },
                0,
            );
        });

        it('sets the selectOptsMultiApiTotalCount to the results total count', (done) => {
            filter.updateOptions();

            setTimeout(
                () => {
                    expect(filter.selectOptsMultiApiTotalCount).toEqual(listLocationsQueryResults.filteredTotalCount);

                    done();
                },
                0,
            );
        });

        it('should query the locations service with accountCam when accountsManagedByUser has been set', () => {
            filter.setAccountsManagedByUser('user-abc');
            filter.updateOptions();

            const params = capture(locationsService.getLocations).last()[0];

            expect('accountCam' in params).toBeTruthy();
        });

        it('should not query the locations service with accountCam when it has not been set', () => {
            filter.updateOptions();

            const params = capture(locationsService.getLocations).last()[0];

            expect('accountCam' in params).toBeFalsy();
        });
    });

    describe('updateModelOptions', () => {
        it('queries for the locations with IDs from param', (done) => {
            filter.updateModelOptions(['100', '56']);

            setTimeout(
                () => {
                    const queryParams = capture(locationsService.getLocations).last()[0];
                    expect(queryParams).toEqual(jasmine.objectContaining({ id_In: '100,56' }));

                    done();
                },
                0,
            );
        });

        it('sets modelOptions to the results locations', (done) => {
            filter.updateModelOptions(['42', '56']);

            setTimeout(
                () => {
                    expect(filter.modelOptions).toEqual(expectedModelOptions);

                    done();
                },
                0,
            );
        });

        it('should _not_ query the locations service with accountCam', () => {
            filter.updateModelOptions(['42', '56']);

            const params = capture(locationsService.getLocations).last()[0];

            expect('accountCam' in params).toBeFalsy();
        });
    });
});
