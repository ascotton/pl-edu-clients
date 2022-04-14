import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { PLUtilService, PLComponentStateInterface, PLEventMessageBus, PLEventStream }
  from '@common/services';
import { PLClientIEPGoalsService, PLIEPContext } from '../pl-client-iep-goals.service';

import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';

@Component({
  selector: 'pl-client-end-iep-goal-status',
  templateUrl: './pl-client-end-iep-goal-status.component.html',
  styleUrls: ['./pl-client-end-iep-goal-status.component.less'],
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

export class PLClientEndIEPGoalStatusComponent implements OnInit, OnDestroy {
  @Input() iep: any;

  public _state: PLComponentStateInterface;
  private classname = 'PLClientEndIEPGoalStatusComponent';

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
          state.model.serviceArea = this.service.getProviderServiceArea(state, this.iep);
          state.model.goals = state.model.serviceArea.goals;
          state.model.data.labelsForOtherOpenSA = this.getLabelsForOtherOpenSA();
          // copy goal.status to temporary object for the form to accommodate cancel/close
          // reset goal.status on cancel/close
          state.model.goals.map((item: any) => {
            item.originalStatus = item.status;
            return item;
          });

          state.model.serviceTypeInfo = this.service.getServiceTypeInfo(this._state.currentUser.xProvider.serviceTypeCode);

          const href = `${this.util.getUrlPath(true)}`;
          const lastToken = href.lastIndexOf('/');
          const hrefBase = href.substring(0,lastToken);
          state.model.steps = [
            { key: 'goal-status', label: 'Goal Status', href: `${hrefBase}/goal-status`},
            { key: 'exit-status', label: 'Exit Status', href: `${hrefBase}/exit-status`},
          ];
          done();
        }
      });
  }

  ngOnDestroy() {
    this.util.destroyComponent(this._state);
  }

  onClickClose() {
    return () => {
      this.onClickCancel();
    }
  }

  onClickNext() {
    const iepGlobalBus = this.messageBus.initStream(PLEventStream.IEP_GLOBAL_STREAM, this._state);
    iepGlobalBus.send({ context: PLIEPContext.ENTER_IEP_EXIT_STATUS,
      data: { hashFragment: `/iep/${this.iep.id}/exit-status` }
    });
  }

  onClickCancel() {
    this._state.model.goals.map((item: any) => {
      item.status = item.originalStatus;
      delete item.originalStatus;
      return item;
    });
    const iepGlobalBus = this.messageBus.initStream(PLEventStream.IEP_GLOBAL_STREAM, this._state);
    iepGlobalBus.send({ context: PLIEPContext.END_IEP_CANCELED });
  }

  canContinue() {
    return !this._state.model.goals.find((item: any) => {
      return !item.status;
    });
  }

  hasOtherIncompleteServiceTypes() {
    return this.service.hasOtherIncompleteServiceTypes(this.iep, this._state);
  }

  getLabelsForOtherOpenSA() {
    return this.service.getAllOtherOpenServiceAreas(this.iep, this._state.currentUser).map((item: any) => {
      return this.service.getServiceTypeInfo(item.serviceType.code).label;
    }) || [];
  }
}
