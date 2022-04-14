import {
    ViewChild,
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    OnInit,
    OnDestroy,
    Output,
    EventEmitter,
} from '@angular/core';

import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';

import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';

import { AppStore } from '@app/appstore.model';
import { PLSetAppointment } from '@app/modules/schedule/store/schedule';
import { PLUtilService } from '@common/services';
import { PLInvoiceDocumentationService } from './pl-ida.service';

import { fadeInOnEnterAnimation } from 'angular-animations';

@Component({
    selector: 'pl-invoice-documentation-detail',
    templateUrl: './pl-ida-detail.component.html',
    styleUrls: ['./pl-ida-detail.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        fadeInOnEnterAnimation({ anchor: 'fadeIn', duration: 1000 }),
    ],
})

export class PLInvoiceDocumentationDetailComponent implements OnInit, OnDestroy {
    @ViewChild('detailTopElement') detailTopElement: any;

    @Output() readonly closeDocumentation: EventEmitter<any> = new EventEmitter();

    showingNote: String;
    state: any = {};
    checkChangesTimeout: any;
    dateTimeForm: FormGroup = new FormGroup({});
    deletingActivity: boolean;

    constructor(
        public BO: PLInvoiceDocumentationService,
        private router: Router,
        private store: Store<AppStore>,
        public util: PLUtilService,
        private cdr: ChangeDetectorRef,
        private toastr: ToastrService,
    ) { }

    ngOnInit() {
        this.showingNote = 'subjective';
        const fn = () => {
            this.checkChangesTimeout = setTimeout(() => {
                this.cdr.markForCheck();
                fn();
            }, 150);
        };
        fn();
    }

    getAppointmentTimeDisplay() {
        const dates = this.BO.getComputedAppointmentDates(this.item);
        const start = dates.start;
        const end = dates.end;
        const apptStart = this.BO.getLocalDate(start).format('dddd - MMM D, YYYY h:mma');
        const apptEnd = this.BO.getLocalDate(end).format('h:mma');
        const durationMins = moment(end).diff(moment(start), 'minutes');
        return `${apptStart} - ${apptEnd} (${durationMins} min)`;
    }

    getAreasOfConcernOpts(item: any) {
        if (item.areasOfConcernOpts && item.areasOfConcernOpts.length) {
            return item.areasOfConcernOpts;
        }
        return item.areasOfConcernOpts = item.areasOfConcernList.map((aoc: any) => {
            return {
                label: aoc.name,
                value: aoc.uuid,
            };
        });
    }

    getAssessmentsOpts(item: any) {
        if (item.assessmentsOpts && item.assessmentsOpts.length) {
            return item.assessmentsOpts;
        }

        return item.assessmentsOpts = [{ label: 'No formal assessment', value: '' }]
            .concat(item.assessmentsList.map((assessment: any) => ({
                label: assessment.long_name,
                value: assessment.uuid,
            })));
    }

    getLocationTrackingOpts() {
        return this.BO.data.__locationTrackingOpts;
    }

    getEvaluationStatusOpts() {
        return this.BO.data.__evalStatusOpts;
    }

    getActivityComponentOpts(): any[] {
        return this.item.activityComponentOpts || [];
    }

    getActivityDetailOpts() {
        return this.state.paActivityDetailOptions;
    }

    getAmendmentReasonOpts() {
        return this.BO.data.__amendmentReasonOpts;
    }

    getActivityStatusOpts() {
        return this.BO.data.__evalActivityStatusOpts;
    }

    getActivityComponentByUuid(activityUuid: String) {
        return this.BO.findActivityComponentByUuid(activityUuid);
    }

    getActivityDetail(activityUuid: String, detailUuid: String) {
        return this.BO.findActivityDetail(activityUuid, detailUuid);
    }

    getDocumentationDetailClasses(item: any) {
        return {
            signed: !this.BO.isEditable(item),
            isAmendable: this.BO.isAmendable(item),
            isAmendableNewEvent: this.BO.isAmendableNewEvent(item),
            isAmendablePastEvent: this.BO.isAmendablePastEvent(item),
            saving: this.BO.isSaving(),
            standalone: this.BO.isStandaloneAppointment(),
            isDirectService: this.BO.isDirectServiceAppointment(item),
            isEvaluationService: this.BO.isEvaluationAppointment(item),
            showAddServiceMessage: this.shouldShowAddServiceMessage(item),
            isEditDateTime: item.state.editingDateTime,
            visible: true,
        };
    }

    // event handler
    onClickSoapNote(whichNote: String) {
        this.showingNote = whichNote;
        setTimeout(() => {
            document.body.querySelector(`#soap_note_${whichNote} textarea`)['focus']();
        }, 100);
    }

    onClickAddActivityComponent(item: any) {
        this.state.isActiveAddActivityComponent = true;
    }

    onClickDeleteActivityComponent(item: any, activityUuid: string, listIndex: number) {
        if (this.deletingActivity) return;

        // remove unpersisted activity that was queued for save
        if (!activityUuid) {
            item.model.savedEvaluationActivities.splice(listIndex, 1);
            return;
        }
        const savedActivities = item.model.savedEvaluationActivities;
        const activityItem = savedActivities[listIndex];
        // toggle persisted activity queued for delete
        if (this.BO.isAmendable(item)) {
            if (activityItem.queuedForDelete) {
                delete activityItem.queuedForDelete;
            } else {
                activityItem.queuedForDelete = true;
            }
        } else {
            this.deletingActivity = true;
            this.BO.deleteEvaluationActivity(item, activityUuid,
                (res: any) => {
                    savedActivities.splice(listIndex, 1);
                    this.deletingActivity = false;
                },
                (err: any) => {
                    this.deletingActivity = false;
                }
            );
        }
        this.BO.logSelectedItem();
        this.util.reRender(activityItem);
    }

    onClickEditDateTime() {
        const A = this.item.appointment;
        const start = this.BO.getLocalDate(A.start);
        const end = this.BO.getLocalDate(A.end);
        this.BO.clearMappedApiErrorMessage();
        this.item.model.editableDateRange = { start, end };
        this.item.state.editingDateTime = true;
        this.BO.logSelectedItem('onClickEditDateTime');
    }

    onChangeDateRange($event: any) {
        this.item.model.startDate = $event.start;
        this.item.model.endDate = $event.end;
        this.BO.logSelectedItem('onChangeDateRange');
    }

    onClickSaveDateTime(item: any) {
        if (!this.dateTimeForm.valid
            || item.state.savingDateTime
            || item.state.invalidDateTimeOrder
            || item.state.invalidDateTimeDuration) {
            console.log('--- save date-time validation', { STATE: item.state });
            return;
        }

        item.state.savingDateTime = true;

        // This appointment was passed in from calendar and is a pre DST crossover adjusted value.
        const A = item.appointment;

        // These are locally obtained values (from user input) and require DST adjustment for save.
        const NEW_APPT = {
            ...A,
            start: item.model.startDate || item.model.editableDateRange.start,
            end: item.model.endDate || item.model.editableDateRange.end,
        };

        // this is needed because the values are locally sourced input values
        const dateValues = this.BO.getDSTAdjustedAppointmentDatesForSave(NEW_APPT);

        const APPT_TO_SAVE = {
            ...A,
            start: dateValues.start,
            end: dateValues.end,
        };

        const amendedPastEventDateTime = this.BO.hasAmendedDateTime(item);
        const amendedNewEventDateTime = this.BO.hasAmendedDateTimeForNewEvent(item);
        if (this.isAmendable(item) && (amendedPastEventDateTime || amendedNewEventDateTime)) {
            this.BO.addReasonForEditToSavePayload(item, APPT_TO_SAVE);
        }

        // save appt or event
        this.BO.saveDateTime(APPT_TO_SAVE, item).subscribe(
            (res: any) => {
                const appts = this.BO.getItemsInGroupAppointment(item);
                appts.forEach((_: any) => this.BO.updateLocalAppointmentDateTime(_, NEW_APPT));

                // update local appointment state when the response type is an appointment.
                // the response may be an event or appointment.
                // Only event has the property 'event_type'

                const isResponseTypeAppointment = !this.isEventObject(res);
                this.util.log2('appointment check', { res, isResponseTypeAppointment })

                if (isResponseTypeAppointment) {
                    // update the appointment from the response
                    // but do not overwrite the item.appointment.event object with the response.event uuid
                    const {event, ...resAppt} = res;
                    item.appointment = {...item.appointment, ...resAppt};
                } else {
                    item.appointment.event = res;
                    item.appointment.original_start = res.start;
                    item.appointment.original_end = res.end;
                    item.appointment.is_blacked_out = res.is_blacked_out;
                }

                if (this.BO.isAmendable(this.item)) {
                    this.BO.cloneAmendableDateTimeState(item);
                }

                this.onClickCancelDateTime();
                this.BO.setSelectedItem(item);
                this.BO.onSelectItem(true);
                this.BO.sortItems(item);

                this.store.dispatch(PLSetAppointment({ appointment: { ...item.appointment } }));

                this.util.log('UPDATED: appointment date-time...', { res, item });
                item.state.editingDateTime = false;
                item.state.savingDateTime = false;
                item.model.changeDateTimeSigned = false;
                item.model.amendmentReason = null;
                item.model.amendmentNotes = null;

                if (this.BO.isBlackoutDay(item)) {
                    this.toastr.warning(`This appointment conflicts with the school's Non-Service Dates.`, '⚠️ Warning - Changed Date Time', {
                        positionClass: 'toast-bottom-right',
                        enableHtml: true,
                    });
                } else {
                    this.toastr.success(`Changed Date Time`, '🎉 Success', {
                        positionClass: 'toast-bottom-right',
                    });
                }
                this.BO.logSelectedItem('saveDateTime success');

            },
            (err: any) => {
                this.BO.debugError('saveDateTime error', err);
                //const errors = this.BO.processErrors(item, err);
                //this.util.errorLog('save date time', errors);
                item.state.savingDateTime = false;
                item.model.changeDateTimeSigned = false;

                this.toastr.error(`Unable to change Date Time`, '❌ Failed', {
                    positionClass: 'toast-bottom-right',
                });
                this.BO.doneSavingWithError(item, err, APPT_TO_SAVE);
                console.log('--- mapped api error', this.BO.getMappedApiErrorMessage());
                this.BO.logSelectedItem('saveDateTime error');
            },
        );
    }

    onClickCancelDateTime() {
        if (this.BO.isAmendable(this.item)) {
            this.item.model.startDate = this.item.clone.model.startDate;
            this.item.model.endDate = this.item.clone.model.endDate;
        }
        this.BO.clearMappedApiErrorMessage();
        this.item.state.editingDateTime = false;
        this.item.model.changeDateTimeSigned = false;
    }

    onClickSignedCheckbox(item: any) {
        if (item.record && item.record.signed) {
            item.state.signedCheckboxDirty = true;
        }
        this.BO.logSelectedItem();
    }

    onChangeClientService($event: any) {
        this.BO.onChangeClientService($event);
    }

    onChangeActivityComponent() {
        this.item.model.selectedActivityDetail = null;
        this.setActivityDetailOptions();
    }

    onClickCloseButton() {
        if (this.BO.isStandaloneAppointment()) {
            this.closeDocumentation.emit();
        }
    }

    // handle tab and shift tab
    handleNotesTab(/* destructure */{ event }: any, nextField: string, prevField: string) {
        if (localStorage.getItem('PL_DEBUG_EVENT')) {
            this.util.log('=== event', { event, nextField, prevField });
        }
        if (event.shiftKey) {
            if (prevField) {
                event.preventDefault();
                this.onClickSoapNote(prevField);
            }
        } else {
            if (nextField) {
                event.preventDefault();
                if (nextField === 'general') {
                    document.body.querySelector(`#general-notes textarea`)['focus']();

                } else {
                    this.onClickSoapNote(nextField);
                }
            }
        }
    }

    onEvalUploadFileExtensionValidation($event: any) {
        const selectedFile = $event.filename;
        const message = selectedFile ? `<br/><br/>Selected file: <i>${$event.filename}</i>` : '';
        if (selectedFile) {
            this.toastr.error(
                `
                    ⚠️ Only ${$event.allowedExtensions} files are allowed.
                    ${message}
                `,
                'Evaluation Documentation',
                {
                    positionClass: 'toast-bottom-right',
                    timeOut: 5000,
                    enableHtml: true,
                },
            );
        }
    }

    setActivityDetailOptions() {
        const activityUuid = this.selectedActivityComponent;
        if (!activityUuid) return;
        const activity = this.getActivityComponentByUuid(activityUuid);

        const activityDetails = activity.details_expanded;
        this.state.activityDetailListDisabled = activityDetails.length === 0;

        if (activityDetails.length) {
            this.state.paActivityDetailOptions = activityDetails
                .map((item: any) => ({ label: item.name, value: item.uuid }));
            if (activityDetails.length === 1) {
                setTimeout(() => {
                    this.item.model.selectedActivityDetail = activityDetails[0].uuid;
                }, 100);
            }
        } else {
            this.state.paActivityDetailOptions = null;
        }
    }

    // navigation
    viewClient(client: any) {
        this.BO.debug(client);
        this.router.navigate(['/client', client.uuid, 'services']);
        this.onClickCloseButton();
    }

    ngAfterViewInit() {
        this.BO.setOnSelectAppointmentCallback(() => {
            if (this.BO.isStandaloneAppointment()) {
                const headerElement = document.getElementById('invoice-student-header');
                if (headerElement) {
                    headerElement.scrollIntoView(true);
                }
            } else {
                this.detailTopElement.nativeElement.scrollIntoView(true);
            }
        });
        this.BO.setOnProcessAPIErrors(() => {
            setTimeout(() => {
                try {
                    this.detailTopElement.nativeElement.scrollIntoView({ behavior: 'smooth' });
                } catch (e) { }
            }, 200);
        });
    }

    // booleans
    isActiveAddActivityComponent(item: any) {
        return this.state.isActiveAddActivityComponent;
    }

    isEnabledSaveActivityButton(item: any) {
        return item.model.selectedActivityComponent &&
            (!this.getActivityDetailOpts() || item.model.selectedActivityDetail);
    }

    // infer object type as a calendar Event
    isEventObject(obj: any) {
        return obj.start && obj.end && !!obj.event_type;
    }

    // infer object type as a calendar Appointment
    isAppointmentObject(obj: any) {
        return obj.start && obj.end && !!obj.event;
    }

    isAmendable(item: any) {
        return this.BO.isAmendable(item);
    }

    hasComponentOptsForService() {
        return this.getActivityComponentOpts().length;
    }

    shouldShowRegularAssessments() {
        return this.BO.isSeparatePsychEvals() || !this.hasComponentOptsForService();
    }

    shouldShowComponentAssessments() {
        return this.BO.isEvaluationAppointment(this.item) && this.hasComponentOptsForService();
    }

    shouldShowAreasOfConcern(item: any) {
        return this.BO.isEvaluationAppointment(item)
            && this.BO.hasSelectedClientService(item)
            && !this.BO.isPsychAssessmentAppointment(item)
            && !!this.BO.getAreasOfConcernList(item);
    }

    shouldShowUpload(item: any) {
        return this.BO.isEvaluationAppointment(item)
            && this.BO.hasSelectedClientService(item)
            && this.BO.canUploadEvaluationDocument(item);
    }

    shouldShowAddServiceMessage(item: any) {
        return !this.BO.getDataParsingErrors(item)
            && this.BO.isClientAppointment(item)
            && !this.BO.hasSelectedBillingCode(item)
            && !this.BO.hasClientServices(item)
            && this.BO.isClientServiceRequired(item);
    }

    shouldShowEvaluationUploadValidationMessage(item: any) {
        return this.BO.isEvaluationAppointment(item)
            && this.BO.isEvaluationModelStatusComplete(item)
            && !this.BO.hasCompletedEvaluation(item)
            && !this.BO.hasSelectedFileUpload(item);
    }

    shouldShowEvaluationActivityNotDoneValidationMessage(item: any) {
        return this.BO.someEvaluationActivitiesRequireDoneStatus(item);
    }

    canChangeDateTime(item: any) {
        if (this.BO.cannotChangeDocumentation(item)) {
            return false;
        }
        return !item.state.editingDateTime
            && !item.model.signed
            && (this.BO.isAppointmentEditable(item) || this.BO.isAmendable(item))
    }

    isEditingDateTime(item: any) {
        return item.state.editingDateTime;
    }

    private save(item: any, exitAfterSave: boolean, stayOnSelectedItem: boolean) {
        const errors: string[] = item.state.errors = [];
        item.state.savingErrorMessage = '';

        // perform error checks
        if (this.BO.hasClientServices(item) && !item.model.clientService) {
            errors.push('Client Service');
        }
        if (this.BO.isLocationTrackingRequired(item) && !item.model.trackingType) {
            errors.push('Location tracking type');
        }
        if (this.BO.requiresSoapNotes(item) && this.BO.hasSoapNotes(item)) {
            errors.push('At least one S/O/A/P note');
        }

        // General notes requirement exception for LeadClinicians
        const generalNotesCanBeEmpty = this.BO.isUserLeadClinician()
            && this.BO.isLeadBillingCategory(this.item.eBillingCode);

        if (!this.BO.requiresSoapNotes(item) && !generalNotesCanBeEmpty && !item.model.notes.notes) {
            errors.push('General notes');
        }
        if (this.shouldShowComponentAssessments()
            && this.BO.hasMissingAssessmentActivity(item)
            && this.BO.requiresActivityToSave(item)) {
            errors.push('At least one Assessment Component');
        }
        if (this.BO.isEvaluationReportRequiredAndMissing(item)) {
            errors.push('Final eval report upload');
        }
        if (this.BO.isEvaluationAssessmentSelectionRequiredAndMissing(item)) {
            errors.push('At least one assessment');
        }

        // Amendments
        if (this.BO.isAmendable(item) && (this.BO.hasAmendments(item) || !this.BO.hasRecord(item)) && !item.model.amendmentReason) {
            errors.push('Amendment Reason');
        }

        if (errors.length <= 0) {
            const afterSaveFn = () => {
                item.state.mappedApiErrorMessage = undefined;
                const savedSigned = item.record.signed ? 'Signed' : 'Saved';
                let successMessage = `${savedSigned} Documentation`;
                if (this.isAmendable(item)) {
                    successMessage = `Amended Documentation`;
                }
                this.toastr.success(successMessage, '🎉 Success', {
                    positionClass: 'toast-bottom-right',
                });
                if (exitAfterSave) {
                    this.closeDocumentation.emit();
                    return 'EXIT';
                }
            };
            this.BO.saveItemDocumentation(item, afterSaveFn, stayOnSelectedItem);
            this.exitActivityComponent();
            this.deletingActivity = false;
        } else {
            if (errors.length === 1) {
                item.state.savingErrorMessage = errors[0] + ' is required.';
            } else {
                errors.forEach((e: any, i: any) => {
                    if (i === errors.length - 1) {
                        item.state.savingErrorMessage += 'and ' + e;
                    } else {
                        item.state.savingErrorMessage += e + ', ';
                    }
                });
                item.state.savingErrorMessage += ' are required.';
            }
            this.deletingActivity = false;
        }
    }

    saveAndContinue(item: any) {
        this.save(item, false, false);
    }

    saveAndExit(item: any) {
        this.save(item, true, true);
    }

    saveAndRemain(item: any) {
        this.save(item, false, true);
    }

    onClickSaveActivityComponent(item: any) {
        if (this.BO.isAmendable(item)) {
            const COMPONENT_UUID = item.model.selectedActivityComponent;
            const ACTIVITY_DETAIL_UUID = item.model.selectedActivityDetail;
            const obj = { activity: COMPONENT_UUID, activity_detail: ACTIVITY_DETAIL_UUID };
            this.updateEvalActivityModelState(item, obj);
            this.BO.logSelectedItem();
        } else {
            this.BO.saveEvaluationActivity(item, (result: any) => {
                this.updateEvalActivityModelState(item, result);
            });
        }
        this.exitActivityComponent();
    }

    /**
     * Updates local model state
     * @param item
     * @param resultOrSyntheticObj - An API response value OR a synthetic object that has no uuid.
     */
    updateEvalActivityModelState(item: any, resultOrSyntheticObj: any) {
        // update the saved list with the newly added activity info
        item.model.savedEvaluationActivities = [
            {
                activity: this.BO.findActivityComponentByUuid(resultOrSyntheticObj.activity),
                activityDetail: this.BO.findActivityDetail(resultOrSyntheticObj.activity, resultOrSyntheticObj.activity_detail),
                evalActivityUuid: resultOrSyntheticObj.uuid,
                savedEvalActivity: resultOrSyntheticObj,
            },
            /* @ts-ignore */
            ...(item.model.savedEvaluationActivities || []),
        ];
    }

    /**
     * Display saved activities for the selected service
     * @deprecated - this shouldn't be needed. saved activities state is fetched/updated on client service change
     * @param item
     * @returns
     */
    getSavedEvaluationActivitiesFiltered(item: any): any[] {
        const comps = item.model.savedEvaluationActivities;
        const selectedService = item.model.oClientService && item.model.oClientService.service;
        if (!comps || !selectedService) {
            return [];
        }
        const returnVal: any[] = [];
        comps.forEach((_: any) => {
            if (_.activity.service === selectedService.id) {
                returnVal.push(_);
            };
        });
        return returnVal;
    }

    exitActivityComponent() {
        this.state.isActiveAddActivityComponent = false;
        this.item.model.selectedActivityComponent = null;
        this.item.model.selectedActivityDetail = null;
    }

    copyErrorInfoToClipboard() {
        this.util.copyToClipboard('#errorDataSupport');
    }

    canShowSaveAndContinueButton() {
        // IDA mode: always show
        // from calendar: show if not on the last student
        return !this.BO.isSaving() && (!this.BO.isStandaloneAppointment() || !this.BO.hasSelectedLastItem());
    }

    // NOTE: jh.6.1.2021: editing activities disabled for amendments
    canShowAddActivityButton(item: any) {
        return !this.BO.isAmendable(item) && !this.isActiveAddActivityComponent(item);
    }

    canShowDeleteActivityButton(item: any, activityItem: any) {
        const submittedDate = activityItem.savedEvalActivity && activityItem.savedEvalActivity.invoice_submitted_on;
        return !this.BO.isAmendable(item) && this.BO.isEditable(item) && !submittedDate;
    }

    canShowActivityStatusOpts(item: any, activityItem: any) {
        const submittedDate = activityItem.savedEvalActivity && activityItem.savedEvalActivity.invoice_submitted_on;
        return !this.BO.isAmendable(item) && this.BO.isEditable(item) && !submittedDate;
    }

    canShowActivityCompletedDatePicker(item: any, activityItem: any) {
        const submittedDate = activityItem.savedEvalActivity && activityItem.savedEvalActivity.invoice_submitted_on;
        return !this.BO.isAmendable(item) && this.BO.isEditable(item) && !submittedDate;
    }

    canShowReadonlyStatus(item: any, activityItem: any) {
        return !this.canShowActivityStatusOpts(item, activityItem) && !activityItem.savedEvalActivity.invoice_submitted_on;
    }

    getMaxActivityCompletedDateForPicker() {
        return this.util.formatUserDateSystem(moment());
    }

    getActivityInvoiceSubmittedDate(activityItem: any) {
        const submittedDate = activityItem.savedEvalActivity && activityItem.savedEvalActivity.invoice_submitted_on;
        if (!submittedDate) return;
        return this.util.getLocalizedDateMoment(submittedDate, this.BO.providerTimezone).format('M/DD/YYYY');
    }

    getActivityStatusDisplayValue(activityItem: any) {
        return this.BO.data.__evalActivityStatusOpts.find((_: any) => _.value === activityItem.savedEvalActivity.status).label;
    }

    isValidData(item: any) {
        return !this.BO.getDataParsingErrors(item) &&
            (this.BO.hasSelectedBillingCode(item) || (this.BO.hasRecord(item) && item.record.client_service));
    }

    isValidDateTimeData(item: any) {
        return !item.model.datetimeRangeErrors.length;
    }

    isDisabledSignoff(item: any) {
        const lockedNotAmendable = this.BO.lockedNotAmendable(item);
        const pastEventMissingAmendments = this.BO.isPastEventMissingAmendments(item);
        const newEventMissingAmendments = this.BO.isNewEventMissingAmendments(item);
        const invalidData = !this.isValidData(item);

        item.state.isDisabledSignoff = {lockedNotAmendable, pastEventMissingAmendments, newEventMissingAmendments, invalidData};
        return lockedNotAmendable || pastEventMissingAmendments || newEventMissingAmendments || invalidData;
    }

    isDisabledSignoffDateTime(item: any) {
        const lockedNotAmendable = this.BO.lockedNotAmendable(item);
        const invalidData = !this.isValidDateTimeData(item);
        const pastEventMissingAmendments = this.BO.isPastEventMissingDateTimeAmendments(item);
        const newEventMissingAmendments = this.BO.isNewEventMissingDateTimeAmendments(item);

        item.state.isDisabledSignoffDateTime = {lockedNotAmendable, pastEventMissingAmendments, newEventMissingAmendments, invalidData};
        return lockedNotAmendable || pastEventMissingAmendments || newEventMissingAmendments || invalidData;
    }

    isDisabledSave(item: any) {
        if (this.isAmendable(item) && this.BO.hasAmendmentsForNewEvent(item) && item.model.signed) {
            return false;
        };
        return !this.BO.hasSelectedBillingCode(item)
            || !!this.BO.getDataParsingErrors(item)
            || (this.BO.isAmendable(item) && (!this.BO.hasAmendments(item) || !item.model.signed))
            || (this.BO.isAmendable(item) && !item.model.amendmentReason)
            || (!this.BO.isAmendable(item) && item.record && item.record.locked)
            || (!this.BO.isAmendable(item) && this.BO.someEvaluationActivitiesRequireDoneStatus(item));
    }

    isDisabledSaveDateTime(item: any) {
        const amendableNotSigned = this.BO.isAmendable(item) && !item.model.changeDateTimeSigned;
        return amendableNotSigned || !this.isValidDateTimeData(item);
    }

    isDisabledAddActivityButton(){
        return this.BO.isEvaluationLocked(this.item)
            || this.BO.isEvaluationModelStatusComplete(this.item)
            || this.item.model.signed
    }

    ngOnDestroy() {
        if (this.checkChangesTimeout) {
            clearTimeout(this.checkChangesTimeout);
        }
    }

    // class getters

    get item() {
        return this.BO.selectedAppointment;
    }

    get selectedActivityComponent() {
        return this.item.model.selectedActivityComponent;
    }

    get selectedActivityDetail() {
        return this.item.model.selectedActivityDetail;
    }
}
