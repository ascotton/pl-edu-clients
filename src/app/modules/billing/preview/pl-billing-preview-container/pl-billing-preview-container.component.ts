import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { PLInvoice } from '../../pl-invoice';
import { ActivatedRoute } from '@angular/router';
import { BILLING_TYPE } from '../../pl-billing';
import { Component, OnInit } from '@angular/core';
import { PLTimesheetPreview } from '../../pl-timesheet';
import { AppStore } from '@root/src/app/appstore.model';
import { PLInvoiceService } from '../../pl-invoice.service';
import { PLTimesheetService } from '../../pl-timesheet.service';
import { map, concatMap, finalize, withLatestFrom, catchError } from 'rxjs/operators';
@Component({
    selector: 'pl-billing-preview-container',
    templateUrl: './pl-billing-preview-container.component.html',
    styleUrls: ['./pl-billing-preview-container.component.less'],
})
export class PLBillingPreviewContainerComponent implements OnInit {

    billing: PLInvoice | PLTimesheetPreview;
    billingType: string;

    isW2Provider: boolean;
    isBillingPreview = false;

    loading = true;

    constructor(
        private store$: Store<AppStore>,
        private plInvoiceSvc: PLInvoiceService,
        private activatedRoute: ActivatedRoute,
        private plTimesheetSvc: PLTimesheetService,
    ) { }

    ngOnInit() {
        this.init();
    }

    private init() {
        this.activatedRoute.url.pipe(
            map(params => this.getURLDataForBilling(params)),
            withLatestFrom(this.store$.select('currentUser')),
            concatMap(([urlData, user]) => this.getBillingDetail(urlData, user)),
            catchError(_ => of('error')), // TODO: create an error page in the billing details for this scenario.
            finalize(() => this.loading = false),
        ).subscribe(
            (billingDetail: PLInvoice | PLTimesheetPreview) => {
                this.billing = billingDetail;

                /**
                 * Billing details are available for any type of provider as long as they're not previews.
                 * Meaning that any type of provider can see any type of past billings.
                 * But if it's a preview, then w2 can only see timesheets and others can only see invoices.
                 */
                if (!this.isBillingPreview) {
                    this.billingType = this.isW2Provider ? BILLING_TYPE.Timesheet : BILLING_TYPE.Invoice;
                }

                this.loading = false;
            },
        );
    }

    /**
     * Function that helps the ActivatedRoute.url function.
     * Gets the type and id of the billing from the URL.
     *
     * @returns an object with the above information.
     */
    private getURLDataForBilling = (params: any) => {
        const billingProps = ['billingType', 'billingId'];
        const billingInfo = {
            billingId: '',
            billingType: '',
        };

        params.forEach((param: any, index: any) => {
            billingInfo[billingProps[index]] = param.path;
        });

        return billingInfo;
    }

    /**
     * Gets the billing details from the services of the invoices or the timesheets.
     *   If the urlData has ID, the get() method will be called from either service (timesheet or invoice).
     *   If the urlData has no ID; depending on if the provider is a W2:
     *     The preview of either the timesheet or the invoice will be called.
     *
     * isW2Provider and isBillingPreview help us to make decissions inside the actual subscriber.
     *
     * @param urlData The data gotten from getURLDataForBilling function.
     * @param user The user from this.store$.select('currentUser').
     * @returns an observable with the billing details of a preview or the a billing from timesheet or an invoice.
     */
    private getBillingDetail = (urlData: any, user: any) => {
        let billingService;
        this.isW2Provider = user.xProvider.isW2;

        if (urlData.billingId) {
            this.isBillingPreview = true;
            this.billingType = urlData.billingType === BILLING_TYPE.Invoice
                ? BILLING_TYPE.Invoice : BILLING_TYPE.Timesheet;

            billingService = urlData.billingType === BILLING_TYPE.Invoice
                ? this.plInvoiceSvc : this.plTimesheetSvc;
            billingService = billingService.get({ uuid: urlData.billingId, expand: 'summary' });
        } else {
            if (user.xProvider.isW2) {
                billingService = this.plTimesheetSvc.getPreview();
            } else {
                billingService = this.plInvoiceSvc.getPreview();
            }
        }

        return billingService;
    }

}
