import {
    anything,
    capture,
    instance,
    mock,
    verify,
    when,
} from 'ts-mockito';
import { Observable, EMPTY } from 'rxjs';
import { PLHttpService, PLUrlsService } from '@root/index';

import { PLAccountsService } from './pl-accounts.service';
import { PLApiAccount } from './pl-api-account';

describe('PLAccountsService', () => {
    let plHttpServiceMock: PLHttpService;
    let plUrlsServiceMock: PLUrlsService;
    let service: PLAccountsService;

    beforeEach(() => {
        plHttpServiceMock = mock(PLHttpService);
        plUrlsServiceMock = mock(PLUrlsService);
        service = new PLAccountsService(instance(plHttpServiceMock), instance(plUrlsServiceMock));
    });

    describe('getLocationsByID', () => {
        it('calls http with concatenated location IDs', () => {
            when(plHttpServiceMock.get(anything(), anything())).thenReturn(EMPTY);

            service.getLocationsByID(['a', 'b']);

            const params: any = capture(plHttpServiceMock.get).last()[1];

            expect(params.location_id_in).toEqual('a,b');
        });

        it('skips the HTTP request if the ID list is empty', () => {
            service.getLocationsByID([]);

            verify(plHttpServiceMock.get(anything(), anything())).never();
        });

        it('emits an empty result if ID list is empty', (done) => {
            let results: PLApiAccount[];

            service.getLocationsByID([]).subscribe({
                next: (r: any) => results = r.results,
                complete: () => {
                    expect(results).toEqual([]);
                    done();
                },
            });
        });

        it('limits results to the number of IDs to prevent the need for pagination in rare cases', () => {
            when(plHttpServiceMock.get(anything(), anything()));

            service.getLocationsByID(['a', 'b']);

            const params = capture(plHttpServiceMock.get).last()[1];

            expect(params.limit).toBe(2);
        });
    });

    describe('getOrgsByID', () => {
        it('calls http with concatenated org IDs', () => {
            when(plHttpServiceMock.get(anything(), anything())).thenReturn(EMPTY);

            service.getOrgsByID(['a', 'b']);

            const params: any = capture(plHttpServiceMock.get).last()[1];

            expect(params.organization_id_in).toEqual('a,b');
        });

        it('skips the HTTP request if the ID list is empty', () => {
            service.getOrgsByID([]);

            verify(plHttpServiceMock.get(anything(), anything())).never();
        });

        it('emits an empty result of ID list is empty', (done) => {
            let results: PLApiAccount[];

            service.getOrgsByID([]).subscribe({
                next: (r: any) => results = r.results,
                complete: () => {
                    expect(results).toEqual([]);
                    done();
                },
            });
        });

        it('limits results to the number of IDs to prevent the need for pagination in rare cases', () => {
            when(plHttpServiceMock.get(anything(), anything()));

            service.getOrgsByID(['a', 'b']);

            const params = capture(plHttpServiceMock.get).last()[1];

            expect(params.limit).toBe(2);
        });
    });
});
