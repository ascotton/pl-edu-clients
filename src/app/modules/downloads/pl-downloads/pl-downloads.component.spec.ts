import { Observable, Subject, EMPTY } from 'rxjs';

import {
    Component,
    DebugElement,
} from '@angular/core';

import { By } from '@angular/platform-browser';

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';

import { PLDownloadsService } from '@common/services';

import {
    PLDownloadItem,
    PLDownloadsModule,
    PLDownloadsComponent,
} from '../';

describe('PLDownloadsComponent', () => {
    let component: PLDownloadsComponent;
    let anchoredDialog: DebugElement;
    let fixture: ComponentFixture<PLDownloadsComponent>;
    let downloadsService: PLDownloadsService;

    const downloadsSubject = new Subject();

    const plDownloadServicesStub: any = {
        downloadItems: () => downloadsSubject,
        autoDownloadItems: () => EMPTY,
        removeDownload: (id: string) => {},
    };

    const downloadItem: PLDownloadItem = {
        id: '1',
        filename: '',
        progress: 0,
        error: '',
        errorDescription: '',
        status: 'in-progress',
        title: '',
        url: '',
    };

    const erroredDownloadItem = Object.assign({}, downloadItem, { id: '2-error', status: 'error' });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [PLDownloadsModule],
        })
        .overrideComponent(PLDownloadsComponent, {
            set: {
                providers: [
                    { provide: PLDownloadsService, useValue: plDownloadServicesStub },
                ],
            },
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PLDownloadsComponent);

        component = fixture.debugElement.componentInstance;

        fixture.detectChanges();

        anchoredDialog = fixture.debugElement.query(By.css('pl-anchored-dialog'));

        downloadsService = fixture.debugElement.injector.get(PLDownloadsService);

        spyOn(downloadsService, 'removeDownload').and.stub();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('visibility', () => {
        it('should be hidden by default', () => {
            expect(anchoredDialog.nativeElement.hidden).toBeTruthy();
        });

        it('should become visible when there are new downloads', () => {
            downloadsSubject.next([downloadItem]);

            fixture.detectChanges();

            expect(anchoredDialog.nativeElement.hidden).toBeFalsy();
        });

        it('should close when there are no more downloads', () => {
            downloadsSubject.next([downloadItem]);

            downloadsSubject.next([]);

            fixture.detectChanges();

            expect(anchoredDialog.nativeElement.hidden).toBeTruthy();
        });
    });

    describe('download item with error', () => {
        it('should render as an download item with an error', () => {
            downloadsSubject.next([erroredDownloadItem]);

            fixture.detectChanges();

            const item = fixture.debugElement.query(By.css('.download-item.error'));

            expect(item).toBeTruthy();
        });
    });

    describe('completed download item', () => {
        it('should render as a completed download item', () => {
            const completedDownloadItem = Object.assign({}, downloadItem, { status: 'complete' });

            downloadsSubject.next([completedDownloadItem]);

            fixture.detectChanges();

            const item = fixture.debugElement.query(By.css('.download-item.complete'));

            expect(item).toBeTruthy();
        });
    });

    describe('close attempt', () => {
        const downloadItems = [downloadItem, Object.assign({}, downloadItem, { id: '2' })];

        beforeEach(() => {
            downloadsSubject.next(downloadItems);

            fixture.detectChanges();
        });

        it('should not remove all downloads', () => {
            anchoredDialog.triggerEventHandler('closeAttempt', null);

            expect(downloadsService.removeDownload).toHaveBeenCalledWith(downloadItems[0].id);
            expect(downloadsService.removeDownload).toHaveBeenCalledWith(downloadItems[1].id);
        });
    });

    describe('cancelling an individual download', () => {
        it('should call removeDownload for the cancelled item', () => {
            downloadsSubject.next([downloadItem]);

            fixture.detectChanges();

            const button = fixture.debugElement.query(By.css('.cancel-button'));

            button.triggerEventHandler('click', null);

            expect(downloadsService.removeDownload).toHaveBeenCalledWith(downloadItem.id);
        });
    });
});
