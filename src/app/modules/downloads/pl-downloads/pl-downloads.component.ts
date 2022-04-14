import {
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChildren,
} from '@angular/core';

import { PLDownloadsService } from '@common/services';
import { PLDownloadItem } from '../';

@Component({
    selector: 'pl-downloads',
    templateUrl: './pl-downloads.component.html',
    styleUrls: ['./pl-downloads.component.less'],
})
export class PLDownloadsComponent implements OnInit, OnDestroy {
    @ViewChildren('downloadLink', { read: ElementRef }) downloadLinks: QueryList<ElementRef>;

    downloadItems: PLDownloadItem[] = [];
    isVisible = false;

    private autoDownloadsSubscription: any;
    private downloadSubscription: any;

    constructor(private service: PLDownloadsService) {}

    ngOnInit() {
        this.downloadSubscription = this.service.downloadItems().subscribe((downloads) => {
            this.downloadItems = downloads;

            this.isVisible = downloads.length > 0;
        });

        // When an item becomes ready for downloading, click on its link. Add to the
        // task queue to allow Angular to render it first.
        this.autoDownloadsSubscription = this.service.autoDownloadItems().subscribe((item) => {
            setTimeout(() => {
                this.downloadLinks
                .filter((link: ElementRef) => item.id === link.nativeElement.dataset.downloadId)
                .forEach((link: ElementRef) => link.nativeElement.click());
            }, 0);
        });
    }

    ngOnDestroy() {
        this.autoDownloadsSubscription.unsubscribe();
        this.downloadSubscription.unsubscribe();
    }

    onCloseAttempt(): void {
        this.downloadItems.forEach(item => this.service.removeDownload(item.id));
    }

    onCancelItem(itemId: string) {
        this.service.removeDownload(itemId);
    }
}
