import { Component, OnInit, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

import { PLHttpService, PLUrlsService } from '@root/index';
import { PLProviderService } from '../pl-provider.service';
import { PLClientsTableService } from '@common/services/index';

@Component({
    selector: 'pl-provider-caseload',
    templateUrl: './pl-provider-caseload.component.html',
    styleUrls: ['./pl-provider-caseload.component.less'],
    inputs: ['provider'],
    providers: [PLClientsTableService ],
})
export class PLProviderCaseloadComponent implements OnInit, OnChanges {
    provider: any = {};
    plClientsTableService: any;
    currentUser: User;

    clients: any[] = [];
    total: number = 0;
    loading: boolean = true;
    currentPage: number;
    pageSize: number;

    private tableQueryCache: any = null;

    TABLE_STATE_NAME = 'pc';

    constructor(private plHttp: PLHttpService,
                private router: Router, private plUrls: PLUrlsService,
                private plProvider: PLProviderService,
                plClientsTableService1: PLClientsTableService,
                private store: Store<AppStore>) {
        store.select('currentUser')
            .subscribe((user: any) => {
                this.currentUser = user;
            });
        this.plClientsTableService = plClientsTableService1;
    }

    ngOnInit() {
        this.plProvider.getFromRoute()
            .subscribe((res: any) => {
                this.provider = res.provider;
                if (this.tableQueryCache) {
                    this.onQuery({ query: this.tableQueryCache });
                }
            });
    }

    ngOnChanges(changes: any) {
        if (changes.provider) {
            if (this.tableQueryCache) {
                this.onQuery({ query: this.tableQueryCache });
            }
        }
    }

    onQuery(info: { query: any }) {
        // Save in case provider not loaded yet and need to re-call later.
        this.tableQueryCache = info.query;
        // Provider calls are by user id, not by provider id.
        if (this.provider.user && this.provider.user.id) {
            this.loading = true;
            this.plClientsTableService.onQuery(info, this.provider.user.id, this.TABLE_STATE_NAME).subscribe(
                (results: any) => {
                    this.clients = results.clients;
                    this.total = results.total;
                    this.loading = false;
                },
            );
        }
    }

    clickRow(client: any) {
        this.router.navigate(['/client', client.id]);
    }
}
