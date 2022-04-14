import { Component } from '@angular/core';
import { Router } from '@angular/router';

import {Store} from '@ngrx/store';
import { Observable } from 'rxjs';

import {PLHttpService, PLUrlsService} from '@root/index';
import {AppStore} from '@app/appstore.model';
import {User} from '@modules/user/user.model';
import {PLProviderService} from '../pl-provider.service';

@Component({
    selector: 'pl-provider-locations',
    templateUrl: './pl-provider-locations.component.html',
    styleUrls: ['./pl-provider-locations.component.less'],
    inputs: ['provider'],
})
export class PLProviderLocationsComponent {
    provider: any = {};

    reQuery: boolean = false;
    user: User;
    data: any[] = [];
    columns: any = [];
    dataInfo: any = {
        count: 0,
        queryId: '',
    };
    private tableQueryInfoCache: any = false;

    constructor(private plHttp: PLHttpService, private store: Store<AppStore>,
     private router: Router, private plUrls: PLUrlsService,
     private plProvider: PLProviderService) {
        store.select('currentUser')
            .subscribe((user) => {
                this.user = user;
            });
    }

    ngOnInit() {
        this.plProvider.getFromRoute()
            .subscribe((res: any) => {
                this.provider = res.provider;
                if (this.tableQueryInfoCache) {
                    this.onQuery(this.tableQueryInfoCache);
                }
            });
        this.setColumns();
    }

    ngOnChanges(changes: any) {
        if (changes.provider) {
            this.reQuery = !this.reQuery;
        }
    }

    setColumns() {
        this.columns = [
            // { dataKey: 'state', title: 'State', filterSearchKey: 'state__icontains',
            //  orderValue: 'sf_account__shipping_state' },
            { dataKey: 'name', title: 'Location', filterSearchKey: 'name__icontains',
             orderValue: 'sf_account__name', orderDirection: 'ascending', },
            { dataKey: 'parent_organization', title: 'Organization', orderable: false,
             filterSearchKey: 'parent_organization_name__icontains',
                htmlFn: (rowData: any, colData: any) => {
                    return (rowData.parent_organization) ? rowData.parent_organization.name : '';
                }
            },
        ];
    }

    onQuery(info: { query: any, queryId: string }) {
        // Save in case provider not loaded yet and need to re-call later.
        this.tableQueryInfoCache = info;
        // Provider calls are by user id, not by provider id.
        if (this.provider.user && this.provider.user.id) {
            const params = Object.assign({}, info.query, {
                provider: this.provider.user.id,
                is_active: true,
            });
            this.plHttp.get('locations', params)
                .subscribe((res: any) => {
                    this.data = res.results ? res.results : [];
                    this.dataInfo.count = res.count;
                    this.dataInfo.queryId = info.queryId;
                });
        }
    }

    onRowHref(row: any) {
        return {
            href: `/location/${row.uuid}`,
        };
    }
};
