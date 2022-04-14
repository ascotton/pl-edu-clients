import * as moment from 'moment';
import { EMPTY, Subject } from 'rxjs';
import {
    PLGraphQLService,
    PLLodashService,
    HeapLogger,
} from '@root/index';
import { PLExpirationService } from '../';
import { PLDownloadsService } from '../pl-downloads.service';

import {
    anything,
    anyOfClass,
    anyFunction,
    capture,
    instance,
    mock,
    when,
    verify,
} from 'ts-mockito';

import { PLNotesReportService } from './pl-notes-report.service';

describe('PLNotesReportService', () => {
    let service: PLNotesReportService;
    let store: any;
    let expirationService: PLExpirationService;
    let plDownloadsServiceMock: PLDownloadsService;

    const storeDownloadsSubject = new Subject<any>();

    beforeEach(() => {
        store = jasmine.createSpyObj('storeSpy', ['dispatch', 'subscribe', 'select']);
        store.select = () => storeDownloadsSubject;

        expirationService = mock(PLExpirationService);
        when(expirationService.setTimeout(anyFunction(), anyOfClass(Date))).thenReturn(0);

        plDownloadsServiceMock = mock(PLDownloadsService);
        when(plDownloadsServiceMock.removedItems()).thenReturn(EMPTY);

        service = new PLNotesReportService(
            instance(mock(PLGraphQLService)),
            store,
            new PLLodashService(),
            instance(mock(HeapLogger)),
            instance(expirationService),
            instance(plDownloadsServiceMock),
        );
    });

    describe('download url expiration', () => {
        const tomorrow = moment().add(24, 'hours').format('YYYY-MM-DD[T]HH:mm:ss');
        const expiringDownloads: any = { downloads: [{ id: '1', downloadUrlExpiresOn: tomorrow }] };
        const nonExpiringDownloads: any = { downloads: [{ id: '2', downloadUrlExpiresOn: null }] };

        it('should exist', () => {
            expect(service).toBeTruthy();
        });

        it('should call expiration service with download url expiration date', () => {
            storeDownloadsSubject.next(expiringDownloads);

            verify(expirationService.setTimeout(anyFunction(), anyOfClass(Date))).called();
        });

        it('should set a timeout for an expiration function that expires the download', () => {
            storeDownloadsSubject.next(expiringDownloads);

            const expirationFn: any = capture(expirationService.setTimeout).first()[0];

            expirationFn();

            const dispatch: any = store.dispatch.calls.argsFor(0)[0];

            expect(dispatch.type).toEqual('UPDATE_NOTES_REPORT_DOWNLOAD');
            expect(dispatch.payload).toEqual(jasmine.objectContaining({ download: { id: '1', xExpired: true } }));
        });

        it('should not set an expiration timeout for downloads lacking a download url expiration', () => {
            storeDownloadsSubject.next(nonExpiringDownloads);

            verify(expirationService.setTimeout(anything(), anything())).never();
        });
    });

    describe('monthToStartDateInclusive', () => {
        it('will be the first day of the month', () => {
            const startDate = service.monthToStartDateInclusive({ year: 2016, month: 6 }); // July

            expect(startDate).toEqual('2016-07-01');
        });
    });

    describe('monthToEndDateExclusive', () => {
        it('will be the first day of the next month', () => {
            const startDate = service.monthToEndDateExclusive({ year: 2016, month: 6 }); // July

            expect(startDate).toEqual('2016-08-01'); // August
        });

        it('will wrap to next year in December', () => {
            const startDate = service.monthToEndDateExclusive({ year: 2016, month: 11 }); // December

            expect(startDate).toEqual('2017-01-01'); // Jan
        });
    });
});
