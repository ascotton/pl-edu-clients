import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { concatMap, distinct, map, startWith } from 'rxjs/operators';

import { PLDownloadItem } from '@common/interfaces';

/**
 * PLDownloadsService - this service is a clearinghosue for any other service
 * that generates files to download. Consider these services _download sources_.
 *
 * This is a long-lived global service.
 *
 * Download sources generate download files and emit updates about their progress.
 *
 * This service can pool multiple sources of download items, and emit them as a
 * single collection for the download dialog box (or any other component).
 *
 * If a user cancels or clears a completed download via the download dialog
 * component, it calls this service to remove the download. This service then
 * broadcasts the ID of the removed it through `removedItems()`.
 *
 * Download sources should
 * 1) call addSource() with an observable of download items.
 * 2) subscribe to removedItems() and cancel or stop polling for removed downloads.
 *
 */
 @Injectable({ providedIn: 'root' })
export class PLDownloadsService {
    // Emit the entire collection of download items through this subject.
    // Use a replay subject so no matter when a consumer subscribes, it will
    // receive the latest collection of download items.
    private downloadItemsSubject = new ReplaySubject<PLDownloadItem[]>(1);

    // As download sources register observables; map the source to the download items they emit
    private itemsBySource = new Map<Observable<PLDownloadItem[]>, PLDownloadItem[]>();

    private removedItemsSubject = new Subject<string>();


    /**
     * addSource - services that generate and manage download items register
     * as a source through this function.
     */
    addSource(source: Observable<PLDownloadItem[]>): void {
        this.itemsBySource.set(source, []);

        // Subscribe to each download source. Whenever any of them emits, then
        // concat and emit the latest download items from all sources.
        source.pipe(
            // Default this source's collection to empty before it emits anything.
            startWith([]),
        ).subscribe({
            next: (items: PLDownloadItem[]) => {
                this.itemsBySource.set(source, items);

                this.emitAllItems();
            },
            complete: () => {
                // download source has completed; we are no longer listening
                // to it, or including its downloads in the collection.
                this.itemsBySource.delete(source);

                this.emitAllItems();
            },
        });
    }

    downloadItems(): Observable<PLDownloadItem[]> {
        return this.downloadItemsSubject;
    }


    /**
     * For each download source, gather up the most recent set of download items,
     * concatenate them into a single list, and emit the entire list.
     */
    private emitAllItems(): void {
        const itemCollections = [...this.itemsBySource.values()];
        // Flatten array of arrays into one
        const items = itemCollections.reduce((flattened, current) => [...flattened, ...current], []);

        this.downloadItemsSubject.next(items);
    }

    /*
        Observable of download items as they become status => complete, and can
        be auto-downloaded. Each download item is emitted once (by id).
    */
    autoDownloadItems(): Observable<PLDownloadItem> {
        return this.downloadItems().pipe(
             map(item => item.filter(i => i.status === 'complete')), // completed items
             concatMap(item => item),                                // break array into individual items
             distinct(item => item.id),                              // emit once per ID
        )
    }

    removedItems(): Observable<string> {
        return this.removedItemsSubject;
    }

    removeDownload(itemId: string): void {
        this.removedItemsSubject.next(itemId);
    }
}
