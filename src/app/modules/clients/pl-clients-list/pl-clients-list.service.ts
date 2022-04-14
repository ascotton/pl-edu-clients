import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';

import {
    PLMayService, PLGraphQLService}
    from '@root/index';
import { User } from '@modules/user/user.model';
import { selectCurrentUser } from '@root/src/app/common/store';
import { PLClientsTableService } from '@common/services/index';
import { CurrentUserService } from '@modules/user/current-user.service';

@Injectable()
export class PLClientsListService {
    currentUser: User;
    userProvider: any = {};

    clients: any[] = [];

    currentPage: number;
    pageSize: number;
    total: number;

    loading: boolean = true;

    readonly CLIENT_TABLE_STATE_NAME = 'ct';

    // if onQuery is called before the user is loaded we queue it until the user has been loaded
    private queryQueuedForUser: any = null;
    userCanAddReferrals: boolean = false;
    userCanAddSingleReferral: boolean = false;

    constructor(
        private router: Router,
        private plMay: PLMayService,
        private store: Store<AppStore>, 
        private plGraphQL: PLGraphQLService,
        private plCurrentUser: CurrentUserService,
        private plClientsTableService: PLClientsTableService,
    ) {
        store.select(selectCurrentUser)
            .subscribe((user: any) => {
                this.currentUser = user;
                this.userCanAddReferrals = this.plMay.addReferrals(this.currentUser);
                this.userCanAddSingleReferral = this.plMay.addSingleReferral(this.currentUser);
                this.userProvider = this.plCurrentUser.getProvider(user);
                if (this.queryQueuedForUser) {
                    this.onQuery.apply(this, this.queryQueuedForUser);
                    this.queryQueuedForUser = null;
                }
            });
        store.select('clientsList')
            .subscribe((state: any) => {
                if (state === 'REMOTE_UPDATE_CLIENTS_LIST') {
                    this.plGraphQL.reset();
                }
            });
    }

    onQuery(info: { query: any }, mode: string) {
        this.clients = [];

        if (this.currentUser && this.currentUser.uuid) {
            let providerId: string = null;
            if (mode === 'caseload' && this.userProvider) {
                providerId = this.userProvider.user;
            }
            this.loading = true;

            this.plClientsTableService.onQuery(info, providerId, this.CLIENT_TABLE_STATE_NAME).subscribe(
                (results: any) => {
                    this.clients = results.clients;
                    this.total = results.total;
                    this.loading = false;
                },
            );
        } else {
            this.queryQueuedForUser = arguments;
        }
    }

    clickRow(client: any) {
        this.router.navigate(['/client', client.id]);
    }
}
