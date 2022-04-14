import * as moment from 'moment';
import { Store } from '@ngrx/store';
import { PLInvoice } from '../../pl-invoice';
import { AppStore } from '@root/src/app/appstore.model';
import { PLInvoiceService } from '../../pl-invoice.service';
import { Component, Input, OnInit } from '@angular/core';
import { PLTimesheetService } from '../../pl-timesheet.service';
import { BILLING_TYPE, PLBillingInfo } from '../../pl-billing';
import { PLFetchInvoicePreview } from '@root/src/app/common/store/invoice';
import { PLModalService, PLToastService, PLLinkService } from '@root/index';
import { PLBillingPreviewModalComponent } from '../pl-billing-preview-modal/pl-billing-preview-modal.component';
import { PLFetchTimesheetPreview } from '@root/src/app/common/store/timesheet/timesheet.store';

@Component({
    selector: 'pl-billing-preview',
    templateUrl: './pl-billing-preview.component.html',
    styleUrls: ['./pl-billing-preview.component.less'],
})
export class PLBillingPreviewComponent implements OnInit {

    @Input() readonly billingType: string; // invoice or timesheet.
    @Input()
    get billing(): any { return this._billing; }
    set billing(value: any) { this._billing = value; }

    billingDetail: any;
    billingSignOff = false;

    classes = { signOff: '' };
    onSubmitDisabled = true;
    retractingBilling = false;
    submittingBilling = false;

    private _billing: any;
    private plFetchBillingPreview: any; // For usage of this.store$.dispatch

    get billingTypeEnum() {
        return BILLING_TYPE;
    }
    get billingTypeForUI() {
        return this.billingType === BILLING_TYPE.Invoice ? 'Invoice' : 'Timesheet';
    }
    get billingNumberForUI() {
        return this.billingType === BILLING_TYPE.Invoice ? 'Invoice' : 'Reference';
    }
    get billingPeriodForUI() {
        return this.billingType === BILLING_TYPE.Invoice ? 'Invoice' : 'Work';
    }
    get totalAmountForUI() {
        return this.billingType === BILLING_TYPE.Invoice ? 'Amount Due' : 'Total Hours';
    }

    constructor(
        private plLink: PLLinkService,
        private store$: Store<AppStore>,
        private plModal: PLModalService,
        private plToast: PLToastService,
        private plTimesheetSvc: PLTimesheetService,
        private plInvoiceService: PLInvoiceService,
    ) { }

    ngOnInit() {
        if (this.billingType === BILLING_TYPE.Invoice) {
            this.billingDetail = this.prepareInvoiceForUI(this._billing);
            this.plFetchBillingPreview = PLFetchInvoicePreview({ source: 'schedule' });
        } else {
            this.billingDetail = this.prepareTimesheetForUI(this._billing);
            this.plFetchBillingPreview = PLFetchTimesheetPreview();
        }
    }

    //#region DOM Functions

    onCancel() {
        // The 'draft' status is equal to 'unsubmitted' for the Timesheet billing type.
        const isUnsubmitted = this.billing.status === 'unsubmitted' || this.billing.status === 'draft';
        isUnsubmitted ? this.openLeaveModal() : this.goBack();
    }

    onChangeSignOff() {
        if (this.billingSignOff) {
            this.onSubmitDisabled = false;
            this.classes.signOff = 'signed-off';
        } else {
            this.onSubmitDisabled = true;
            this.classes.signOff = '';
        }
    }

    onRetract() {
        this.retractingBilling = true;
        const billingSvc = this.billingType === BILLING_TYPE.Invoice ? this.plInvoiceService : this.plTimesheetSvc;

        billingSvc.retract(this.billing.uuid).subscribe(
            () => this.onSubmitOrRetractSuccess('retractingBilling', 'retracted'),
            () => this.plToast.show('error', `There was an issue while retracting your ${this.billingType}. Please try again or contact support.`),
        );
    }

    onSubmit() {
        this.submittingBilling = true;
        const plBillingSvcSave$ = this.billingType === BILLING_TYPE.Invoice
            ? this.plInvoiceService.save({
                status: this.billing.status,
                provider: this.billing.provider,
                period: this.billing.period,
                amount: this.billing.amount,
            })
            : this.plTimesheetSvc.save();

        plBillingSvcSave$.subscribe(
            () => this.onSubmitOrRetractSuccess('submittingBilling', 'submitted'),
            () => this.plToast.show('error', `There was an issue while submitting your ${this.billingType}. Please try again or contact support.`),
        );
    }

    //#endregion

    //#region Privates Functions

    private formAddress(data: PLBillingInfo) {
        return {
            name: `${data.first_name} ${data.last_name}`,
            address: {
                street: data.billing_street,
                city: data.billing_city,
                state: data.billing_state,
                country: data.billing_country,
                zip: data.billing_postal_code,
            },
            phone: data.phone,
        };
    }

    private goBack() { this.plLink.goBack(['/billing']); }

    private openLeaveModal() {
        const billingType = this.billingType === BILLING_TYPE.Invoice ? 'Invoice' : 'Timesheet';
        const params: any = {
            headerText: `Exit ${billingType} Preview`,
            messageText: `Are you sure you want to exit before submitting this ${this.billingType}?`,
            exitButtonText: `Exit ${billingType}`,
            stay: () => this.plModal.destroyAll(),
            exit: () => {
                this.goBack();
                this.plModal.destroyAll();
            },
        };
        this.plModal.create(PLBillingPreviewModalComponent, params);
    }

    /**
     * Function to call when the subscriber of submit or retract succeeds.
     *
     * @param actionInProcess 'submittingBilling' or 'retractingBilling'.
     * @param actionName 'submitted' or 'retracted'.
     */
    private onSubmitOrRetractSuccess(actionInProcess: string, actionName: string): void {
        this.store$.dispatch(this.plFetchBillingPreview);
        setTimeout(() => {
            this[actionInProcess] = false;
            this.plToast.show('success', `Your ${ this.billingType } has been ${ actionName }!`, 2000, true);
            this.goBack();
        }, 2000);
    }

    private prepareInvoiceForUI(invoice: PLInvoice) {
        if (!invoice) return {};

        // End is just a day (no time or timezone).
        const periodStart = moment(invoice.period_expanded.start, 'YYYY-MM-DD');
        const periodEnd = moment(invoice.period_expanded.end, 'YYYY-MM-DD');
        return {
            periodStart: periodStart.format('M/D/YYYY'),
            periodEnd: periodEnd.format('M/D/YYYY'),
            from: this.formAddress(invoice.provider_expanded),
            to: this.formAddress(invoice.payer_expanded),
            billingNumber: invoice.invoice_number,
            status: invoice.status,
            amount: invoice.amount,
            terms: 'Net 30',
            summary: invoice.summary_expanded,
        };
    }

    private prepareTimesheetForUI(timesheetDetail: any) {
        if (!timesheetDetail) {
            return {};
        }

        let status = timesheetDetail.status;

        if (timesheetDetail.status === 'draft') {
            status = 'unsubmitted';
        } else if (timesheetDetail.status.includes('retracted')) {
            status = 'retracted';
        }

        const periodEnd = moment(timesheetDetail.work_period_expanded.end_date, 'YYYY-MM-DD').format('M/D/YYYY');
        const periodStart = moment(timesheetDetail.work_period_expanded.start_date, 'YYYY-MM-DD').format('M/D/YYYY');

        return {
            status,
            periodEnd,
            periodStart,
            billingNumber: timesheetDetail.number,
            amount: timesheetDetail.total_hours.slice(0, 5),
            from: this.formAddress(timesheetDetail.provider_expanded),
            summary: timesheetDetail.summary,
        };
    }

    //#endregion

}
