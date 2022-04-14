import { Component } from '@angular/core';
import { first } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { PLApiClientsService, PLGraphQLService, PLClientStudentDisplayService } from '@root/index';
import { PLSchoolYearsService, PLClientIdService, PLUtilService } from '@common/services/';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLOrganizationsService } from '../pl-organizations.service';

// tslint:disable-next-line: no-require-imports
const organizationClientsQuery = require('../queries/organization-clients.graphql');

@Component({
    selector: 'pl-organization-clients',
    templateUrl: './pl-organization-clients.component.html',
})
export class PLOrganizationClientsComponent {
    public static IEP_TYPE_IEP = 'IEP'; // dupe'd from PLClientIEPGoalsService; move into common service?

    organization: any = {};
    clientStudentCapital = '';
    schoolYearString = '';

    reQuery = false;
    mayDownloadStudentList = false;
    downloadButtonDisabled = false;
    user: User;
    data: any[] = [];
    columns: any = [
        { dataKey: 'lastName', title: 'Last Name', filterable: false },
        { dataKey: 'firstName', title: 'First Name', filterTitle: 'Name',
            filterSearchKey: 'fullName_Icontains', orderDirection: 'ascending' },
        { dataKey: 'statusDisplay', title: 'Status', orderable: false, filterSearchKey: 'status_In',
            filterSelectOpts: this.formStatusSelectOpts() },
        { dataKey: 'externalId', title: 'Id', filterable: false,
            htmlFn: (rowData: any, colData: any) => {
                return (PLClientIdService.getModeFromId(rowData.externalId) !== 'needs_update') ? rowData.externalId : 'Please Update';
            },
        },
        { dataKey: 'annualIepDueDate', title: 'IEP Due', orderable: false, filterable: false },
        { dataKey: 'triennialEvaluationDueDate', title: 'Triennial Due',
            orderable: false, filterable: false },
    ];
    dataInfo: any = {
        count: 0,
    };

    selectedSchoolYear: string = null;
    schoolYearLoaded = false;

    private tableQueryCache: any = null;

    constructor(
        private util: PLUtilService,
        private store: Store<AppStore>,
        private plClients: PLApiClientsService,
        private plOrganizations: PLOrganizationsService,
        private yearsService: PLSchoolYearsService,
        private plGraphQL: PLGraphQLService,
    ) {
        store.select('currentUser')
            .subscribe((user) => {
                this.user = user;
                this.mayDownloadStudentList = user && user.xEnabledUiFlags && user.xEnabledUiFlags.includes('download-client-list');
                this.clientStudentCapital = PLClientStudentDisplayService.get(user, { capitalize: true });
            });
    }

    ngOnInit() {
        this.plOrganizations.currentOrgDetails()
            .subscribe((org: any) => {
                this.organization = org;

                this.yearsService.getCurrentSchoolYear()
                    .pipe(first())
                    .subscribe((year: any) => {
                        this.selectedSchoolYear = year.code;
                        this.schoolYearString = year.name;
                        this.schoolYearLoaded = true;
                    });
            });
    }

    ngOnChanges(changes: any) {
        if (changes.location) {
            this.reQuery = !this.reQuery;
        }
    }

    onYearSelected(evt: any) {
        this.selectedSchoolYear = evt.model;
        if (this.selectedSchoolYear === 'all_time') {
            this.downloadButtonDisabled = true;
        } else {
            this.downloadButtonDisabled = false;
        }
        this.schoolYearString = evt.name;
        if (this.tableQueryCache) {
            this.onQuery({ query: this.tableQueryCache });
        }
    }

    formStatusSelectOpts() {
        return this.plClients.formStatusSelectOpts();
    }

    onQuery(info: { query: any }) {
        if (this.organization.id) {
            // Save for next time for filter changes.
            this.tableQueryCache = info.query;
            const vars = Object.assign({}, info.query, {
                organizationId_In: this.organization.id,
                schoolYearCode_In: (this.selectedSchoolYear === 'all_time') ? '' : this.selectedSchoolYear,
                first: info.query.limit,
                offset: (info.query.page - 1) * info.query.limit,
                orderBy: info.query.orderBy,
            });
            this.plGraphQL.query(organizationClientsQuery, vars, {}).pipe(first())
                .subscribe((res: any) => {
                    this.data = res.clients.map((item: any) => {
                        const activeIep =
                            (item.activeIep && item.activeIep.type === PLOrganizationClientsComponent.IEP_TYPE_IEP) ?
                                item.activeIep :
                                null;

                        const iepDate = activeIep && activeIep.nextAnnualIepDate;
                        item.annualIepDueDate = iepDate && this.util.getDateNormalized(iepDate).dateStringDisplay;
                        const evalDate = activeIep && activeIep.nextEvaluationDate;
                        item.triennialEvaluationDueDate =
                            evalDate && this.util.getDateNormalized(evalDate).dateStringDisplay;
                        return item;
                    });
                    this.dataInfo.count = res.clients_totalCount;
                });
        // Hack to fix rare error where organization isn't loaded yet but when it does, ngOnChanges
        // does not fire, so the clients never load at all.
        } else {
            setTimeout(() => {
                this.onQuery(info);
            }, 500);
        }
    }

    onRowHref(row: any) {
        return {
            href: `/client/${row.id}`,
        };
    }
}
