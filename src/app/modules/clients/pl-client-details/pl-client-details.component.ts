import { Component, Input, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import {Store} from '@ngrx/store';
import { Observable } from 'rxjs';

import {PLHttpService, PLUrlsService} from '@root/index';
import {AppStore} from '@app/appstore.model';
import {User} from '@modules/user/user.model';
import {PLClientService} from '../pl-client.service';

@Component({
    selector: 'pl-client-details',
    templateUrl: './pl-client-details.component.html',
    styleUrls: ['./pl-client-details.component.less'],
})

export class PLClientDetailsComponent {
    @Input() client: any = {};
    user: User;
    hideContacts = false;
    hideProfile = false;
    private subscriptions: any = {};

    constructor(private store: Store<AppStore>, private plClient: PLClientService) {
        this.subscriptions.user = store.select('currentUser')
            .subscribe((user) => {
                this.user = user;
            });
        this.subscriptions.client = store.select('currentClientUser')
            .subscribe((clientUser: any) => {
                this.client = clientUser.client;
            });
    }

    ngOnDestroy() {
        this.subscriptions.user.unsubscribe();
        this.subscriptions.client.unsubscribe();
    }

    onReQueryClientWrapper() {
        this.plClient.getClient(true);
    }

    editingContacts(evt: any) {
        this.hideProfile = evt;
    }

    editingProfile(evt: any) {
        this.hideContacts = evt;
    }
}
