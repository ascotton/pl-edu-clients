import { Component } from '@angular/core';
import { Router } from '@angular/router';

import {Store} from '@ngrx/store';
import { Observable } from 'rxjs';

import {PLHttpService, PLUrlsService, PLMayService} from '@root/index';
import {AppStore} from '@app/appstore.model';
import {User} from '@modules/user/user.model';
import {PLClientService} from '../pl-client.service';

@Component({
    selector: 'pl-client-services',
    templateUrl: './pl-client-services.component.html',
    styleUrls: ['./pl-client-services.component.less'],
    inputs: ['client'],
})
export class PLClientServicesComponent {
    client: any = {};
    currentUser: User;

    mayAddService: boolean = false;
    mayViewPhi: boolean = false;
    private subscriptions: any = {};

    constructor(private plHttp: PLHttpService, private store: Store<AppStore>,
     private router: Router, private plUrls: PLUrlsService,
     private plClient: PLClientService,
     private plMay: PLMayService) {
        this.subscriptions.user = store.select('currentUser')
            .subscribe((user) => {
                this.currentUser = user;
                this.checkPrivileges();
            });
        this.subscriptions.client = store.select('currentClientUser')
            .subscribe((clientUser: any) => {
                if (clientUser && clientUser.client) {
                    this.client = clientUser.client;
                    this.mayViewPhi = clientUser.mayViewPhi;
                }
            });
    }

    ngOnChanges(changes: any) {
        if (changes.client) {
            this.checkPrivileges();
        }
    }

    ngOnDestroy() {
        this.subscriptions.user.unsubscribe();
        this.subscriptions.client.unsubscribe();
    }

    checkPrivileges() {
        if (this.currentUser && this.client) {
            this.mayAddService = this.plMay.addSingleReferral(this.currentUser);
        }
    }
};
