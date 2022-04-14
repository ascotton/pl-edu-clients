import {
    PLTimezoneService,
    PLToastService,
} from '@root/index';
import * as moment from 'moment';
import { forkJoin, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { Component, OnInit } from '@angular/core';
import { catchError, first, tap } from 'rxjs/operators';
import { PLInvoiceService } from '../pl-invoice.service';
import { PLCurrencyPipe, PLTimingPipe } from '@root/src/app/common/pipes';
import { PLTimesheetService } from '../pl-timesheet.service';
import { BillingTypeResponse, BILLING_TYPE } from '../pl-billing';

@Component({
    selector: 'pl-past-billings',
    templateUrl: './pl-past-billings.component.html',
    styleUrls: ['./pl-past-billings.component.less'],
})
export class PLPastBillingsComponent implements OnInit {

    currentUser: User;
    columns: any = [];

    data: any[] = [];
    dataInfo: any = {
        count: 0,
        queryId: '',
    };

    filterShowAll = false;

    reQuery = false;

    private BILLING_API_STATUS = {
        invoice: {
            showAll: 'retracted,processed,submitted',
            hideRetractions: 'processed,submitted',
        },
        timesheet: {
            showAll: 'submitted,approved,retracted_by_provider,retracted_by_pl,exported',
            hideRetractions: 'submitted,approved',
        },
    };
    private emptyBillingResponse: any = { count: 0, results: [], next: null, previous: null };
    private userTimezone: string;

    private invoiceResultProcess = (invoice: BillingTypeResponse) => {
        if (invoice.count > 0) {
            invoice.results.forEach((result) => {
                if (result.status) {
                    result.type = 'Invoice';
                    // result.amount = this.plCurrencyPipe.transform(result.amount); // TODO: transform amount to $
                    result.number = result.invoice_number;
                    result.status = result.status.charAt(0).toUpperCase() + result.status.substring(1);
                }
            });
        }
    }

    private timesheetResultProcess = (timesheet: BillingTypeResponse) => {
        if (timesheet.count > 0) {
            timesheet.results.forEach((result) => {
                if (result.status) {
                    if (result.status.includes('retracted')) {
                        result.status = result.status === 'retracted_by_provider'
                            ? 'Retracted by Provider' : 'Retracted by PL';
                    } else {
                        result.status = result.status.charAt(0).toUpperCase() + result.status.substring(1);
                    }

                    result.type = 'Timesheet';
                    result.amount = this.plTimingPipe.transform(result.total_hours);
                }
            });
        }

    }

    constructor(
        private router: Router,
        private store: Store<AppStore>,
        private plToastSvc: PLToastService,
        private plTimingPipe: PLTimingPipe,
        // private plCurrencyPipe: PLCurrencyPipe,
        private plInvoiceSvc: PLInvoiceService,
        private plTimezoneSvc: PLTimezoneService,
        private plTimesheetSvc: PLTimesheetService,
    ) { }

    ngOnInit(): void {
        this.store.select('currentUser').subscribe(
            (user) => {
                this.currentUser = user;
                this.userTimezone = this.plTimezoneSvc.getUserZone(this.currentUser);
            },
            () => this.displayToastErrorMsg('There was an issue getting the user\s info.'),
        );
        this.setColumns();
    }

    onChangeShowRetractions() {
        this.reQuery = !this.reQuery;
    }

    onQuery(info: { query: any; queryId: string }) {
        const ordering = info.query.ordering === 'submitted_on' ? 'ascending' : 'descending';
        const invoiceQuery = {
            ...info.query,
            status__in: this.filterShowAll
                ? this.BILLING_API_STATUS.invoice.showAll
                : this.BILLING_API_STATUS.invoice.hideRetractions,
        };
        const timesheetQuery = {
            ...info.query,
            status__in: this.filterShowAll
                ? this.BILLING_API_STATUS.timesheet.showAll
                : this.BILLING_API_STATUS.timesheet.hideRetractions,
        };

        const invoiceAndTimesheet$ = forkJoin([
            this.plInvoiceSvc.get(invoiceQuery).pipe(
                first(),
                tap((invoice: BillingTypeResponse) => this.invoiceResultProcess(invoice)),
                catchError(_ => of(this.emptyBillingResponse)),
            ),
            this.plTimesheetSvc.get(timesheetQuery).pipe(
                first(),
                tap((timesheet: BillingTypeResponse) => this.timesheetResultProcess(timesheet)),
                catchError(_ => of(this.emptyBillingResponse)),
            ),
        ]);

        invoiceAndTimesheet$.subscribe(
            ([invoiceRes, billingRes]: BillingTypeResponse[]) => {
                const invoiceAndBilling = {
                    count: invoiceRes.count + billingRes.count,
                    results: invoiceRes.results.concat(billingRes.results),
                };

                this.data = this.sortBasedOnSubmittedDate(invoiceAndBilling.results, ordering);
                this.dataInfo.count = invoiceAndBilling.count;
                this.dataInfo.queryId = info.queryId;
            },
            (error: any) => {
                console.error(error);
                this.displayToastErrorMsg('There was an issue getting the billings history, please try again.');
            },
        );
    }

    onRowClick(info: { rowData: any, colData: any }) {
        const uriType = info.rowData.type.toLowerCase() === BILLING_TYPE.Invoice ? 'invoice' : 'timesheet-detail';
        this.router.navigate([`/billing/${uriType}/${info.rowData.uuid}`]);
    }

    //#region Privates

    /**
     * Wrapper of the PLToastService show() function with prebuilt error
     * @param message The text to display in the toast error
     */
    private displayToastErrorMsg(message: string) {
        this.plToastSvc.show('error', message);
    }

    private setColumns() {
        const columns = [
            { title: 'ID', dataKey: 'number', filterable: false, orderable: false },
            { title: 'Type', dataKey: 'type', filterable: false, orderable: false },
            {
                title: 'Submitted',
                dataKey: 'submitted_on',
                filterable: false,
                orderDirection: 'descending',
                htmlFn: (rowData: any, colData: any) => {
                    return this.plTimezoneSvc.toUserZone(rowData.submitted_on, null, this.userTimezone).format('M/D/YYYY, h:mm A');
                },
            },
            {
                title: 'Period', dataKey: 'period__end', filterable: false, orderable: false,
                htmlFn: (rowData: any, colData: any) => {
                    let periodEnd;
                    let periodStart;

                    if (rowData.period_expanded) {
                        periodEnd = rowData.period_expanded.end;
                        periodStart = rowData.period_expanded.start;
                    } else if (rowData.work_period_expanded) {
                        periodEnd = rowData.work_period_expanded.end_date;
                        periodStart = rowData.work_period_expanded.start_date;
                    }

                    periodEnd = moment(periodEnd, 'YYYY-MM-DD').format('M/D/YYYY');
                    periodStart = moment(periodStart, 'YYYY-MM-DD').format('M/D/YYYY');

                    return `${periodStart} - ${periodEnd}`;
                },
            },
            { title: 'Qty | Hours', dataKey: 'amount', filterable: false, orderable: false },
            { title: 'Status', dataKey: 'status', filterable: false, orderable: false },
        ];

        this.columns = columns;
    }

    /**
     * Function for sorting the past billings table.
     * The sorting is based on submitted date only.
     * The sorting is done in the FE because we are merging two API calls; invoices and timesheets
     *
     * @param results
     * @param order
     * @returns
     */
    private sortBasedOnSubmittedDate(results: any[], order: string) {
        results.sort((a, b) => {
            if (a.submitted_on < b.submitted_on) return order === 'descending' ? 1 : -1;
            if (a.submitted_on > b.submitted_on) return order === 'descending' ? -1 : 1;
            return 0;
        });

        return results;
    }

    //#endregion
}
