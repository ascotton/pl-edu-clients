import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
// NgRx Store
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { selectInvoicePreview } from '@common/store/invoice';
import { selectTimesheetPreview } from '@common/store/timesheet';
// RxJs
import { filter, first, } from 'rxjs/operators';
import { PLTimezoneService } from '@root/index';
// Services
// Models
import { PLInvoice } from '../pl-invoice';
import { User } from '@modules/user/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { PLTimesheetPreview } from '../pl-timesheet';
import { PLBillingErrors } from '../pl-billing';

@Component({
    selector: 'pl-next-billing',
    templateUrl: './pl-next-billing.component.html',
    styleUrls: ['./pl-next-billing.component.less'],
})
export class PLNextBillingComponent implements OnInit {

    billingView: any;

    currentUser: User;

    isW2Provider: boolean;

    loading = false;

    scheduleUrl: string;

    userTimezone: string;

    private nextInvoice = {
        type: 'invoice',
        mainTitle: 'Next Invoice',
        periodTitle: 'Invoice Period',
        estimationTitle: 'Estimated Amount',
        buttonTitle: 'Preview Invoice',
        detailsRouteLink: '../invoice',
        result: {},
    };
    private nextTimesheet = {
        type: 'timesheet',
        mainTitle: 'Next Timesheet',
        periodTitle: 'Work Period',
        estimationTitle: 'Estimated Hours',
        buttonTitle: 'Preview Timesheet',
        detailsRouteLink: '../timesheet-detail',
        result: {},
    };

    private get getBillingValid(): boolean {
        return this.billingView.result.valid;
    }
    get icon(): string {
        return this.getBillingValid ? 'info' : 'caution';
    }
    get iconColor(): string {
        return this.getBillingValid ? 'blue' : 'yellow';
    }

    constructor(
        private store$: Store<AppStore>,
        private plTimezone: PLTimezoneService,
        private router: Router,
        private route: ActivatedRoute,
    ) { }

    ngOnInit() {
        this.loading = true;
        this.init();
    }

    routeTo(uriToRoute: string) {
        this.router.navigate([uriToRoute], { relativeTo: this.route });
    }

    private init() {
        this.store$.select('currentUser').subscribe((user) => {
            this.currentUser = user;
            this.isW2Provider = user.xProvider.isW2;
            this.userTimezone = this.plTimezone.getUserZone(this.currentUser);
        });

        const billingPreview = this.isW2Provider ? selectTimesheetPreview : selectInvoicePreview;
        const prepareBillingForUI = this.isW2Provider ? 'prepareTimesheetForUI' : 'prepareInvoiceForUI';

        this.store$.select(billingPreview)
            .pipe(
                filter(bp => typeof(bp) === 'object'),
                first())
            .subscribe((billing) => {
                if (!billing) return;
                this.billingView = this.isW2Provider ? this.nextTimesheet : this.nextInvoice;
                this.billingView.result = this[prepareBillingForUI](billing);
                this.loading = false;
            });
    }

    private checkForBillingDueDates(billingDates: any) {
        const result: any = {
            dueDate: '',
            periodEnd: '',
            periodStart: '',
        };
        const periodEnd = this.isW2Provider ? billingDates.end_date : billingDates.end;
        const periodStart = this.isW2Provider ? billingDates.start_date : billingDates.start;

        result.periodEnd = moment(periodEnd, 'YYYY-MM-DD'); // End is just a day (no time or timezone).
        result.periodStart = moment(periodStart, 'YYYY-MM-DD');
        const dueDate = billingDates.due_date;

        result.dueDate = result.periodEnd.clone().add(1, 'days').format('dddd, MMMM D, YYYY');
        result.dueDate += ' at 5:00 PM PT';

        if (billingDates.due_date) { // hard code to PT timezone from UTC
            result.dueDate = moment.tz(billingDates.due_date, 'America/Los_Angeles').format('dddd, MMMM D, YYYY [at] h:mm A [PT]');
        }

        return result;
    }

    private checkForBillingErrors(errors: PLBillingErrors) {
        const result = {
            status: 'valid',
            noRecords: false,
            appointmentErrorCount: 0,
        };

        if (errors) {
            const appointmentsWithNoRecords = errors.appointments_without_records;

            if (appointmentsWithNoRecords && appointmentsWithNoRecords.appointments_without_records_count) {
                result.status = 'invalid';
                result.appointmentErrorCount += appointmentsWithNoRecords.appointments_without_records_count;
            }
            if (errors.unsigned_records_exist) {
                result.status = 'invalid';
                result.appointmentErrorCount += errors.unsigned_records_exist.unsigned_records_count;
            } else if (errors.no_records_exist) {
                result.noRecords = true;
            }
        }

        return result;
    }

    private prepareInvoiceForUI(invoice: PLInvoice) {
        try {
            const dueDate = this.checkForBillingDueDates(invoice.period_expanded);
            const invoiceErrors = this.checkForBillingErrors(invoice.errors);

            const results = {
                dueDate: dueDate.dueDate,
                amount: invoice.amount,
                status: invoiceErrors.status,
                submitStatus: invoice.status,
                noRecords: invoiceErrors.noRecords,
                valid: invoiceErrors.status === 'valid',
                end: dueDate.periodEnd.format('M/D/YYYY'),
                start: dueDate.periodStart.format('M/D/YYYY'),
                appointmentErrorCount: invoiceErrors.appointmentErrorCount,
                invoicePeriodRaw: { period_expanded: invoice.period_expanded },
            };

            return results;
        } catch (error) {
            console.error(error);
            return { status: 'error' };
        }
    }

    private prepareTimesheetForUI(timesheet: PLTimesheetPreview) {
        if (!timesheet) {
            return { status: 'empty' };
        }
        try {
            if (timesheet.catchedError) return { status: 'error' };
            const dueDate = this.checkForBillingDueDates(timesheet.work_period_expanded);
            const timesheetErrors = this.checkForBillingErrors(timesheet.errors);

            const timesheetResults = {
                dueDate: dueDate.dueDate,
                error: timesheet.has_error,
                amount: timesheet.total_hours,
                submitStatus: timesheet.status,
                status: timesheetErrors.status,
                noRecords: timesheetErrors.noRecords,
                valid: timesheetErrors.status === 'valid',
                end: dueDate.periodEnd.format('M/D/YYYY'),
                start: dueDate.periodStart.format('M/D/YYYY'),
                appointmentErrorCount: timesheetErrors.appointmentErrorCount,
            };

            return timesheetResults;
        } catch (error) {
            console.error(error);
            return { status: 'error' };
        }
    }

}
