import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { PLUtilService, PLComponentStateInterface,
  PLEventMessageBus, PLMessageStream, PLEventStream, PLEventMessage } from '@common/services';
import { PLClientIEPGoalsService, PLIEPFlow, PLIEPContext } from '../pl-client-iep-goals.service';
import { PLMayService } from '@root/index';

@Component({
  selector: 'pl-client-iep-service-area',
  templateUrl: './pl-client-iep-service-area.component.html',
  styleUrls: ['./pl-client-iep-service-area.component.less'],
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({ height: '100%', opacity: 0 }),
          animate('600ms', style({ height: '100%', opacity: 1 }))
        ]),
      ]
    )
  ]
})

export class PLClientIEPServiceAreaComponent implements OnInit, OnDestroy {
  @Input() iep: any;
  @Input() serviceArea: any;
  @Input() client: any;

  public _state: PLComponentStateInterface;
  private classname = 'PLClientIEPServiceAreaComponent';

  private iepGlobalBus: PLMessageStream;

  emptyGoal: any;

  constructor(
    public util: PLUtilService,
    public service: PLClientIEPGoalsService,
    private messageBus: PLEventMessageBus,
    private plMay: PLMayService,
  ) {}

  ngOnInit() {
    this._state = this.util.initComponent({
      name: this.classname,
      fn: (state, done) => {
        state.model.emptyGoal = this.newEmptyGoal();
        state.model.data.iep = this.iep;
        state.model.data.serviceArea = this.serviceArea;
        state.client = this.client;
        state.showGoals = (this.isProviderSA(state) || this.plMay.isCustomerAdmin(state.currentUser)) && this.isIepActive();
        state.toggleExpandAllGoals = false;
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
  onClickAddGoal() {
    this._state.showGoals = this.isProviderSA(this._state);
    this.util.startFlow(PLIEPFlow.ADD_GOAL, this._state);
  }

  onClickServiceTypeHeader() {
    this._state.showGoals = !this._state.showGoals;
  }

  onClickToggleExpandAllGoals() {
    this._state.toggleExpandAllGoals = !this._state.toggleExpandAllGoals;
    this.iepGlobalBus.send({context: PLIEPContext.TOGGLE_EXPAND_ALL_GOALS, data: {
      expand: this._state.toggleExpandAllGoals,
      serviceAreaId: this.serviceArea.id,
    }});
  }

  showGoals() {
    return this._state.showGoals;
  }

  getGoals() {
    return this.serviceArea.goals;
  }

  hasGoals() {
    return this.getGoals() && this.getGoals().length;
  }

  canShowGoals() {
    return this.hasGoals() || this.util.inFlow(PLIEPFlow.ADD_GOAL, this._state);
  }

  canShowProgressTrackingInfoMessage() {
    return this.service.isIepFuture(this.iep) && this.hasGoals() && this.isProviderSA(this._state);
  }

  isInAddFlowState() {
    return this.util.inFlow(PLIEPFlow.ADD_GOAL, this._state);
  }

  isProviderServiceType() {
    return this.getServiceAreaType() === this._state.currentUser.xProvider.serviceTypeCode;
  }

  getServiceAreaType() {
    return this.service.getServiceTypeInfo(this.serviceArea.serviceType.code);
  }

  isProviderSA(state: PLComponentStateInterface) {
    return this.service.isProviderSA(this.serviceArea, state);
  }

  newEmptyGoal() {
    return {
      status: <string>undefined,
      description: <string>undefined,
    };
  }

  isServiceAreaModifiable() {
    return this.service.isModifiable(this.iep, this.serviceArea, this._state);
  }

  isIepActive() {
    return this.service.isIepActive(this.iep);
  }

  isServiceAreaClosed() {
    return this.service.isServiceAreaClosed(this.serviceArea);
  }

  hasOtherIncompleteServiceTypes() {
    return this.service.hasOtherIncompleteServiceTypes(this.iep, this._state);
  }

  showServiceAreaClosedMessage() {
    return this.isProviderSA(this._state) && this.isIepActive()
      && this.isServiceAreaClosed() && this.hasOtherIncompleteServiceTypes()
     // couldn't have closed this SA without goals, but defensive...
      && this.hasGoals();
  }

  canShowEmptyServiceArea() {
    return this.isProviderSA(this._state) && this.showGoals() && !this.canShowGoals() && this.isServiceAreaModifiable();
  }

  // --------------------------
  // private methods
  // --------------------------
  private _registerStreams(state: PLComponentStateInterface) {
    this.iepGlobalBus = this.messageBus.initStream(PLEventStream.IEP_GLOBAL_STREAM, state);
    // Add Goal Saved/Canceled - end FLOW
    this.iepGlobalBus.onReceive(PLIEPContext.ADD_GOAL_DONE, (message: PLEventMessage) => {
      this.util.endFlow(PLIEPFlow.ADD_GOAL, state);
      this.util.hackRecalcTooltipPosition();
      state.model.emptyGoal = this.newEmptyGoal();
      message.fn && message.fn();
    });
  }
}
