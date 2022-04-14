import { Component, OnInit, OnDestroy } from '@angular/core';
import { PLUtilService, PLComponentStateInterface } from '@common/services';
import { PLClientIEPGoalsService } from '../pl-client-iep-goals.service';

import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';

@Component({
  selector: 'pl-client-iep-test-api',
  templateUrl: './pl-client-iep-test-api.component.html',
  styleUrls: ['./pl-client-iep-test-api.component.less'],
})

export class PLClientIEPTestApiComponent implements OnInit, OnDestroy {
  public _state: PLComponentStateInterface;
  private classname = 'PLClientIEPTestApiComponent';

  constructor(
    public util: PLUtilService,
    public service: PLClientIEPGoalsService,
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
          this.onClickGetIEPs(done);
        }
      });
  }

  ngOnDestroy() {
    this.util.destroyComponent(this._state);
  }

  // -------------------------------
  // data subscription API handlers
  // -------------------------------
  onClickGetIEPs(fn?: Function) {
    const clientId = this._state.model.clientId;
    clientId && this.service.getIEPs$({
      clientId: this._state.model.clientId,
    }, this._state)
    .subscribe(res => {
      const ieps = this._state.model.data.ieps = res && (res.clientIeps && res.clientIeps.length) && res.clientIeps;
      // if no ieps, reset all model data
      !ieps && (this._state.model.data = {});
      this.setIepSelectOpts(ieps);
      fn && fn();
    });
    if (!clientId) {
      this.util.debugLog('no client id', '', this._state);
    }
  }

  onClickCreateIEP(status: string) {
    const type = this._state.model.type;
    const isTypeIep = this.service.isTypeIep(this._state.model);

    const START_OFFSET = status === 'ACTIVE' ? -10 : 10;
    const start = moment().add(START_OFFSET, 'days').format('YYYY-MM-DD');
    const later = moment().add(200, 'days').format('YYYY-MM-DD')
    const nextEvalDate = (isTypeIep) ? moment().add(200, 'days').format('YYYY-MM-DD') : '1900-01-02'
    const prevEvalDate = (isTypeIep) ? moment().subtract(100, 'days').format('YYYY-MM-DD') : '1900-01-01'

    this.service.createIEP$({
      input: {
        clientIep: {
          providerId: this._state.currentUser.uuid,
          clientId: this._state.model.clientId,
          status,
          startDate: start,
          nextAnnualIepDate: later,
          nextEvaluationDate: nextEvalDate,
          prevEvaluationDate: prevEvalDate,
          type: type,
        }
      }
    }, this._state)
    .subscribe(res => {
      !res.createClientIep.errors && delete res.createClientIep.errors;
      status === 'ACTIVE' && (this._state.model.data.createActiveIEP = res);
      status === 'FUTURE' && (this._state.model.data.createFutureIEP = res);
      this.onClickGetIEPs();
    });
  }

  onClickDeleteIEP(status: string) {
    const iep =
      (status === 'ACTIVE' && this.service.getActiveIep(this._state))
      ||
      (status === 'FUTURE' && this.service.getFutureIep(this._state))
      ||
      (status === 'COMPLETE' && this.service.getMostRecentCompletedIep(this._state));
    const id = iep && iep.id;
    id && this.service.deleteIEP$({
      id
    }, this._state)
    .subscribe(res => {
      !res.deleteClientIep.errors && delete res.deleteClientIep.errors;
      const dataProp =
        (status === 'ACTIVE' && 'Active')
        ||
        (status === 'FUTURE' && 'Future')
        ||
        (status === 'COMPLETE' && 'Complete');
      this._state.model.data[`delete${dataProp}IEP`] = res;
      this.onClickGetIEPs();
    });
  }

  onClickUpdateIEP(status: string) {
    const iepId = this._state.model.updateIepId;
    const _iep = this.findIepForId(this._state.model.updateIepId);
    if (iepId && !_iep) {
      return;
    }
    const iep =
      (status === 'ACTIVE' && this.service.getMostRecentCompletedIep(this._state))
      ||
      (status === 'COMPLETE' && this.service.getActiveIep(this._state));
    const id = iep && iep.id;
    (iepId || id) && this.service.updateIEP$({
      clientIep: {
        providerId: this._state.currentUser.uuid,
        id: iepId || id,
        status,
      }
    }, this._state)
    .subscribe(res => {
      !res.updateClientIep.errors && delete res.updateClientIep.errors;
      const dataProp =
        (status === 'COMPLETE' && 'Active')
        ||
        (status === 'ACTIVE' && 'Complete');
      this._state.model.data[`update${dataProp}IEP`] = res;
      this.onClickGetIEPs();
    });
  }

  onClickGetServiceTypes() {
    this.service.getIEPServiceTypes$(this._state)
    .subscribe(res => {
      this._state.model.data.getServiceTypes = res.iepServiceTypes;
    });
  }

  onClickCreateServiceArea() {
    const selectedIepId = this._state.model.createServiceAreaSelectedIep;
    const serviceType = this._state.currentUser.xProvider.serviceType;
    const iep = this.service.getActiveIep(this._state) || this.service.getFirstIep(this._state);
    (selectedIepId || iep) && this.service.createServiceArea$({
      input: {
        serviceArea: {
          providerId: this._state.currentUser.uuid,
          clientIepId: selectedIepId || iep.id,
          serviceTypeId: serviceType && serviceType.uuid,
        }
      }
    }, this._state)
    .subscribe(res => {
      !res.createServiceArea.errors && delete res.createServiceArea.errors;
      this._state.model.data.createServiceArea = res;
      this._state.model.createServiceAreaSelectedIep = null;
      this.onClickGetIEPs();
    });
  }

  onClickUpdateServiceArea(closed?: boolean) {
    const serviceAreaId = this._state.model.updateServiceAreaId;
    const _iep = this.findIepForServiceAreaId(this._state.model.updateServiceAreaId);
    if (serviceAreaId && !_iep) {
      return;
    }
    const iep = this.service.getActiveIep(this._state) || this.service.getFirstIep(this._state);
    const serviceArea = iep && this.service.getProviderServiceArea(this._state, iep);
    const id = serviceArea && serviceArea.id;
    (serviceAreaId || id) && this.service.updateServiceArea$({
      serviceArea: {
        providerId: this._state.currentUser.uuid,
        id : serviceAreaId || id,
        closed,
      }
    }, this._state)
    .subscribe(res => {
      !res.updateServiceArea.errors && delete res.updateServiceArea.errors;
      this._state.model.data[`updateServiceArea_${closed}`] = res;
      this.onClickGetIEPs();
    });
  }

  onClickCreateGoal() {
    const selectedServiceAreaId = this._state.model.createGoalSelectedServiceArea;
    const iep = this.service.getActiveIep(this._state) || this.service.getFirstIep(this._state);
    const serviceArea = iep && this.service.getProviderServiceArea(this._state, iep);
    (selectedServiceAreaId || serviceArea) && this.service.createGoal$({
      input: {
        goal: {
          providerId: this._state.currentUser.uuid,
          serviceAreaId: selectedServiceAreaId || serviceArea.id,
          status: PLClientIEPGoalsService.GOAL_STATUS_PARTIAL,
          description: 'new goal...',
        }
      }
    }, this._state)
    .subscribe(res => {
      !res.createGoal.errors && delete res.createGoal.errors;
      this._state.model.data.createGoal = res;
      this._state.model.createGoalSelectedIep = null;
      this._state.model.createGoalSelectedServiceArea = null;
      this.onClickGetIEPs();
    });
  }

  onClickDeleteGoal() {
    const goalId = this._state.model.deleteGoalId
    const _iep = this.findIepForGoalId(this._state.model.deleteGoalId);
    if (goalId && !_iep) {
      return
    }
    const iep = this.service.getActiveIep(this._state) || this.service.getFirstIep(this._state);
    const serviceArea = iep && this.service.getProviderServiceArea(this._state, iep);
    const goal = serviceArea && serviceArea.goals && serviceArea.goals.length && serviceArea.goals[0];
    const id = goal && goal.id;
    (goalId || id) && this.service.deleteGoal$({
      id: goalId || id,
    }, this._state)
    .subscribe(res => {
      !res.deleteGoal.errors && delete res.deleteGoal.errors;
      this._state.model.data.deleteGoal = res;
      this.onClickGetIEPs();
    });
  }

  onClickUpdateGoal() {
    const goalId = this._state.model.updateGoalId;
    const _iep = this.findIepForGoalId(this._state.model.updateGoalId);
    if (goalId && !_iep) {
      return
    }
    const iep = this.service.getActiveIep(this._state) || this.service.getFirstIep(this._state);
    const serviceArea = iep && this.service.getProviderServiceArea(this._state, iep);
    const goal = serviceArea && serviceArea.goals && serviceArea.goals.length && serviceArea.goals[0];
    const id = goal && goal.id;
    (goalId || id) && this.service.updateGoal$({
      goal: {
        providerId: this._state.currentUser.uuid,
        id: goalId || id,
        status: PLClientIEPGoalsService.GOAL_STATUS_ACHIEVED,
        description: 'updated goal...',
      }
    }, this._state)
    .subscribe(res => {
      !res.updateGoal.errors && delete res.updateGoal.errors;
      this._state.model.data.updateGoal = res;
      this.onClickGetIEPs();
    });
  }

  onClickCreateMetric() {
    const selectedGoalId = this._state.model.createMetricSelectedGoal;
    const iep = this.service.getActiveIep(this._state) || this.service.getFirstIep(this._state);
    const serviceArea = iep && this.service.getProviderServiceArea(this._state, iep);
    const goal = serviceArea && serviceArea.goals && serviceArea.goals.length && serviceArea.goals[0];
    (selectedGoalId || goal) && this.service.createMetric$({
      input: {
        metric: {
          providerId: this._state.currentUser.uuid,
          goalId: selectedGoalId || goal.id,
          name: 'new metric...',
          goalPercentage: 85,
        }
      }
    }, this._state)
    .subscribe(res => {
      !res.createMetric.errors && delete res.createMetric.errors;
      this._state.model.data.createMetric = res;
      this._state.model.createMetricSelectedIep = null;
      this._state.model.createMetricSelectedServiceArea = null;
      this._state.model.createMetricSelectedGoal = null;
      this.onClickGetIEPs();
    });
  }

  onClickDeleteMetric() {
    const metricId = this._state.model.deleteMetricId;
    const _iep = this.findIepForMetricId(this._state.model.updateMetricId);
    if (metricId && !_iep) {
      return
    }
    const iep = this.service.getActiveIep(this._state) || this.service.getFirstIep(this._state);
    const serviceArea = iep && this.service.getProviderServiceArea(this._state, iep);
    const goal = serviceArea && serviceArea.goals && serviceArea.goals.length && serviceArea.goals[0];
    const metric = goal && goal.metrics && goal.metrics.length && goal.metrics[0];
    const id = metric && metric.id;
    (metricId || id) && this.service.deleteMetric$({
      id: metricId || id,
    }, this._state)
    .subscribe(res => {
      !res.deleteMetric.errors && delete res.deleteMetric.errors;
      this._state.model.data.deleteMetric = res;
      this.onClickGetIEPs();
    });
  }

  onClickUpdateMetric() {
    const metricId = this._state.model.updateMetricId;
    const _iep = this.findIepForMetricId(this._state.model.updateMetricId);
    if (metricId && !_iep) {
      return
    }
    const iep = this.service.getActiveIep(this._state) || this.service.getFirstIep(this._state);
    const serviceArea = iep && this.service.getProviderServiceArea(this._state, iep);
    const goal = serviceArea && serviceArea.goals && serviceArea.goals.length && serviceArea.goals[0];
    const metric = goal && goal.metrics && goal.metrics.length && goal.metrics[0];
    const id = metric && metric.id;
    (metricId || id) && this.service.updateMetric$({
      metric: {
        providerId: this._state.currentUser.uuid,
        id: metricId || id,
        name: 'updated metric...',
        goalPercentage: 90,
      }
    }, this._state)
    .subscribe(res => {
      !res.updateMetric.errors && delete res.updateMetric.errors;
      this._state.model.data.updateMetric = res;
      this.onClickGetIEPs();
    });
  }

  findIepForId(iepId: string) {
    const iep = this._state.model.data.ieps.find((iep: any) =>
      iep.id === this._state.model.updateIepId);
    return iep && iep.id;
  }
  findIepForServiceAreaId(serviceAreaId: string) {
    const iep = this._state.model.data.ieps && this._state.model.data.ieps.find((iep: any) =>
      iep.serviceAreas && iep.serviceAreas.find((serviceArea: any) =>
          serviceArea.id === serviceAreaId));
    return iep && iep.id;
  }

  findIepForGoalId(goalId: string) {
    const iep = this._state.model.data.ieps && this._state.model.data.ieps.find((iep: any) =>
      iep.serviceAreas && iep.serviceAreas.find((serviceArea: any) =>
        serviceArea.goals && serviceArea.goals.find((goal: any) =>
          goal.id === goalId)));
    return iep && iep.id;
  }

  findIepForMetricId(metricId: string) {
    const iep = this._state.model.data.ieps && this._state.model.data.ieps.find((iep: any) =>
      iep.serviceAreas && iep.serviceAreas.find((serviceArea: any) =>
        serviceArea.goals && serviceArea.goals.find((goal: any) =>
          goal.metrics && goal.metrics.find((metric: any) =>
            metric.id === metricId))));
    return iep && iep.id;
  }

  // -----------------------------
  // reactive stream API handlers
  // -----------------------------
  onClickRefreshClientIeps() {
    this.service.refreshClientIeps(this._state.model.clientId, this._state);
  }

  // -----------------------------
  // helpers
  // -----------------------------
  setIepSelectOpts(ieps: Array<any>) {
    this._state.model.data.iepSelectOpts = ieps && ieps.map((item: any, index: number) => ({
      label: `iep ${index}`,
      value: item.id,
    }));

    this._state.model.data.typesSelectOpts = this.service.getTypeOpts();
  }

  onChangeSelectIepForCreateGoal(event: any) {
    const selectedIepId = this._state.model.createGoalSelectedIep;
    const selectedIep = selectedIepId && this._state.model.data.ieps.find((item: any) => item.id === selectedIepId);
    const serviceAreas = selectedIep && selectedIep.serviceAreas;
    this._state.model.data.serviceAreaSelectOpts = serviceAreas && serviceAreas.map((item: any, index: number) => ({
      label: `service area ${index}`,
      value: item.id,
    }));
  }

  onChangeSelectIepForCreateMetric(event: any) {
    const selectedIepId = this._state.model.createMetricSelectedIep;
    const selectedIep = selectedIepId && this._state.model.data.ieps.find((item: any) => item.id === selectedIepId);
    const serviceAreas = selectedIep && selectedIep.serviceAreas;
    this._state.model.data.serviceAreaSelectOpts = serviceAreas && serviceAreas.map((item: any, index: number) => ({
      label: `service area ${index}`,
      value: item.id,
    }));
  }
  onChangeSelectServiceAreaForCreateMetric(event: any) {
    const selectedServiceAreaId = this._state.model.createMetricSelectedServiceArea;
    const selectedIepId = this._state.model.createMetricSelectedIep;
    const selectedIep = selectedIepId && this._state.model.data.ieps.find((item: any) => item.id === selectedIepId);
    const serviceAreas = selectedIep && selectedIep.serviceAreas;
    const selectedServiceArea = selectedServiceAreaId && serviceAreas.find((item: any) => item.id === selectedServiceAreaId);
    const goals = selectedServiceArea && selectedServiceArea.goals;
    this._state.model.data.goalSelectOpts = goals && goals.map((item: any, index: number) => ({
      label: `goal ${index}`,
      value: item.id,
    }));
  }
}

