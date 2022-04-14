import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { PLInvoiceDocumentationService } from './pl-ida.service';
import { PLUtilService } from '@common/services';
import * as moment from 'moment';
import { fadeInOnEnterAnimation } from 'angular-animations';

@Component({
    selector: 'pl-invoice-documentation-readonly',
    styleUrls: ['./pl-ida-readonly.component.less'],
    templateUrl: './pl-ida-readonly.component.html',
    animations: [
        fadeInOnEnterAnimation({ anchor: 'fadeIn', duration: 1000 }),
    ],
})

export class PLInvoiceDocumentationReadOnlyComponent implements OnInit {
    @Output() readonly closeDocumentation: EventEmitter<any> = new EventEmitter();

    initialized: boolean;
    evalActivities: any[];
    areasOfConcern: any[];
    trackingType: string;
    NO_NOTES = '-- No Notes --';

    constructor(
        public BO: PLInvoiceDocumentationService,
        public util: PLUtilService,
    ) { }

    ngOnInit() {
        this.initialized = true;
        if (this.BO.isEvaluationAppointment(this.selectedAppointment) && this.selectedAppointment.model.areasOfConcern) {
            this.areasOfConcern = this.selectedAppointment.model.areasOfConcern
                .map((id: string) => this.selectedAppointment.areasOfConcernList.find((aoc: any) => aoc.uuid === id).name);
        }
        if (this.BO.isLocationTrackingRequired(this.selectedAppointment)) {
            this.trackingType = this.BO.data.__locationTrackingOpts.find((ttOpt: any) => ttOpt.value === this.selectedAppointment.model.trackingType).label;
        }
    }

    onClickCloseButton() {
        this.closeDocumentation.emit();
    }

    getAppointmentTimeDisplay() {
        try {
            const dates = this.BO.getComputedAppointmentDates(this.selectedAppointment);
            const start = dates.start;
            const end = dates.end;
            const apptStart = this.BO.getLocalDate(start).format('dddd - MMM D, YYYY h:mma');
            const apptEnd = this.BO.getLocalDate(end).format('h:mma');
            const durationMins = moment(end).diff(moment(start), 'minutes');

            return `${apptStart} - ${apptEnd} (${durationMins} min)`;
        } catch (error) {
            return '-- No Time To Display --';
        }
    }

    getBillingCodeName(): string {
        const billingCode = this.selectedAppointment.billingCode;
        if (billingCode) {
            return billingCode.name;
        }
        return '-- No Billing Code Name --';
    }

    getServiceName() {
        const clientService = this.selectedAppointment.clientService;
        if (clientService) {
            return clientService.service.name;
        }
        return '-- No Service Name --';
    }

    getClientName(): string {
        try {
            if (this.isClientAppointment()) {
                return `${this.selectedAppointment.client.first_name} ${this.selectedAppointment.client.last_name}`;
            }
            if (
                this.BO.isLocationAppointment(this.selectedAppointment) ||
                this.BO.isOtherIndirectAppointment(this.selectedAppointment)
            ) {
                return `${this.selectedAppointment.eBillingCode.name}`;
            }
        } catch (error) {
            return '-- No Client Name Nor Billing Code --'
        }
    }

    getGeneralNotes(): string {
        try {
            return this.selectedAppointment.model.notes.notes ? this.selectedAppointment.model.notes.notes : '';
        } catch (error) {
            return '';
        }
    }

    getLocationName() {
        try {
            return this.selectedAppointment.location.name;
        } catch (error) {
            return '-- No Location Name --';
        }
    }

    getSOAPNotes() {
        const NOTES = this.selectedAppointment.model.notes || {};
        return (({ notes, ...r } = NOTES) => r)();
    }

    getEvaluationActivities() {
        if (!this.BO.isEvaluationAppointment(this.selectedAppointment)) {
            return [];
        }
        return this.selectedAppointment.model.savedEvaluationActivities;
    }

    getActivityInvoiceSubmittedDate(activityItem: any) {
        const submittedDate = activityItem.savedEvalActivity && activityItem.savedEvalActivity.invoice_submitted_on;
        if (!submittedDate) return;
        return this.util.getLocalizedDateMoment(submittedDate, this.BO.providerTimezone).format('M/DD/YYYY');
    }

    getAcvitityStatusDisplayValue(activityItem: any) {
        return this.BO.data.__evalActivityStatusOpts.find((_: any) => _.value === activityItem.savedEvalActivity.status).label;
    }

    getActivityDateCompletedDisplayValue(activityItem: any) {
        return this.BO.getActivityDateCompletedDisplayValue(activityItem);
    }

    getAreasOfConcern() {
        if (!this.BO.isEvaluationAppointment(this.selectedAppointment)) {
            return [];
        }
        return this.areasOfConcern;
    }

    getEvaluationStatus() {
        return (this.BO.getEvaluationStatusDisplayValue(this.selectedAppointment));
    }

    isClientAppointment(): boolean {
        return this.BO.isClientAppointment(this.selectedAppointment);
    }

    isTheDocumentSigned() {
        return this.BO.isSigned(this.selectedAppointment);
    }

    get hasSOAPNotes() {
        return this.soapNotes.subjective || this.soapNotes.objective || this.soapNotes.assessment || this.soapNotes.plan;
    }

    get selectedAppointment() {
        return this.BO.selectedAppointment;
    }

    get requiresSOAPNotes() {
        return this.BO.requiresSoapNotes(this.selectedAppointment)
    }

    get soapNotes() {
        return this.getSOAPNotes();
    }

    get generalNotes() {
        return this.getGeneralNotes();
    }
}
