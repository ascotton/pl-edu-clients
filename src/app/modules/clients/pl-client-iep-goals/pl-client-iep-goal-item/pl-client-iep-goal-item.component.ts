import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { PLUtilService, PLComponentStateInterface, PLEventMessageBus,
  PLMessageStream, PLEventStream, PLEventMessage } from '@common/services';
import { PLClientIEPGoalsService, PLIEPContext, PLIEPFlow } from '../pl-client-iep-goals.service';
import { PLConfirmDialogService, PLModalService } from '@root/index';
import { PLClientGoalStatusHelpComponent } from '../pl-client-goal-status-help/pl-client-goal-status-help.component';

import { combineLatest } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'pl-client-iep-goal-item',
  templateUrl: './pl-client-iep-goal-item.component.html',
  styleUrls: ['./pl-client-iep-goal-item.component.less'],
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({ height: '100%', opacity: 0 }),
          animate('600ms', style({ height: '100%', opacity: 1 }))
        ]),
      ]
    )
  ],
})

export class PLClientIEPGoalItemComponent implements OnInit, OnDestroy {
  @Input() iep: any;
  @Input() goal: any;
  @Input() serviceArea: any;
  @Input() client: any;

  private classname = 'PLClientIEPGoalItemComponent';
  public _state: PLComponentStateInterface;
  private iepGlobalStream: PLMessageStream;

  constructor(
    public util: PLUtilService,
    public service: PLClientIEPGoalsService,
    private messageBus: PLEventMessageBus,
    private plConfirm: PLConfirmDialogService,
    private plModal: PLModalService,
  ) {}

  ngOnInit() {
    this._state = this.util.initComponent({
      name: this.classname,
      fn: (state, done) => {
        this._copyGoalsForCancel(state);
        state.model.data.goal = this.goal;
        state.model.data.serviceArea = this.serviceArea;
        state.model.data.iep = this.iep;
        state.client = this.client;
        state.model.clientId = this.client.uuid;
        state.expandCardToggle = false;
        state.saving = false;
        this.initMetrics(state);
        this._registerStreams(state);
        done();
      },
    });
  }

  ngOnDestroy() {
    this.util.destroyComponent(this._state);
  }

  // --------------------------
  // public methods
  // --------------------------
  onClickCancel() {
    Object.assign(this.goal, this._state.model.data.goalCopy);
    delete this._state.model.data.goalCopy;
    if (this.isAddGoalMode()) {
      this.iepGlobalStream.send({ context: PLIEPContext.ADD_GOAL_DONE });
    } else if (this.isEditGoalMode()) {
      this.util.endFlow(PLIEPFlow.EDIT_GOAL, this._state);
    }
    this.util.hackRecalcTooltipPosition();
    this.goal.newMetrics = [];
  }

  onClickSave() {
    delete this._state.model.data.goalCopy;
    if (this.isAddGoalMode()) {
      this._saveNewGoal((goal: any) => {
        const newGoal = {...this.goal, ...goal}
        const hasMetrics = newGoal.newMetrics.length;
        const __exitFlow = () => {
          this.iepGlobalStream.send({ context: PLIEPContext.ADD_GOAL_DONE, fn: () => {
            this.iepGlobalStream.send({ context: PLIEPContext.RELOAD_IEPS });
          }});
        }
        if (hasMetrics) {
          this._saveMetrics(newGoal, __exitFlow);
        } else {
          __exitFlow();
        }
      });
    } else
    if (this.isEditGoalMode()) {
      this._saveEditedGoal((goal: any) => {
        const __exitFlow = () => {
          this.service.loadIEPs(this._state, (res: any) => {
            const iep = res.clientIeps.find((_: any) => _.id === this.iep.id);
            const sa = iep && iep.serviceAreas.find((_: any) => _.id === this.serviceArea.id);
            const g = sa && sa.goals.find((_: any) => _.id === goal.id);
            this.goal.metrics = g.metrics;
            this.initMetrics(this._state);
            this.util.endFlow(PLIEPFlow.EDIT_GOAL, this._state);
            this.util.hackRecalcTooltipPosition();
          });
        };
        const updates: Array<any> = [];
        const deletes:Array<any> = [];
        const g = this.goal;
        g.metrics.forEach((item: any) => {
          item.deleted && deletes.push(item);
          !item.deleted && updates.push(item);
        });
        g.metrics = updates;
        g.deleteMetrics = deletes;
        const m = g.newMetrics.length || g.metrics.length || g.deleteMetrics.length;
        if (m) {
          this._saveMetrics(g, __exitFlow);
        } else {
          __exitFlow();
        }
      })
    }
  }

  onClickEdit() {
    this._copyGoalsForCancel(this._state);
    this.util.startFlow(PLIEPFlow.EDIT_GOAL, this._state);
  }

  onClickDelete() {
    delete this._state.model.data.goalCopy;
    const metricsCount = this.goal.metrics && this.goal.metrics.length;
    let metricsCountMessage = '';
    if (metricsCount) {
      metricsCountMessage = `This goal contains <b>${metricsCount} metric${metricsCount>1?'s':''}</b>.<br/>`;
    }
    this.plConfirm.show({
      header: 'Delete Goal',
      content: `<div style="padding-bottom:12px;">${metricsCountMessage}Are you sure you want to delete this goal?</div>`,
      primaryLabel: 'Delete Goal', secondaryLabel: 'Cancel',
      primaryCallback: () => {
        if (this._state.saving) {
          return;
        }
        this._state.saving = true;
        this.service.deleteGoal(this.goal.id, this._state, (res: any) => {
          this._state.saving = false;
          const gi = this.serviceArea.goals.findIndex((goal: any) => {
            return goal.id === res.deleteGoal.goal.id
          });
          (gi > -1) && this.serviceArea.goals.splice(gi, 1);
          this.plConfirm.hide();
        });
      },
      secondaryCallback: () => { },
      closeCallback: () => { },
    });
  }

  onClickAddMetric() {
    this.goal.newMetrics.unshift(this.newEmptyMetric());
  }

  onClickExpandCardToggle() {
    this._state.expandCardToggle = !this._state.expandCardToggle;
  }

  onClickGoalStatusInfoIcon() {
    let modalRef: any;
    const statusNames: any[] = ['Client_ONBOARDING', 'Client_IN_SERVICE', 'Client_NOT_IN_SERVICE'];
    const params = {
      statusNames,
      onCancel: () => {
        modalRef._component.destroy();
      },
      modalHeaderText: `Learn more about Student Statuses`,
      introductionText: `Below are the definitions for Student Statuses. These statuses are derived from the
                student’s Direct Services and Evaluations statuses. These are automatically updated and do not require
                any manual change by a Clinician.`,
      definitionHeaderText: `Student Statuses`,
    };
    this.plModal.create(PLClientGoalStatusHelpComponent, params);
  }

  // check required fields on existing metrics and new metrics
  // check validation on metrics and new metrics
  canClickSave() {
    const goalDescription = this.goal.description && this.goal.description.trim();
    const missingGoalDescription = !goalDescription || (goalDescription.length === 0);
    const metrics = this.goal.metrics;
    const newMetrics = this.goal.newMetrics;
    const missingMetricData = metrics && metrics.find((item: any) => {
      const n = item.name && item.name.trim();
      const p = (item.goalPercentage || item.goalPercentage === 0)
        && `${item.goalPercentage}`.trim();
      return !item.deleted && (!n || n.length === 0 || !p || p.length === 0);
    });
    const missingNewMetricData = newMetrics && newMetrics.find((item: any) => {
      const n = item.name && item.name.trim();
      const p = (item.goalPercentage || item.goalPercentage === 0)
        && `${item.goalPercentage}`.trim();
      return !n || n.length === 0 || !p || p.length === 0;
    });
    const validMetrics = this._state.test = this.service.validMetrics(metrics);
    const validNewMetrics = this._state.test = this.service.validMetrics(newMetrics);
    return validMetrics && validNewMetrics
      && !missingGoalDescription && !missingMetricData && !missingNewMetricData;
  }

  isAddGoalMode() {
    return !this.goal.id;
  }

  isEditGoalMode() {
    return this.util.inFlow(PLIEPFlow.EDIT_GOAL, this._state);
  }

  isGoalModifiable() {
    return this.service.isModifiable(this.iep, this.serviceArea, this._state);
  }

  isProviderSA(state: PLComponentStateInterface) {
    return this.service.isProviderSA(this.serviceArea, state);
  }

  isReadOnlyMode() {
    return !this.isAddGoalMode() && !this.isEditGoalMode();
  }

  goalForStatusInput() {
    return this.isAddGoalMode() ? {} : this.goal;
  }

  hasMetrics() {
    return this.goal.metrics && this.goal.metrics.length;
  }

  getMetrics() {
    return this.goal.metrics;
  }

  initMetrics(state: PLComponentStateInterface) {
    this.goal.newMetrics = [];
    this.goal.deleteMetrics = [];
    const m = this.goal.metrics && this.goal.metrics.length && this.goal.metrics[0];
    if (m) {
      state.metricsMonthNames = {
        currentMonth: this.util.getDateNormalized(m.currentMonthDate).monthAbbrev,
        monthMinus1: this.util.getDateNormalized(m.monthMinus1Date).monthAbbrev,
        monthMinus2: this.util.getDateNormalized(m.monthMinus2Date).monthAbbrev,
      }
    } else {
      state.metricsMonthNames = undefined;
    }
    this.util.traceLog('metrics month names', state.metricsMonthNames);
  }

  newEmptyMetric() {
    return {
      name: <string>undefined,
      goalPercentage: <string>undefined,
      _ID: new String(Math.random()),
    }
  }

  // display formatting
  splitGoalDescriptionParagraphs() {
    return this.goal.description.split('\n\n');
  }

  splitLineBreaks(text: string) {
    return text.split('\n');
  }

  getGoalPlaceholderText() {
    return this.service.isTypeIep(this.iep) ? 
      'Please copy and paste goal from IEP document' : 
      'Enter goal description'
    ;
  }

  // --------------------------
  // private methods
  // --------------------------
  private _registerStreams(state: PLComponentStateInterface) {
    this.iepGlobalStream = this.messageBus.initStream(PLEventStream.IEP_GLOBAL_STREAM, state);
    this.iepGlobalStream.onReceive(PLIEPContext.GOAL_STATUS_CHANGED, (message: PLEventMessage) => {
      const messageGoal = message.data;
      if (this.isReadOnlyMode() && messageGoal.id === this.goal.id) {
        this._saveEditedGoal(); // NOTE: local data model is already synced.
      }
    });
    this.iepGlobalStream.onReceive(PLIEPContext.TOGGLE_EXPAND_ALL_GOALS, (message: PLEventMessage) => {
      const toggleValue = message.data.expand;
      const serviceAreaId = message.data.serviceAreaId;
      if (this.serviceArea.id === serviceAreaId) {
        state.expandCardToggle = toggleValue;
      }
    });
  }
  private _copyGoalsForCancel(state: PLComponentStateInterface) {
    const m = this.goal.metrics;
    // make a throwaway copy to accomodate "cancel"
    state.model.data.goalCopy = Object.assign({}, this.goal);
    state.model.data.goalCopy.metrics = m && m.map((item: any) => {
      return Object.assign({}, item);
    });
  }
  private _saveNewGoal(fn?: Function) {
    if (this._state.saving) {
      return false;
    }
    this._state.saving = true;
    this.service.saveNewGoal({
      providerId: this._state.currentUser.uuid,
      serviceAreaId: this.serviceArea.id,
      description: this.goal.description,
      status: this.goal.status,
    }, this._state, (res: any) => {
      this._state.saving = false;
      const goal = res.createGoal && res.createGoal.goal;
      const errors = res.createGoal && res.createGoal.errors;
      if (goal) {
        fn && fn(goal);
      } else if (errors) {
        this.util.errorLog('saveNewGoal errors', res, this._state);
      }
    });
  }

  private _saveEditedGoal(fn?: Function) {
    if (this._state.saving) {
      return;
    }
    this._state.saving = true;
    this.service.saveEditedGoal({
      providerId: this._state.currentUser.uuid,
      id: this.goal.id,
      status: this.goal.status,
      description: this.goal.description,
    }, this._state, (res: any) => {
      this._state.saving = false;
      const goal = res.updateGoal && res.updateGoal.goal;
      const errors = res.updateGoal && res.updateGoal.errors;
      if (goal) {
        fn && fn(goal);
      } else if (errors) {
        this.util.errorLog('saveEditedGoal errors', res, this._state);
      }
    });
  }
  private _saveMetrics(savedGoal: any, fn?: Function) {
    const allMetrics: any = [];
    const newMetrics = savedGoal.newMetrics;
    newMetrics.reverse();
    const editMetrics = savedGoal.metrics;
    const deleteMetrics = savedGoal.deleteMetrics;
    newMetrics && newMetrics.forEach((m: any) => {
      allMetrics.push(this.service.createMetric$({
        input: {
          metric: {
            providerId: this._state.currentUser.uuid,
            goalId: savedGoal.id,
            name: m.name,
            goalPercentage: m.goalPercentage,
          }
        }
      }));
    });
    editMetrics && editMetrics.forEach((m: any) => {
      allMetrics.push(this.service.updateMetric$({
        metric: {
          providerId: this._state.currentUser.uuid,
          id: m.id,
          name: m.name,
          goalPercentage: m.goalPercentage,
        }
      }));
    });
    deleteMetrics && deleteMetrics.forEach((m: any) => {
      allMetrics.push(this.service.deleteMetric$({
        id: m.id,
      }));
    });

    allMetrics.length && combineLatest(allMetrics).pipe(first()).subscribe(res => {
      fn && fn();
    });

    !allMetrics.length && fn && fn();
  }
}
