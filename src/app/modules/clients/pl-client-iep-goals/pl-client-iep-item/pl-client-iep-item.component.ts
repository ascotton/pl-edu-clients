import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import {
  PLUtilService, PLComponentStateInterface,
  PLEventMessageBus, PLEventStream, PLMessageStream, PLEventMessage,
} from '@common/services';
import { PLClientIEPGoalsService, PLIEPContext, PLIEPFlow } from '../pl-client-iep-goals.service';

import * as moment from 'moment';

@Component({
  selector: 'pl-client-iep-item',
  templateUrl: './pl-client-iep-item.component.html',
  styleUrls: ['./pl-client-iep-item.component.less'],
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({ height: '100%', opacity: 0 }),
          animate('600ms', style({ height: '100%', opacity: 1 }))
        ]),
        transition(':leave', [
          style({ height: '100%', opacity: 1 }),
          animate('200ms', style({ height: '100%', opacity: 0 }))
        ]),
      ]
    )
  ],
})

export class PLClientIEPItemComponent implements OnInit, OnDestroy {
  @Input() iep: any;
  @Input() ieps: any;
  @Input() client: any;

  private providerSA: any;
  iepGlobalStream: PLMessageStream;

  public _state: PLComponentStateInterface;
  private classname = 'PLClientIEPItemComponent';

  constructor(
    public util: PLUtilService,
    public service: PLClientIEPGoalsService,
    private messageBus: PLEventMessageBus,
  ) {}

  ngOnInit() {
    this._state = this.util.initComponent({
      name: this.classname,
      fn: (state, done) => {
        state.model.data.iep = this.iep;
        state.model.data.ieps = this.ieps;
        state.client = this.client;
        state.model.clientId = this.client.uuid;
        this._updateIepDisplay(state);
        this._registerStreams(state);
        // if user's service area is missing on an Active or Future IEP, create it
        const providerSA = this.providerSA = this.service.getProviderServiceArea(state, this.iep);
        const isCompletedIEP = this.service.isIepComplete(this.iep);

        const needsServiceArea = !providerSA && !isCompletedIEP && state.currentUser.xProvider;
        if (needsServiceArea) {
          this.service.createNewServiceArea(
            this.iep.id,
            this.service.getProviderServiceTypeId(state.currentUser),
            state,
            (res: any) => {
              this.iep.serviceAreas.push(res.createServiceArea.serviceArea);
              this.providerSA = this.service.getProviderServiceArea(state, this.iep);
              done();
            }
          );
        } else if (providerSA && !isCompletedIEP) {
          state.model.info.endIepBlockedByOtherSA = this.service.isEndIepBlockedByOtherSA(this.iep, state)
        }
        !needsServiceArea && done();
      },
    });
  }

  ngOnDestroy() {
    this.util.destroyComponent(this._state);
  }

  onClickEditIep() {
    this.util.startFlow(PLIEPFlow.EDIT_IEP, this._state);
    this.iepGlobalStream.send({context: PLIEPContext.EDIT_IEP,
      data: {start: 1, iep: this.iep}
    });
  }

  // --------------------------
  // public methods
  // --------------------------
  onClickEndIep() {
    this.util.startFlow(PLIEPFlow.END_IEP, this._state)
    this.iepGlobalStream.send({context: PLIEPContext.ENTER_IEP_GOAL_STATUS,
      data: { hashFragment: `/iep/${this.iep.id}/goal-status`}
    });
  }

  onClickRemoveEmptyIep() {
    this.service.deleteIep(this.iep.id, this._state, (res: any) => {
      this.iepGlobalStream.send({ context: PLIEPContext.DELETE_IEP});
    });
  }

  getIepStart() {
    return this._state.model.data.iepDates.startDateDisplay;
  }

  getIepEnd() {
    return this._state.model.data.iepDates.iepNextAnnualIepDateDisplay;
  }

  getProviderServiceArea(state: PLComponentStateInterface) {
    return this.service.getProviderServiceArea(state, this.iep);
  }

  getOtherNonEmptyServiceAreas(state: PLComponentStateInterface) {
    return this.service.getOtherNonEmptyServiceAreas(this.iep, state.currentUser) || [];
  }

  hasGoals(serviceArea: any) {
    return serviceArea.goals && serviceArea.goals.length;
  }

  hasGoalsInAnyServiceArea() {
    return this.service.hasGoalInAnySA(this.iep);
  }

  getIepStatus() {
    return this.iep.status;
  }

  isIepFuture() {
    return this.getIepStatus() === PLClientIEPGoalsService.IEP_STATUS_FUTURE;
  }

  isIepActive() {
    return this.getIepStatus() === PLClientIEPGoalsService.IEP_STATUS_ACTIVE;
  }

  isServiceAreaModifiable() {
    return this.service.isModifiable(this.iep, this.providerSA, this._state);
  }

  isIepYearModifiable() {
    return !this.util.inFlow(PLIEPFlow.DISABLE_EDIT_IEP, this._state)
      && this.iep.status !== PLClientIEPGoalsService.IEP_STATUS_COMPLETE
      && !this.isReadOnly();
  }

  canRemoveEmptyIep() {
    return this.service.canRemoveIep(this.iep) &&
      (this.isIepActive() || this.isIepFuture());
  }

  canCompleteIep() {
    return this.isServiceAreaModifiable()
      && this.service.isIepActive(this.iep)
      && this.service.hasGoalInOpenProviderSA(this.providerSA);
  }

  canCompleteEntireIep() {
    return !this.service.isEndIepBlockedByOtherSA(this.iep, this._state)
      && !this.util.inFlow(PLIEPFlow.END_IEP, this._state)
      && this.hasGoals(this.providerSA);
  }

  isServiceAreaClosed() {
    const providerSA = this.service.getProviderServiceArea(this._state, this.iep);
    return providerSA.closed;
  }

  hasOtherIncompleteServiceTypes() {
    return this.service.hasOtherIncompleteServiceTypes(this.iep, this._state);
  }

  iepDueTomorrow() {
    const _t = this.util.getTodayNormalized();
    const _n = this.util.getDateNormalized(this.iep.nextAnnualIepDate);
    return this.service.isIepActive(this.iep)
      && !this.service.isProviderServiceAreaClosed(this._state, this.iep)
      && _n.date.diff(_t.date, 'd') === 1;
  }

  iepPastDue() {
    const _t = this.util.getTodayNormalized();
    const _n = this.util.getDateNormalized(this.iep.nextAnnualIepDate);
    return this.service.isIepActive(this.iep)
      && !this.service.isProviderServiceAreaClosed(this._state, this.iep)
      && _n.date.diff(_t.date, 'd') <= 0;
  }

  // more than a year overdue
  iepExtremelyOverdue() {
    const _t = this.util.getTodayNormalized();
    const _n = this.util.getDateNormalized(this.iep.nextAnnualIepDate);
    return this.service.isIepActive(this.iep)
      && !this.service.isProviderServiceAreaClosed(this._state, this.iep)
      && _n.date.clone().add(1, 'y').diff(_t.date, 'd') <= 0;
  }

  // NOTE: suppress the message for "extremely" over due,
  // as it's not a relevant nag at that point
  canShowOverdueWarningMessage() {
    return this.service.isIepActive(this.iep) && this.iepPastDue()
      && !this.iepExtremelyOverdue() && this.service.hasGoalInOpenProviderSA(this.providerSA)
      && !this.isReadOnly();
  }

  editMode() {
    return this.util.inFlow(PLIEPFlow.EDIT_IEP, this._state);
  }

  normalMode() {
    return !this.editMode();
  }

  isReadOnly() {
    return !this._state.currentUser.xProvider;
  }

  // --------------------------
  // private methods
  // --------------------------
  private _registerStreams(state: PLComponentStateInterface) {
    this.iepGlobalStream = this.messageBus.initStream(PLEventStream.IEP_GLOBAL_STREAM, state);
    this.iepGlobalStream.onReceive(PLIEPContext.END_IEP_DONE, () => {
      if (this.util.inFlow(PLIEPFlow.END_IEP, state)) {
        this.util.endFlow(PLIEPFlow.END_IEP, state);
      }
    });
    this.iepGlobalStream.onReceive(PLIEPContext.EDIT_IEP, (message: PLEventMessage) => {
      // START ---
      // when editing another active/future iep, disable editing mode
      const editIep = message.data.iep;
      if (message.data.start && this.iep !== editIep.id && this.service.isIepActiveOrFuture(this.iep)) {
        this.util.startFlow(PLIEPFlow.DISABLE_EDIT_IEP, state);
      }
      // END ---
      if (message.data.end) {
        this.util.endFlow(PLIEPFlow.EDIT_IEP, state);
        this.util.endFlow(PLIEPFlow.DISABLE_EDIT_IEP, state);
        this.iepGlobalStream.send({ context: PLIEPContext.RELOAD_IEPS })
      }
    });
    this.iepGlobalStream.onReceive(PLIEPContext.ADD_IEP, (message: PLEventMessage) => {
      if (this.service.isIepActive(this.iep)) {
        this.util.startFlow(PLIEPFlow.DISABLE_EDIT_IEP, state);
      }
    });
    this.iepGlobalStream.onReceive(PLIEPContext.ADD_IEP_CANCELED, (message: PLEventMessage) => {
      if (this.service.isIepActive(this.iep)) {
        this.util.endFlow(PLIEPFlow.DISABLE_EDIT_IEP, state);
      }
    });
    this.iepGlobalStream.onReceive(PLIEPContext.ADD_IEP_SAVED, (message: PLEventMessage) => {
      if (this.service.isIepActive(this.iep)) {
        this.util.endFlow(PLIEPFlow.DISABLE_EDIT_IEP, state);
      }
    });
  }

  private _updateIepDisplay(state: PLComponentStateInterface) {
    const startDate = this.util.getDateNormalized(this.iep.startDate).date;
    const startDateDisplay = startDate.format('M/D/YYYY');
    const iepNextAnnualIepDate = this.util.getDateNormalized(this.iep.nextAnnualIepDate).date;
    const iepNextAnnualIepDateDisplay = iepNextAnnualIepDate.format('M/D/YYYY');
    state.model.data.iepDates = {
      startDate,
      startDateDisplay,
      iepNextAnnualIepDate,
      iepNextAnnualIepDateDisplay,
    }
  }
}
