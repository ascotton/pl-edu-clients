import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

import { PLClientsListService } from '../pl-clients-list.service';
import { PLClientsTableService } from '@common/services/index';

@Component({
    selector: 'pl-caseload-clients',
    templateUrl: './pl-caseload-clients.component.html',
    styleUrls: ['./pl-caseload-clients.component.less', '../pl-clients-list.component.less'],
    providers: [PLClientsTableService, PLClientsListService],
})
export class PLCaseloadClientsComponent {
    currentUser: User;
    currentRoute = '';
    plClientsList: any;
    plClientsTableService: any;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private store: Store<AppStore>,
        private plClientsList1: PLClientsListService,
        private plClientsTableService1: PLClientsTableService,
    ) { }

    ngOnInit() {
        this.plClientsList = this.plClientsList1;
        this.currentRoute = this.router.routerState.snapshot.url;
        this.plClientsTableService = this.plClientsTableService1;
        this.store.select('currentUser').subscribe((user: any) => this.currentUser = user);
    }

    clickRow(client: any) {
        this.plClientsList.clickRow(client);
    }

    onQuery(info: { query: any }) {
        this.plClientsList.onQuery(info, 'caseload');
    }

    routeTo(uriToRoute: string): void {
        this.router.navigate([uriToRoute], { relativeTo: this.route });
    }
}
