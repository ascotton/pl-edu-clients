import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { PLUtilService, PLComponentStateInterface,
  PLEventMessageBus, PLEventStream, PLMessageStream,
} from '@common/services';
import { PLClientIEPGoalsService, PLIEPContext, IEPFormFields } from '../pl-client-iep-goals.service';
import { PLConfirmDialogService } from '@root/index';

import * as moment from 'moment';

@Component({
  selector: 'pl-client-iep-form',
  templateUrl: './pl-client-iep-form.component.html',
  styleUrls: ['./pl-client-iep-form.component.less'],
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({ height: '100%', opacity: 0 }),
          animate('50ms', style({ height: '100%', opacity: 1 }))
        ]),
      ]
    )
  ],
})

export class PLClientIEPFormComponent implements OnInit, OnDestroy {
  @Input() activeIep: any;
  @Input() futureIep: any;
  @Input() completedIep: any;
  @Input() editIep: any;
  @Input() client: any;

  public _state: PLComponentStateInterface;
  private classname = 'PLClientIEPFormComponent';
  private iepGlobalStream: PLMessageStream;

  constructor(
    public util: PLUtilService,
    public service: PLClientIEPGoalsService,
    private messageBus: PLEventMessageBus,
    private plConfirm: PLConfirmDialogService,
  ) {}

  ngOnInit() {
    this._state = this.util.initComponent({
      name: this.classname,
      fn: (state, done) => {
        state.model.data.typesSelectOpts = this.service.getTypeOpts();
        state.model.data.activeIep = this.activeIep;
        state.model.data.futureIep = this.futureIep;
        state.model.data.completedIep = this.completedIep;
        state.model.data.editIep = this.editIep;
        state.client = this.client;
        state.model.clientId = this.client.uuid;
        const yearMin = moment().subtract(14, 'year').year();
        const yearMax = moment().add(3, 'year').year();
        state.model.data.calendarMin2 = moment([yearMin, 0, 1]).format('YYYY-MM-DD');
        state.model.data.calendarMin3 = moment([yearMin, 0, 1]).format('YYYY-MM-DD');
        state.model.data.calendarMax2 = moment([yearMax, 11, 31]).format('YYYY-MM-DD');
        state.model.data.calendarMax3 = moment([yearMax, 11, 31]).format('YYYY-MM-DD');
        state.saving = false;
        state.currentYear = moment().year().toString();

        if (this.isNewIep()) {
          state.model.type = PLClientIEPGoalsService.IEP_TYPE_IEP;
        } else {
          state.model.type = this.editIep.type;
          state.model.startDate = this.service.getDateNormalized(this.editIep.startDate).dateString;
          state.model.nextAnnualIepDate = this.service.getDateNormalized(this.editIep.nextAnnualIepDate).dateString;
          state.model.lastTriEvalDate = this.service.getDateNormalized(this.editIep.prevEvaluationDate).dateString;
          state.model.nextTriEvalDate = this.service.getDateNormalized(this.editIep.nextEvaluationDate).dateString;
        }
        this._registerStreams(state);
        done();
      }
    });
  }

  ngOnDestroy() {
    this.util.destroyComponent(this._state);
  }

  // --------------------------
  // public methods
  // --------------------------
  onClickSave() {
    if (this._state.saving) {
      return;
    }
    const vals = this.validateFormSave();
    if (!vals.isValid) {
      this.util.debugLog('form validation failed', vals, this._state);
      return;
    } else {
      this.util.debugLog('form validation passed', vals, this._state);
    }
    this._state.saving = true;
    // ---- SAVE NEW IEP ----
    if (this.isNewIep()) {
      // IEP TODO: validate date constraints
      const status = this.getActiveFutureStatus();
      this.service.saveNewIEP(this._state, status, (iepRes: any) => {
        this.util.debugLog(`create new (${status}) IEP`, iepRes, this._state);
        const iepId = iepRes.createClientIep.clientIep.id;
        const serviceTypeId = this._state.currentUser.xProvider.serviceType.uuid;
        const iep = iepRes.createClientIep && iepRes.createClientIep.clientIep;
        const iepErrors = iepRes.createClientIep && iepRes.createClientIep.errors;
        if (iepErrors) {
          this.util.errorLog(`createClientIep errors`, {iepRes}, this._state);
          this.iepGlobalStream.send({context: PLIEPContext.ADD_IEP_CANCELED, data: {errors: iepErrors}});
        }
        this.service.createNewServiceArea(iepId, serviceTypeId, this._state, ((saRes: any) => {
          this._state.saving = false;
          this.util.debugLog('create new ServiceArea', saRes, this._state);
          const serviceArea = saRes.createServiceArea && saRes.createServiceArea.serviceArea;
          const saErrors = saRes.createServiceArea && saRes.createServiceArea.errors;
          if (saErrors) {
            this.util.errorLog(`createServiceArea errors`, {iepRes, saRes}, this._state);
            this.iepGlobalStream.send({ context: PLIEPContext.ADD_IEP_CANCELED, data: { errors: iepErrors }});
          } else {
            this.iepGlobalStream.send({context: PLIEPContext.ADD_IEP_SAVED, data: { iep, serviceArea }});
          }
        }));
      });
    }
    // ---- SAVE EDITED IEP ----
    else {
      // change FUTURE -> ACTIVE if (start <= today)
      if (!this.activeIep && this.futureIep) {
        const today = this.service.getTodayNormalized();
        const start = this.service.getDateNormalized(this._state.model.startDate);
        if (start.date.diff(today.date, 'days') <= 0) {
          this.editIep.status = PLClientIEPGoalsService.IEP_STATUS_ACTIVE;
        }
      }
      // change ACTIVE -> FUTURE if (start > today)
      else if (this.activeIep && !this.futureIep) {
        const today = this.service.getTodayNormalized();
        const start = this.service.getDateNormalized(this._state.model.startDate);
        if (start.date.diff(today.date, 'days') > 0) {
          this.editIep.status = PLClientIEPGoalsService.IEP_STATUS_FUTURE;
        }
      }

      this.service.updateIep(this.editIep, this._state, (iepRes: any) => {
        this._state.saving = false;
        this.util.debugLog(`edit (${this.editIep.status}) IEP`, iepRes, this._state);
        const iepErrors = iepRes.updateClientIep.errors;
        const iepWithRes = Object.assign(this.editIep, iepRes.updateClientIep.clientIep);
        if (iepErrors) {
          this.util.errorLog(`edit IEP errors`, { iepWithRes }, this._state);
          this.iepGlobalStream.send({ context: PLIEPContext.EDIT_IEP, data: {end: 1, errors: iepErrors }});
        } else {
          this.iepGlobalStream.send({ context: PLIEPContext.EDIT_IEP, data: { end: 1, iep: iepWithRes} });
        }
      });
    }
  }

  onClickCancel() {
    if (this.isNewIep()) {
      this.iepGlobalStream.send({context: PLIEPContext.ADD_IEP_CANCELED});
    } else if (this.isEditIep()) {
      this.iepGlobalStream.send({ context: PLIEPContext.EDIT_IEP, data: {end: true, cancel: true} });
    }
  }

  onClickDelete() {
    const serviceAreas = this.editIep.serviceAreas;
    let goalsCount = 0;
    serviceAreas.forEach((sa: any) => sa.goals.forEach(() => goalsCount++));
    this.plConfirm.show({
      header: `Delete ${this.service.getStatusDisplayName(this.editIep)} IEP/Progress Tracker`,
      content: `
        <div style="padding-bottom:12px;">
          There are <b>${serviceAreas.length} Service Areas</b> and a total of <b>${goalsCount} Goals</b> in this IEP/Progress Tracker.
          </div>
        <div>
          Are you sure you want to delete it?
        </div>
      `,
      primaryLabel: `YES - Delete this ${this.service.getStatusDisplayName(this.editIep)} IEP/Progress Tracker`, secondaryLabel: 'Cancel',
      primaryCallback: () => {
        if (this._state.saving) {
          return false;
        }
        this._state.saving = true;
        this.service.deleteIep(this.editIep.id, this._state, (res: any) => {
          this._state.saving = false;
          if (this.editIep) {
            this.iepGlobalStream.send({ context: PLIEPContext.EDIT_IEP, data: {end: 1, delete: 1}});
          } else {
            this.iepGlobalStream.send({ context: PLIEPContext.RELOAD_IEPS });
          }
        });
        this.plConfirm.hide();
      },
      secondaryCallback: () => {},
      closeCallback: () => {},
    });
  }

  canDeleteIep() {
    return this.editIep && this.service.canDeleteIep(this.editIep);
  }

  validateFormSave() {
    return this.service.validateIepForm(this._state, true);
  }

  validateForm() {
    return this.service.validateIepForm(this._state);
  }

  getValidationMessageStart() {
    return this.service.getValidationMessage(IEPFormFields.START, this._state);
  }

  getValidationMessageNext() {
    return this.service.getValidationMessage(IEPFormFields.NEXT, this._state);
  }

  getValidationMessagePrevTri() {
    return this.service.getValidationMessage(IEPFormFields.PREV_TRI, this._state);
  }

  getValidationMessageNextTri() {
    return this.service.getValidationMessage(IEPFormFields.NEXT_TRI, this._state);
  }

  // in the context of a new IEP, a user can only make a new Active or Future IEP
  // A future IEP is one which has a start date in the future, so an Active IEP will be
  // defined as one which has a start date in the NOT in the future.
  isNewIepTypeFuture() {
    const startDate = this._state.model.startDate;
    const start = startDate && new Date(startDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    return startDate && start.getTime() > today.getTime();
  }

  isAfterActiveIep() {
    if (this.activeIep) {
      const activeEndDate = this.activeIep.nextAnnualIepDate;
      const activeEnd = activeEndDate && new Date(activeEndDate);

      const startDate = this._state.model.startDate;
      const start = startDate && new Date(startDate);
      return startDate && start.getTime() > activeEnd.getTime();
    }
  }

  // Active | Future
  getActiveFutureLabel() {
    if (this.isEditIep()) {
      return this.editIep.status === PLClientIEPGoalsService.IEP_STATUS_ACTIVE ? 'Active' : 'Future';
    }
    else if (this.activeIep) {
      return 'Future';
    } else if (!this.getStartDate()) {
      return '';
    } else {
      return this.isNewIepTypeFuture() ? 'Future' : 'Active';
    }
  }

  // New | Edit
  getNewEditLabel() {
    return this.editIep ? 'EDIT' : 'NEW';
  }

  // ACTIVE | FUTURE
  getActiveFutureStatus() {
    if (this.activeIep) {
      return PLClientIEPGoalsService.IEP_STATUS_FUTURE;
    } else {
      return this.isNewIepTypeFuture() ? PLClientIEPGoalsService.IEP_STATUS_FUTURE
        : PLClientIEPGoalsService.IEP_STATUS_ACTIVE;
    }
  }

  getStartDate() {
    return this._state.model.startDate;
  }

  isIepActive() {
    return !this.isNewIepTypeFuture();
  }

  private _registerStreams(state: PLComponentStateInterface) {
    this.iepGlobalStream = this.messageBus.initStream(PLEventStream.IEP_GLOBAL_STREAM, state);
  }

  isEditIep() {
    return this.editIep;
  }

  isNewIep() {
    return !this.isEditIep();
  }

  canClickSave() {
    return this._state.model.startDate && this._state.model.nextAnnualIepDate
      && this._state.model.lastTriEvalDate && this._state.model.nextTriEvalDate;
  }

  isTypeIep() {
    return this.service.isTypeIep(this._state.model);
  }

  setFieldsForType() {
    const isTypeIep = this.isTypeIep();

    // use bogus date placeholders for MTSS/RTI
    this._state.model.lastTriEvalDate = (isTypeIep) ? "" : "1900-01-01";
    this._state.model.nextTriEvalDate = (isTypeIep) ? "" : "1900-01-02";
  }

  getStartDateLabel() {
    return (this.isTypeIep()) ? 'IEP Start Date' : 'Start Date';
  }

  getEndDateLabel() {
    return (this.isTypeIep()) ? 'Next Annual IEP Date' : 'End Date';
  }

  // --------------------------
  // private methods
  // --------------------------

  // An IEP cannot overlap with the most recent prior iep
  //   FUTURE.start > (ACTIVE.end || COMPLETED.end)
  //   ACTIVE.start > (COMPLETED.end)
  //   ACTIVE.end   < (FUTURE.start)
  private _initDateConstraints(state: PLComponentStateInterface) {
    const isFuture = !!((this.isNewIep() && this.activeIep)
      || (this.isEditIep() && this.service.isIepFuture(this.editIep)));
    const isActive = !!((this.isNewIep() && !this.activeIep)
      || (this.isEditIep() && this.service.isIepActive(this.editIep)));

    if (isFuture) {
      if (this.activeIep) {
        state.model.startDateConstraint = this._getStartDateConstraint(this.activeIep);
      } else if (this.completedIep) {
        state.model.startDateConstraint = this._getStartDateConstraint(this.completedIep);
      }
    } else if (isActive) {
      this.completedIep && (state.model.startDateConstraint = this._getStartDateConstraint(this.completedIep));
      this.futureIep && (state.model.maxStartDateConstraint = this.getMaxStartDateConstraint());
      this.futureIep && (state.model.endDateConstraint = this._getEndDateConstraint(this.futureIep));
    }
    if (this.isNewIep() && state.model.startDateConstraint) {
      state.model.startDate = state.model.startDateConstraint;
      state.model.endDateConstraint = this.getMaxEndDateConstraint();
      state.model.nextAnnualIepDate = state.model.endDateConstraint;
    }

    this.util.debugLog(`iep form initDateConstraints`, {
      isActive,
      isFuture,
      active: this.activeIep,
      completed: this.completedIep,
      future: this.futureIep,
      startDateConstraint: state.model.startDateConstraint,
      maxStartDateConstraint: state.model.startDateConstraint,
    }, state);
  }

  // ACTIVE.start cannot become future if FUTURE exists.
  getMaxStartDateConstraint() {
    if (this.futureIep) {
      const today = this.service.getTodayNormalized();
      return today.dateString;
    }
  }

  getMaxEndDateConstraint() {
    const start = this._state.model.startDate;
    if (start) {
      const endDate = this.service.getDateNormalized(start).date;
      endDate.add(1, 'year');
      const endDateFormatted = endDate.format('YYYY-MM-DD');
      if (this._state.model.nextAnnualIepDate > endDateFormatted) {
        setTimeout(() => this._state.model.nextAnnualIepDate = endDateFormatted);
      }
      return endDateFormatted;
    }
  }

  private _getStartDateConstraint(iep: any) {
    const date = this.service.getDateNormalized(iep.nextAnnualIepDate).date;
    date.add(1, 'days');
    return date.format('YYYY-MM-DD');
  }

  private _getEndDateConstraint(iep: any) {
    const date = this.service.getDateNormalized(iep.startDate).date;
    date.subtract(1, 'days');
    return date.format('YYYY-MM-DD');
  }
}