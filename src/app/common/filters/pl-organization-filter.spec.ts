import { fakeAsync, tick } from '@angular/core/testing';

import { of } from 'rxjs';

import {
    anything,
    anyString,
    capture,
    mock,
    instance,
    verify,
    when,
} from 'ts-mockito';

import {
    PLAssignedLocationsService,
    PLLocationsOrgsMapping,
} from '../services';

import { PLOrganizationFilter } from './pl-organization-filter';

describe('PLOrganizationFilter', () => {
    let filter: PLOrganizationFilter;
    let locationsServiceMock: PLAssignedLocationsService;
    let locationsMapping: PLLocationsOrgsMapping;

    beforeEach(() => {
        locationsServiceMock = mock(PLAssignedLocationsService);
        locationsMapping = mock(PLLocationsOrgsMapping);

        when(locationsServiceMock.getAllLocationsOnceAsMapping(anything())).thenReturn(of(instance(locationsMapping)));

        const filterOptions = { value: 'orgId', label: 'my organizations' };
        filter = new PLOrganizationFilter(filterOptions, instance(locationsServiceMock));
    });

    describe('clearSelection', () => {
        it('should clear textArray', () => {
            filter.textArray = ['1', '2', '3'];

            filter.clearSelection();

            expect(filter.textArray).toEqual([]);
        });

        it('should emit an empty set', (done) => {
            const observer = jasmine.createSpy('observer');

            filter.selectedIDs().subscribe(observer);

            filter.clearSelection();

            setTimeout(
                () => {
                    expect(observer).toHaveBeenCalledWith([]);
                    done();
                },
                0,
            );
        });
    });

    describe('updating options with search term', () => {
        beforeEach(() => {
            when(locationsMapping.getOrganizationOptionsByLabel(anyString())).thenReturn([]);
        });

        it('should query the locations service using the search term set with setOptionsSearchTerm', (done) => {
            filter.setOptionsSearchTerm('Twin Peaks');

            filter.updateOptions();

            setTimeout(
                () => {
                    verify(locationsMapping.getOrganizationOptionsByLabel('Twin Peaks')).called();
                    done();
                },
                0,
            );
        });

        it('should query the locations service with the search term stripped of whitespace', (done) => {
            filter.setOptionsSearchTerm(' Twin Peaks ');

            filter.updateOptions();

            setTimeout(
                () => {
                    verify(locationsMapping.getOrganizationOptionsByLabel('Twin Peaks')).called();
                    done();
                },
                0,
            );
        });

        it('should set selectOptsMultiApi to organizations searched by label', (done) => {
            const orgOptions = [{ label: 'Twin Peaks District', value: '0' }];

            when(locationsMapping.getOrganizationOptionsByLabel(anyString())).thenReturn(orgOptions);

            filter.updateOptions();

            setTimeout(
                () => {
                    expect(filter.selectOptsMultiApi).toEqual(orgOptions);
                    done();
                },
                0,
            );
        });

        it('should query the locations service with accountCam when set', () => {
            filter.setAccountsManagedByUser('a-user-id');
            filter.updateOptions();

            const params = capture(locationsServiceMock.getAllLocationsOnceAsMapping).last()[0];

            expect('accountCam' in params).toBeTruthy();
        });

        it('should not query the locations service with accountCam when not set', () => {
            filter.updateOptions();

            const params = capture(locationsServiceMock.getAllLocationsOnceAsMapping).last()[0];

            expect('accountCam' in params).toBeFalsy();
        });
    });

    describe('updateModelOptions', () => {
        const orgOptionsByID = [
            { label: 'some org', value: '0' },
            { label: 'some other org', value: '1' },
        ];

        const orgIDs = ['org-0', 'org-1'];

        beforeEach(() => {
            when(locationsMapping.getOrganizationOptionsByIDs(orgIDs)).thenReturn(orgOptionsByID);
        });

        it('should set modelOptions to organizations with IDs matching modelValues param', (done) => {
            filter.updateModelOptions(orgIDs);

            setTimeout(
                () => {
                    expect(filter.modelOptions).toEqual(orgOptionsByID);
                    done();
                },
                0,
            );
        });

        it('should emit modelValues params as selected IDs', (done) => {
            const orgIDObserver = jasmine.createSpy('orgIDObserver');

            filter.selectedIDs().subscribe(orgIDObserver);

            filter.updateModelOptions(orgIDs);

            setTimeout(
                () => {
                    expect(orgIDObserver).toHaveBeenCalledWith(orgIDs);
                    done();
                },
                0,
            );
        });

        it('should _not_ query the locations service with accountCam', () => {
            filter.updateModelOptions([]);

            const params = capture(locationsServiceMock.getAllLocationsOnceAsMapping).last()[0];

            expect('accountCam' in params).toBeFalsy();
        });
    });

});
