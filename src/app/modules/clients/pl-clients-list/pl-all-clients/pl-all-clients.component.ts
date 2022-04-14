import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PLClientsTableService } from '@common/services/index';
import { PLClientsListService } from '../pl-clients-list.service';

@Component({
    selector: 'pl-all-clients',
    templateUrl: './pl-all-clients.component.html',
    styleUrls: ['./pl-all-clients.component.less', '../pl-clients-list.component.less'],
    providers: [PLClientsTableService, PLClientsListService ],
})
export class PLAllClientsComponent {

    lastQuery: any = null;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        public plClientsList: PLClientsListService,
        public plClientsTableService: PLClientsTableService,
    ) { }

    ngOnInit() {
        this.plClientsList.loading = true;
    }

    clickRow(client: any) {
        this.plClientsList.clickRow(client);
    }

    /**
     * Function called when any action is performed by the user in the `pl-table-wrapper`
     * By default the table is set for fetching the current year.
     *   The  validation for `undefined` is mainly in the first call, when that happens, we get the school year from the `filterSelectOpts`.
     *   For the other calls when the user updates the `School Year`; the `schoolYearCode_In` won't be undefined anymore.
     * 
     * @param info - The information of the `Students/Clients` table.
     */
    onQuery(info: { query: any }) {
        this.lastQuery = info.query;

        if (info.query.schoolYearCode_In === undefined) {
            const currentSchoolYear = this.plClientsTableService.filterSelectOpts.filter((select) => select.value === 'schoolYearCode_In');
            info.query.schoolYearCode_In = currentSchoolYear[0].textArray[0];
        }

        this.plClientsList.onQuery(info, 'all');
    }

    routeTo(uriToRoute: string): void {
        this.router.navigate([uriToRoute], {
            relativeTo: this.activatedRoute,
            queryParams: { next: this.router.url }
        });
    }
}
