import {
    Component,
    Input,
    OnChanges,
    OnInit,
} from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { PLGraphQLService, PLLodashService } from '@root/index';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLClientService } from '../pl-client.service';
import { PLProvidersListService } from '@common/services';

const clientProvidersQuery = require('./queries/client-providers.graphql');

@Component({
    selector: 'pl-client-providers',
    templateUrl: './pl-client-providers.component.html',
    styleUrls: ['./pl-client-providers.component.less'],
})
export class PLClientProvidersComponent implements OnChanges, OnInit {
    @Input() client: any = {};

    reQuery: boolean = false;
    user: User;
    data: any[] = [];
    columns: any = [];
    dataInfo: any = {
        count: 0,
        queryId: '',
    };
    private tableQueryInfoCache: any = false;
    private subscriptions: any = {};

    constructor(
        private store: Store<AppStore>,
        private router: Router,
        private plClient: PLClientService,
        private plGraphQL: PLGraphQLService,
        private plLodash: PLLodashService,
        private plProvidersListService: PLProvidersListService,
    ) {

    }

    ngOnInit() {
        this.subscriptions.user = this.store.select('currentUser').subscribe((user: User) => {
            this.user = user;
            this.setColumns();
        });

        this.subscriptions.client = this.store.select('currentClientUser').subscribe((clientUser: any) => {
            this.client = clientUser.client;

            if (this.tableQueryInfoCache) {
                this.onQuery(this.tableQueryInfoCache);
            }
        });
    }

    ngOnChanges(changes: any) {
        if (changes.client) {
            this.reQuery = !this.reQuery;
        }
    }

    ngOnDestroy() {
        this.subscriptions.user.unsubscribe();
        this.subscriptions.client.unsubscribe();
    }

    setColumns() {
        this.columns = [
            { dataKey: 'lastName', title: 'Last Name', filterSearchKey: 'lastName_Icontains', orderValue: 'lastName',
                htmlFn: (rowData: any, colData: any) => {
                    return rowData.user.lastName;
                } },
            { dataKey: 'firstName', title: 'First Name', filterSearchKey: 'firstName_Icontains', orderValue: 'firstName',
                orderDirection: 'ascending', htmlFn: (rowData: any, colData: any) => {
                    return rowData.user.firstName;
                } }
        ];

        if (this.plProvidersListService.isScheduleColumnVisible(this.user)) {
            this.columns.push(
                { dataKey: 'uuid', title: 'Schedule', filterable: false, orderable: false,
                    htmlFn: (provider: any, colData: any) => {
                        if (this.plProvidersListService.mayViewScheduleFor(provider)) {
                            const url = this.plProvidersListService.scheduleUrl(provider.user.id);
                            return `<a href="${url}" target="_blank"
                                    title="Schedule for ${provider.user.firstName}">Schedule</a>`;
                        }

                        return '';
                    },
                },
            );
        }

        this.columns.push({
            dataKey: 'email',
            title: 'Email',
            filterable: false,
            orderable: false,
            htmlFn: (provider: any) => provider.user.email,
        });

        if (this.plProvidersListService.isPhoneColumnVisible(this.user)) {
            this.columns.push({
                dataKey: 'phone',
                title: 'phone',
                filterable: false,
                orderable: false,
                htmlFn: (provider: any) => provider.phone,
            });
        }
    }

    onQuery(info: { query: any, queryId: string }) {
        // Save in case provider not loaded yet and need to re-call later.
        this.tableQueryInfoCache = info;
        if (this.client.id) {
            let params = Object.assign({}, info.query, {
                clientId: this.client.id,
            });
            params.offset = (params.page - 1) * params.first;
            params = this.plLodash.omit(params, ['page']);
            this.plGraphQL.query(clientProvidersQuery, params, {}).subscribe((res: any) => {
                this.data = res.providerProfiles ? res.providerProfiles : [];
                this.dataInfo.count = res.providerProfiles_totalCount;
                this.dataInfo.queryId = info.queryId;
            });
        }
    }

    onRowClick(data: { rowData: any, colData: any }) {
        // Do NOT do anything if click in schedule row as that is a link.
        // It uses the `uuid` data key so check for that.
        if (data.colData.dataKey !== 'uuid') {
            this.router.navigate(['/provider', data.rowData.user.id]);
        }
    }
}
