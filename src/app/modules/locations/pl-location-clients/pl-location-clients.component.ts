import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { Store } from '@ngrx/store';

import { PLApiClientsService, PLGraphQLService, PLClientStudentDisplayService, PLModalService } from '@root/index';
import { PLSchoolYearsService, PLClientIdService, PLUtilService } from '@common/services/';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLLocationService } from '../pl-location.service';
import { PLLocationClientsConfirmComponent } from "../pl-location-clients-confirm/pl-location-clients-confirm.component";

const locationClientsQuery = require('../queries/location-clients.graphql');
const studentListQuery = require('../queries/student-list.graphql');

@Component({
    selector: 'pl-location-clients',
    templateUrl: './pl-location-clients.component.html',
    styleUrls: ['./pl-location-clients.component.less'],
})
export class PLLocationClientsComponent {
    public static IEP_TYPE_IEP = 'IEP'; //dupe'd from PLClientIEPGoalsService; move into common service?

    location: any = {};
    clientStudentCapital: string = "";
    schoolYearString: string = "";

    reQuery: boolean = false;
    mayDownloadStudentList: boolean = false;
    downloadButtonDisabled: boolean = false;
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
            }
        },
        { dataKey: 'annualIepDueDate', title: 'IEP Due', orderable: false, filterable: false },
        { dataKey: 'triennialEvaluationDueDate', title: 'Triennial Due',
         orderable: false, filterable: false },
    ];
    dataInfo: any = {
        count: 0,
    };

    selectedSchoolYear: string = null;
    schoolYearLoaded: boolean = false;
    showTooltip: boolean = false;

    private tableQueryCache: any = null;

    constructor(
        private util: PLUtilService,
        private store: Store<AppStore>,
        private router: Router, private plClients: PLApiClientsService,
        private plLocation: PLLocationService,
        private yearsService: PLSchoolYearsService,
        private plModal: PLModalService,
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
        this.plLocation.getFromRoute()
            .subscribe((res: any) => {
                this.location = res.location;
            });
        this.yearsService.getCurrentSchoolYear()
            .pipe(first())
            .subscribe((year: any) => {
                this.selectedSchoolYear = year.code;
                this.schoolYearString = year.name;
                this.schoolYearLoaded = true;
            });
    }

    ngOnChanges(changes: any) {
        if (changes.location) {
            this.reQuery = !this.reQuery;
        }
    }

    onYearSelected(evt: any) {
        this.selectedSchoolYear = evt.model;
        if (this.selectedSchoolYear == 'all_time') {
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
        if (this.location.id) {
            // Save for next time for filter changes.
            this.tableQueryCache = info.query;
            const vars = Object.assign({}, info.query, {
                locationId_In: this.location.id,
                schoolYearCode_In: (this.selectedSchoolYear === 'all_time') ? '' : this.selectedSchoolYear,
                first: info.query.limit,
                offset: (info.query.page - 1) * info.query.limit,
                orderBy: info.query.orderBy,
            });
            this.plGraphQL.query(locationClientsQuery, vars, {}).pipe(first())
                .subscribe((res: any) => {
                    this.data = res.clients.map((item: any) => {
                        const activeIep = (item.activeIep && item.activeIep.type === PLLocationClientsComponent.IEP_TYPE_IEP) ? item.activeIep : null;

                        const iepDate = activeIep && activeIep.nextAnnualIepDate;
                        item.annualIepDueDate = iepDate && this.util.getDateNormalized(iepDate).dateStringDisplay;
                        const evalDate = activeIep && activeIep.nextEvaluationDate;
                        item.triennialEvaluationDueDate = evalDate && this.util.getDateNormalized(evalDate).dateStringDisplay;
                        return item;
                    });
                    this.dataInfo.count = res.clients_totalCount;
                });
        // Hack to fix rare error where location isn't loaded yet but when it does, ngOnChanges
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

    downloadStudents(results: any[] = [], cursor: string = "") {
        const vars = {
                locationId_In: this.location.id,
                schoolYearCode_In: (this.selectedSchoolYear === 'all_time') ? '' : this.selectedSchoolYear,
                first: 100,
                after: cursor,
            };
        this.plGraphQL.query(studentListQuery, vars)
            .subscribe((res: any) => {
                results = results.concat(res.clients);

                if (res.clients_pageInfo.hasNextPage && res.clients_pageInfo.endCursor) {
                    // fetch more results until we reach the final page
                    this.downloadStudents(results, res.clients_pageInfo.endCursor);
                } else {
                    let modalRef: any;
                    const data = results;
                    const location = this.location.name;
                    const clientStudentCapital = this.clientStudentCapital;
                    const schoolYearString = this.schoolYearString;
                    const params = {
                        data,
                        location,
                        clientStudentCapital,
                        schoolYearString,
                        onCancel: () => {
                            modalRef._component.destroy();
                        },
                    };
                    this.plModal.create(PLLocationClientsConfirmComponent, params)
                        .subscribe((ref: any) => {
                            modalRef = ref;
                        });
                }
            });
    }

    displayLearnMore(event: Event) {
        if (!this.showTooltip) {
            this.showTooltip = true;
            event.stopPropagation();
            document.addEventListener('click', this.closeTooltip);
        }
    }

    onClickTooltipContents(event: Event) {
       event.stopPropagation();
    }

    closeTooltip = (event: any) => {
        this.showTooltip = false;
        document.removeEventListener('click', this.closeTooltip);
    }
}
