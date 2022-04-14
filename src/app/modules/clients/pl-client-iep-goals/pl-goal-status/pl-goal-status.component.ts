import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { PLUtilService, PLComponentStateInterface,
  PLEventMessageBus, PLEventStream, PLMessageStream}
  from '@common/services';
import { PLClientIEPGoalsService, PLIEPContext } from '../pl-client-iep-goals.service';

@Component({
  selector: 'pl-goal-status',
  templateUrl: './pl-goal-status.component.html',
  styleUrls: ['./pl-goal-status.component.less'],
})

export class PLGoalStatusComponent implements OnInit, OnDestroy {
  @Input() goal: any;
  @Input() isReadOnly: boolean;
  @Input() normalLabels: boolean;
  @Input() smallBars: boolean;

  public _state: PLComponentStateInterface;
  private classname = 'PLGoalStatusComponent';

  private iepGlobalBus: PLMessageStream;

  constructor(
    public util: PLUtilService,
    public service: PLClientIEPGoalsService,
    private messageBus: PLEventMessageBus,
  ) { }

  ngOnInit() {
    this._state = this.util.initComponent({
      name: this.classname,
      params: {
        flags: {
          OVERRIDE_SHOW_DIVS: 1,
        }
      },
      fn: (state, done) => {
        state.model.goal = this.goal;
        state.model.data.goalStatusOpts = this.service.getGoalStatusOpts();
        this._registerStreams(state);
        done();
      },
    });
  }

  ngOnDestroy() {
    this.util.destroyComponent(this._state);
  }

  onChangeGoalStatus(val: any) {;
    this.util.debugLog('change goal status', val, this._state);
    this.iepGlobalBus.send({context: PLIEPContext.GOAL_STATUS_CHANGED, data: this.goal});
  }

  getStatusOpts() {
    return this._state.model.data.goalStatusOpts;
  }

  getGoal() {
    return this._state.model.goal;
  }

  getStatus() {
    return this.getGoal().status !== '' && this.getGoal().status;
  }

  getStatusColors() {
    return this.service.getGoalStatus(this.getStatus()).colors;
  }

  getStatusLabel() {
    return this.service.getGoalStatus(this.getStatus()).option.label;
  }

  isReadOnlyMode() {
    return this.isReadOnly;
  }

  getReadOnlyStatusText() {
    return this.getStatus() && this.getStatusLabel() || '- No Goal Status -';
  }

  // --------------------------
  // private methods
  // --------------------------
  private _registerStreams(state: PLComponentStateInterface) {
    this.iepGlobalBus = this.messageBus.initStream(PLEventStream.IEP_GLOBAL_STREAM, state);
  }
}
