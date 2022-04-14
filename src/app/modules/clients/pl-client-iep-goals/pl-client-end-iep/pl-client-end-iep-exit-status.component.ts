import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { PLUtilService, PLComponentStateInterface,
  PLEventMessageBus, PLEventStream, PLMessageStream,
} from '@common/services';
import { PLClientIEPGoalsService, PLIEPContext } from '../pl-client-iep-goals.service';

import * as moment from 'moment';
import { combineLatest } from 'rxjs';
import { first } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';

@Component({
  selector: 'pl-client-end-iep-exit-status',
  templateUrl: './pl-client-end-iep-exit-status.component.html',
  styleUrls: ['./pl-client-end-iep-exit-status.component.less'],
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({ height: '100%', opacity: 0 }),
          animate('400ms', style({ height: 0, opacity: 1 }))
        ]),
      ]
    )
  ],
})
export class PLClientEndIEPExitStatusComponent implements OnInit, OnDestroy {
  @Input() iep: any;
  private serviceArea: any;
  private goals: any;

  public _state: PLComponentStateInterface;
  private classname = 'PLClientEndIEPExitStatusComponent';
  iepGlobalStream: PLMessageStream;

  constructor(
    public util: PLUtilService,
    public service: PLClientIEPGoalsService,
    private messageBus: PLEventMessageBus,
    activatedRoute: ActivatedRoute,
    store: Store<any>,
    router: Router,
  ) {
  }

  ngOnInit() {
      this._state = this.util.initComponent({
        name: this.classname,
        initObservables: [this.util.getCurrentClientInitObservable2()],
        fn: (state, done) => {
          state.model.clientName = `${state.client.first_name} ${state.client.last_name}`;
          state.model.iep = this.iep;
          state.model.iepYear = {
            uuid: this.iep.id,
            start: this.util.getDateNormalized(this.iep.startDate).dateStringDisplayCompact,
            end: this.util.getDateNormalized(this.iep.nextAnnualIepDate).dateStringDisplayCompact,
          };
          this.serviceArea = state.model.serviceArea = this.service.getProviderServiceArea(state, this.iep);
          this.goals = state.model.goals = state.model.serviceArea.goals;
          state.model.serviceTypeInfo = this.service.getServiceTypeInfo(this._state.currentUser.xProvider.serviceTypeCode);
          const href = `${this.util.getUrlPath(true)}`;
          const lastToken = href.lastIndexOf('/');
          const hrefBase = href.substring(0, lastToken);
          state.model.steps = [
            { key: 'goal-status', label: 'Goal Status', href: `${hrefBase}/goal-status` },
            { key: 'exit-status', label: 'Exit Status', href: `${hrefBase}/exit-status` },
          ];
          state.model.signOffLabel = `I certify that this ${this._state.model.serviceTypeInfo.label} section of the IEP has ended`;
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
  onClickClose() {
    return () => {
      this.onClickCancel();
    }
  }

  onClickCancel() {
    this._state.model.goals.map((item: any) => {
      item.status = item.originalStatus;
      delete item.originalStatus;
      return item;
    });
    this.iepGlobalStream.send({ context: PLIEPContext.END_IEP_CANCELED });
  }

  // update serviceArea and goals (status) and then send a message to close the IEP.
  onClickDone() {
    if (this._state.saving) {
      return;
    }
    const goals$: Array<any> = [];
    this.goals.forEach((item: any) => {
      goals$.push(this.service.updateGoal$({
        goal: {
          providerId: this._state.currentUser.uuid,
          id: item.id,
          status: item.status,
        }
      }, this._state));
    });
    this._state.saving = true;
    combineLatest(goals$).pipe(first()).subscribe(() => {
      this.service.updateServiceArea(
        this.serviceArea.id,
        this.serviceArea.clientExited,
        SERVICE_AREA_CLOSED_TRUE,
        this._state,
        (res: any) => {
          this._state.saving = false;
          if (!res.errors) {
            this.serviceArea.closed = true;
          }
          this.iepGlobalStream.send({ context: PLIEPContext.END_IEP_DONE,
            data: {
              iep: this.iep,
              serviceArea: this.serviceArea,
            }
        });
      });
    });
  }

  onClickBack() {
    this.iepGlobalStream.send({ context: PLIEPContext.ENTER_IEP_GOAL_STATUS,
      data: { hashFragment: `/iep/${this.iep.id}/goal-status` }
    });
  }

  canContinue() {
    return true;
  }

  // --------------------------
  // private methods
  // --------------------------
  private _registerStreams(state: PLComponentStateInterface) {
    this.iepGlobalStream = this.messageBus.initStream(PLEventStream.IEP_GLOBAL_STREAM, state);
  }
}

const SERVICE_AREA_CLOSED_TRUE = true;
const SERVICE_AREA_CLOSED_FALSE = false;
