import { Store } from '@ngrx/store';
import { first, tap } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { AppStore } from '@root/src/app/appstore.model';
import { PLTimesheetService } from '../pl-timesheet.service';
import { PLAmendmentResults, PLAmendment } from '../pl-amendment';
import { PLTimezoneService, PLToastService } from '@root/src/lib-components';
import { PLUserGuidingService } from '@common/services/pl-user-guiding.service';

@Component({
    selector: 'pl-amendments',
    templateUrl: './pl-amendments.component.html',
    styleUrls: ['./pl-amendments.component.less'],
})
export class PLAmendmentsComponent implements OnInit {
    amendmentsTable: any = {
        header: {
            sort: {
                id: '', entity: '', status: '', reasonNotes: '', netChanges: '',
                date: 'descending', billingId: '', netDifference: '', payDate: '',
            },
        },
        data: [],
        footer: { total: 0, currentPage: 1, pageSize: 25 },
    };

    private isAmendmentDataLoading = false;
    private isErrorInAmendment = false;
    private isTableLoading = true;

    private rowsInDom: Set<PLAmendmentResults> = new Set();
    private rowsExpanded: Set<PLAmendmentResults> = new Set();

    private userTimezone: string;

    /**
     * Updates several properties that come null to '--'.
     * Updates any non null timezone to readable human format.
     * Updates the estimated pay date to 'N/A' when the status is 'Rejected'
     *
     * @param amendment Result from the API timesheet-amendments of type PLAmendment
     */
    private processAmendmentsResults = (amendment: PLAmendment) => {
        if (amendment.count > 0) {
            amendment.results.forEach((result: PLAmendmentResults) => {
                for (const key in result) if (result[key] === null) result[key] = '--';
                for (const key in result.after) if (result.after[key] === null) result.after[key] = '--';
                for (const key in result.before) if (result.before[key] === null) result.before[key] = '--';

                result.created = this.toUserTimeZone(result.created);
                result.status = result.status.charAt(0).toUpperCase() + result.status.substring(1);
                result.after.end = result.after.end !== '--' ? this.toUserTimeZone(result.after.end) : '--';
                result.estimated_pay_date = result.status === 'Rejected' ? 'N/A' : result.estimated_pay_date;
                result.before.end = result.before.end !== '--' ? this.toUserTimeZone(result.before.end) : '--';
                result.after.start = result.after.start !== '--' ? this.toUserTimeZone(result.after.start) : '--';
                result.before.start = result.before.start !== '--' ? this.toUserTimeZone(result.before.start) : '--';
                result.relatedEntity = result.before.location !== '--' ? result.before.location : result.after.location;
            });
        } else if (amendment.count === undefined) {
            throw new Error('There was an error in the amendments.');
        }
    }

    constructor(
        private store$: Store<AppStore>,
        private plToastSvc: PLToastService,
        private helper: PLUserGuidingService,
        private plTimezoneSvc: PLTimezoneService,
        private plTimesheetSvc: PLTimesheetService,
    ) { }

    //#region Getters

    get displayMainLoader() {
        return this.isTableLoading;
    }
    get displayErrorMessage() {
        return !this.isTableLoading && this.isErrorInAmendment;
    }
    get displayNoAmendmentsMessage() {
        return !this.isTableLoading && !this.isAmendmentDataLoading && !this.amendmentsTable.data.length;
    }
    get displayAmendmentsTable() {
        return !this.isTableLoading && !this.isErrorInAmendment && this.amendmentsTable.data.length;
    }
    get displayAmendmentData() {
        return !this.isAmendmentDataLoading;
    }

    //#endregion

    ngOnInit() {
        const params = {
            query: {
                page: this.amendmentsTable.footer.currentPage,
                limit: this.amendmentsTable.footer.pageSize,
                ordering: '-created',
            },
        };

        this.store$.select('currentUser').subscribe(
            (user: any) => this.userTimezone = this.plTimezoneSvc.getUserZone(user),
            () => this.displayToastErrorMsg('There was an issue getting the user\'s info.'),
        );

        this.onQuery(params);
        this.helper.runScript(`(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:2292696,hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`, false);
    }

    //#region DOM Manipulations

    isRowExpanded(amendment: PLAmendmentResults): boolean {
        return this.rowsExpanded.has(amendment);
    }

    isRowInDom(amendment: PLAmendmentResults): boolean {
        return this.rowsInDom.has(amendment);
    }

    toggleExpandedRow(amendment: PLAmendmentResults): void {
        if (this.isRowExpanded(amendment)) {
            this.rowsExpanded.delete(amendment);
        } else {
            this.rowsInDom.add(amendment);
            this.rowsExpanded.add(amendment);
        }
    }

    //#endregion

    onQuery(evt: { query: { page: number, limit: number, ordering: string } }) {
        this.isAmendmentDataLoading = true;

        const params: { page: number, limit: number, ordering: string } = {
            page: evt.query.page,
            limit: evt.query.limit,
            ordering: evt.query.ordering,
        };

        this.plTimesheetSvc.getAmendments(params).pipe(
            first(),
            tap((amendment: PLAmendment) => this.processAmendmentsResults(amendment)),
        ).subscribe(
            (amendments) => {
                this.amendmentsTable.data = amendments.results;
                this.amendmentsTable.footer.total = amendments.count;
                this.isAmendmentDataLoading = false;
                
                this.displayAmendmentsTableOnUI();
            },
            () => this.displayErrorMessageOnUI(),
        );
    }

    //#region Private Functions

    private displayAmendmentsTableOnUI(): void {
        this.isTableLoading = false;
        this.isErrorInAmendment = false;
    }

    private displayErrorMessageOnUI(): void {
        this.isTableLoading = false;
        this.isErrorInAmendment = true;
    }

    private displayToastErrorMsg(message: string): void {
        this.plToastSvc.show('error', message);
    }

    private toUserTimeZone(datetime: string): string {
        return this.plTimezoneSvc.toUserZone(datetime, null, this.userTimezone).format('M/D/YYYY, h:mm A');
    }

    //#endregion

}
