import {
    Component,
    Input,
} from '@angular/core';
import * as moment from 'moment';
import { User } from '../../../user/user.model';
import { PLBillingErrors } from '../../../billing/pl-billing';

@Component({
    selector: 'pl-ida-box',
    templateUrl: './pl-ida-box.component.html',
    styleUrls: ['./pl-ida-box.component.less'],
})
/**
 * TODO: are there any other types of users that use this different to 1099 or W2?
 * There are two types of providers: 1099 and W2.
 * Both of 'em handle different property names for their information.
 * This class takes into account the above.
 */
export class PLIDABoxComponent {

    @Input() user: User;
    @Input() idaData: any;
    @Input() viewOnly: boolean;
    @Input() isW2Provider: boolean;

    constructor() { }

    get templateDisplayBillingButton() {
        const displayButton = this.isW2Provider
            ? (!(this.checkForTimesheetErrors().status !== 'valid' || this.isTimesheetSubmitted()) && !false)
            : (!(this.idaData.incompleteEventsTotalCount || this.idaData.isInvoiceSubmitted)
                && !this.idaData.incompleteEventsPastCount);
        return displayButton;
    }

    get templateIncompletedPastEvents() {
        const numberOfEvents = this.isW2Provider
            ? this.checkForTimesheetErrors().appointmentErrorCount
            : this.idaData.incompleteEventsPastCount;
        return numberOfEvents;
    }

    get templateIncompletedTotalEvents() {
        const numberOfEvents = this.isW2Provider
            ? this.checkForTimesheetErrors().appointmentErrorCount : this.idaData.incompleteEventsTotalCount;
        return numberOfEvents;
    }

    get templateIsBillingPeriodOver() {
        const isOver = this.isW2Provider ? this.isTimesheetPeriodOver() : this.idaData.isBillingPeriodOver;
        return isOver;
    }

    get templateIsBillingSubmitted() {
        const isSubmitted = this.isW2Provider ? this.isTimesheetSubmitted() : this.idaData.isInvoiceSubmitted;
        return isSubmitted;
    }

    get templateIDAClass() {
        const dangerClass = this.isW2Provider
            ? (!this.isTimesheetSubmitted() && this.isTimesheetPeriodOver())
            : (!this.idaData.isInvoiceSubmitted && this.idaData.isBillingPeriodOver);
        return dangerClass ? 'danger' : 'info';
    }

    //#region Privates

    private checkForTimesheetErrors() {
        const result = {
            status: 'valid',
            noRecords: false,
            appointmentErrorCount: 0,
        };
        const errors: PLBillingErrors = this.idaData.errors;

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

    private isTimesheetPeriodOver() {
        return moment().diff(moment(this.idaData.work_period_expanded.end_date), 'days') > 0;
    }

    private isTimesheetSubmitted() {
        return this.idaData.status !== 'draft';
    }

    //#endregion

}
