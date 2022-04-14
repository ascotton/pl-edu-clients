import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { combineLatest } from 'rxjs';
import { filter, first } from 'rxjs/operators';

import { PLMayService } from '@root/index';

@Component({
    selector: 'pl-client-documents',
    templateUrl: './pl-client-documents.component.html',
    styleUrls: ['./pl-client-documents.component.less'],
})
export class PLClientDocumentsComponent implements OnInit, OnDestroy {
    client: any = {};
    mayUpload = false;
    mayDelete = false;

    private subscriptions: any = null;

    constructor(private store: Store<AppStore>, private plMay: PLMayService) {}

    ngOnInit() {
        const currentUser$ = this.store.select('currentUser').pipe(first((u: any) => !!u));
        const client$ = this.store.select('currentClientUser').pipe(filter((result: any) => result && result.client));

        this.subscriptions = combineLatest(currentUser$, client$).subscribe(([currentUser, currentClientUser]) => {
            this.client = currentClientUser.client;

            this.mayUpload = this.plMay.uploadClientDocuments(currentUser, this.client);
            this.mayDelete = this.plMay.deleteClientDocuments(currentUser);
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }
}
