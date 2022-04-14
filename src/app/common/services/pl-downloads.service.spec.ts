import { Subject } from 'rxjs';

import {
    mock,
    instance,
    when,
} from 'ts-mockito';

import { PLDownloadItem } from '@common/interfaces';
import { PLDownloadsService } from './pl-downloads.service';

describe('PLDownloadsService', () => {
    let service: PLDownloadsService;

    const itemStub: PLDownloadItem = {
        id: '1',
        error: '',
        errorDescription: '',
        filename: '',
        progress: 0,
        status: 'in-progress',
        title: '',
        url: '',
    };

    beforeEach(() => {
        service = new PLDownloadsService();
    });

    describe('downloadItems', () => {
        describe('single source', () => {
            it('emits immediately with an empty collection', () => {
                const source = new Subject<PLDownloadItem[]>();

                service.addSource(source);

                const subscriber = jasmine.createSpy('subscriber');

                service.downloadItems().subscribe(subscriber);

                expect(subscriber).toHaveBeenCalledWith([]);
            });

            it('emits what the source emits', () => {
                const source = new Subject<PLDownloadItem[]>();

                service.addSource(source);

                let emitted: PLDownloadItem[] = null;

                service.downloadItems().subscribe((i: PLDownloadItem[]) => emitted = i);

                const items = [itemStub, { ...itemStub, id: '2' }];

                source.next(items);

                expect(emitted).toEqual(items);
            });
        });

        describe('multiple sources', () => {
            const source1 = new Subject<PLDownloadItem[]>();
            const source2 = new Subject<PLDownloadItem[]>();

            let emitted: PLDownloadItem[] = null;

            beforeEach(() => {
                service.addSource(source1);
                service.addSource(source2);

                service.downloadItems().subscribe((items: PLDownloadItem[]) => emitted = items);
            });

            it('emits what the first source emits', () => {
                const items = [itemStub];

                source1.next(items);

                expect(emitted).toEqual(items);
            });

            it('emits combined, what each source emits', () => {
                const items1 = [itemStub];
                const items2 = [{ ...itemStub, id: '2' }];

                source1.next(items1);
                source2.next(items2);

                expect(emitted).toEqual([...items1, ...items2]);
            });
        });

        describe('removed item', () => {
            const source = new Subject<PLDownloadItem[]>();

            let emitted: PLDownloadItem[] = null;

            beforeEach(() => {
                service.addSource(source);

                service.downloadItems().subscribe((items: PLDownloadItem[]) => emitted = items);
            });

            it('is not included when that source emits', () => {
                const item1 = itemStub;
                const item2 = { ...itemStub, id: '2' };

                source.next([item1, item2]);
                // let's say item1 was removed, so source would emit,
                source.next([item2]);

                expect(emitted).toEqual([item2]);
            });
        });

        describe('completed sources', () => {
            it('trigger a new emitted list', () => {
                const source = new Subject<PLDownloadItem[]>();
                service.addSource(source);

                const subscriber = jasmine.createSpy('subscriber');

                service.downloadItems().subscribe(subscriber); // called once on subscribe

                source.next([itemStub]);  // called a second time on source emit
                source.complete();  // called once more

                expect(subscriber).toHaveBeenCalledTimes(3);
            });

            it('are no longer included in the emitted results', () => {
                const source1 = new Subject<PLDownloadItem[]>();
                const source2 = new Subject<PLDownloadItem[]>();

                service.addSource(source1);
                service.addSource(source2);

                const items1 = [itemStub];
                const items2 = [{ ...itemStub, id: '2' }];

                let emitted = <PLDownloadItem[]> null;

                service.downloadItems().subscribe((i: PLDownloadItem[]) => emitted = i);

                source1.next(items1);
                source2.next(items2);
                // source1 completes, and its items will not be included in the emitted list
                source1.complete();

                expect(emitted).toEqual(items2);
            });
        });

        describe('late subscriptions', () => {
            const source = new Subject<PLDownloadItem[]>();

            beforeEach(() => {
                service.addSource(source);
            });

            it('emits the most recent value on subscribe', () => {
                const items = [itemStub];

                source.next(items);

                // Subscribe after the first values emitted.
                const subscriber = jasmine.createSpy('subscriber');
                service.downloadItems().subscribe(subscriber);

                expect(subscriber).toHaveBeenCalledWith(items);
            });
        });
    });

    describe('autoDownloadItems', () => {
        const inProgressDownloadItem: PLDownloadItem = { ...itemStub, status: 'in-progress' };
        const completeDownloadItem: PLDownloadItem = { ...itemStub, status: 'complete' };

        let autoDownloadCallback: any;
        let autoDownloadItem: any;
        const downloadItemSource = new Subject<PLDownloadItem[]>();

        beforeEach(() => {
            autoDownloadCallback = jasmine.createSpy('autoDownloadCallback');

            autoDownloadItem = null;

            service.addSource(downloadItemSource);
        });

        it('does not emit incomplete items', () => {
            service.autoDownloadItems().subscribe(item => autoDownloadItem = item);

            downloadItemSource.next([inProgressDownloadItem]);

            expect(autoDownloadItem).toBe(null);
        });

        it('emits completed items', () => {
            service.autoDownloadItems().subscribe(item => autoDownloadItem = item);

            downloadItemSource.next([completeDownloadItem]);

            expect(autoDownloadItem).toBe(completeDownloadItem);
        });

        it('emits completed items only once by id', () => {
            service.autoDownloadItems().subscribe(autoDownloadCallback);

            downloadItemSource.next([completeDownloadItem]);
            downloadItemSource.next([completeDownloadItem]);

            expect(autoDownloadCallback).toHaveBeenCalledTimes(1);
        });
    });
});
