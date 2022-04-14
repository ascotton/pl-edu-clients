import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { tap, first, map } from 'rxjs/operators';

import { PLGraphQLService } from '@root/index';
import { PLUtilService, PLComponentStateInterface } from '@common/services/pl-util.service';

import * as moment from 'moment';

@Injectable()
export class PLClientIEPGoalsService {
  public ID = new String(Math.random()).substring(2, 6);
  public static IEP_STATUS_ACTIVE = 'ACTIVE';
  public static IEP_STATUS_FUTURE = 'FUTURE';
  public static IEP_STATUS_COMPLETE = 'COMPLETE';

  public static IEP_TYPE_IEP = 'IEP';
  public static IEP_TYPE_MTSS_RTI = 'MTSS-RTI';

  public static GOAL_STATUS_NOT_ADDRESSED = 'NOT_ADDRESSED';
  public static GOAL_STATUS_PARTIAL = 'PARTIALLY_ACHIEVED';
  public static GOAL_STATUS_ACHIEVED = 'ACHIEVED';
  public static GOAL_STATUS_DISCONTINUED = 'DISCONTINUED';

  constructor(
    private plGraphQL: PLGraphQLService,
    private util: PLUtilService,
  ) {
    this.util.traceLog(`[${this.ID}] PLClientIEPGoalsService`, '')
  }

  /***********************************************************************
   * push-based reactive data streams
   *
   * typical pattern:
   *   - initialize a data source stream$
   *   - bind streams in templates using async pipe
   *     - e.g. <div *ngIf="stream$ | async as data">
   *   - push new data to reactive views by signaling changes
   *     through action streams
   ************************************************************************/

  // discrete type streams
  clientIeps$: Observable<any>;
  serviceTypes$: Observable<any>;

  // combination streams
  combo$: Observable<any>;

  // ----------------------------
  // reactive action streams
  // ----------------------------

  initStreams(clientId: string, state: PLComponentStateInterface) {
    if (this.util.flag(state, 'TEST_API_STREAMS')) {
      this.clientIeps$ = this.getIEPs$({ clientId }, state);
      this.serviceTypes$ = this.getIEPServiceTypes$(state);
      this.combo$ = combineLatest(
        this.clientIeps$,
        this.serviceTypes$,
      ).pipe(
        map(([ieps, serviceTypes]) => ({
          clientIeps: ieps.clientIeps,
          serviceTypes,
        })),
      )
    }
  }

  refreshClientIeps(clientId: string, state: PLComponentStateInterface) {
    if (this.util.flag(state, 'TEST_API_STREAMS')) {
      this.clientIeps$ = this.getIEPs$({clientId}, state);
    }
  }

  // ----------------------------
  // public business methods
  // ----------------------------

  loadIEPs(state: PLComponentStateInterface, fn?: Function): void {
    const mock = this.__mockIEPs(state);
    mock && (state.model.data.ieps = mock);
    if (!mock) {
      this.getIEPs$({
        clientId: state.model.clientId,
      }, state).subscribe(res => {
        // reverse the order of IEP goals and metrics
        // to display most recent first.
        // TODO: ask BE to provide query sort order
        res.clientIeps && res.clientIeps.map((iep: any) => {
          iep.serviceAreas && iep.serviceAreas.map((sa: any) => {
            sa.goals && sa.goals.reverse();
            sa.goals && sa.goals.map((goal: any) => {
              goal.metrics && goal.metrics.reverse();
            });
          });
        });
        fn && fn(res);
      });
    }
  }

  saveNewIEP(state: PLComponentStateInterface, status: string, fn?: Function): void {
    const type = state.model.type;
    const start = state.model.startDate;
    const nextAnnual = state.model.nextAnnualIepDate;
    const nextTri = state.model.nextTriEvalDate;
    const lastTri = state.model.lastTriEvalDate;
    const inputs = start && nextAnnual && nextTri && lastTri && type;
    inputs && this.createIEP$({
      input: {
        clientIep: {
          providerId: state.currentUser.uuid,
          clientId: state.model.clientId,
          status,
          startDate: `${start}T00:00:00` ,          
          nextAnnualIepDate: `${nextAnnual}T00:00:00` ,
          prevEvaluationDate: `${lastTri}T00:00:00`,
          nextEvaluationDate: `${nextTri}T00:00:00`,
          type: type
        }
      }
    }, state).subscribe(res => {
      state.model.data.ieps = res.clientIeps;
      fn && fn(res);
    });
    if (!inputs) {
      this.util.debugLog('create new iep missing input data', '', state);
      // IEP TODO: show UI validation result or disable save until required fields...
    }
  }

  updateIep(iep: any, state: PLComponentStateInterface, fn?: Function): void {
    const start = state.model.startDate;
    const nextAnnual = state.model.nextAnnualIepDate;
    const nextTri = state.model.nextTriEvalDate;
    const lastTri = state.model.lastTriEvalDate;
    const inputs = start && nextAnnual && nextTri && lastTri;
    this.updateIEP$({
      clientIep: {
        providerId: state.currentUser.uuid,
        id: iep.id,
        status: iep.status,
        startDate: `${start}T00:00:00` ,          
        nextAnnualIepDate: `${nextAnnual}T00:00:00` ,
        prevEvaluationDate: `${lastTri}T00:00:00`,
        nextEvaluationDate: `${nextTri}T00:00:00`,
      }
    }, state).subscribe(res => {
      state.model.data.ieps = res.clientIeps;
      fn && fn(res);
    });
    if (!inputs) {
      this.util.debugLog('update iep missing input data', '', state);
      // IEP TODO: show UI validation result or disable save until required fields...
    }
  }

  updateIepStatus(iep: any, status: string, state: PLComponentStateInterface, fn?: Function): void {
    this.updateIEP$({
      clientIep: {
        providerId: state.currentUser.uuid,
        id: iep.id,
        status,
      }
    }, state).subscribe(res => {
      fn && fn(res);
    });
  }

  endIep(iepId: string, state: PLComponentStateInterface, fn?: Function): void {
    this.updateIEP$({
      clientIep: {
        providerId: state.currentUser.uuid,
        id: iepId,
        status: PLClientIEPGoalsService.IEP_STATUS_COMPLETE,
      }
    }, state).subscribe(res => {
      fn && fn(res);
    });
  }

  deleteIep(iepId: string, state: PLComponentStateInterface, fn?: Function): void {
    this.deleteIEP$({
      id: iepId,
    }, state).subscribe(res => {
      fn && fn(res);
    })
  }

  saveNewGoal(goal: NewGoalType, state: PLComponentStateInterface, fn?: Function): void {
    const inputs = goal.serviceAreaId && goal.description;
    inputs && this.createGoal$({
      input: {
        goal: {
          providerId: state.currentUser.uuid,
          serviceAreaId: goal.serviceAreaId,
          description: goal.description,
          status: goal.status,
        }
      }
    }, state).subscribe(res => {
      fn && fn(res);
    });
  }

  saveEditedGoal(goal: EditedGoalType, state: PLComponentStateInterface, fn?: Function): void {
    const inputs = goal.id && goal.description;
    inputs && this.updateGoal$({
      goal: {
        providerId: state.currentUser.uuid,
        id: goal.id,
        status: goal.status,
        description: goal.description,
      }
    }, state).subscribe(res => {
      fn && fn(res)
    });
  }

  deleteGoal(goalId: string, state: PLComponentStateInterface, fn?: Function) {
    goalId && this.deleteGoal$({
      id: goalId,
    }, state).subscribe(res => {
      fn && fn(res)
    });
  }

  createNewServiceArea(iepId: string, serviceTypeId: string, state: PLComponentStateInterface, fn?: Function): void {
    this.createServiceArea$({
      input: {
        serviceArea: {
          providerId: state.currentUser.uuid,
          clientIepId: iepId,
          serviceTypeId: serviceTypeId,
        }
      }
    }, state).subscribe(res => {
      fn && fn(res);
    });
  }

  updateServiceArea(id: string, clientExited: boolean, closed: boolean, state: PLComponentStateInterface, fn?: Function): void {
    this.updateServiceArea$({
      serviceArea: {
        providerId: state.currentUser.uuid,
        id,
        clientExited,
        closed,
      }
    }, state).subscribe(res => {
      fn && fn(res);
    })
  }

  getMetricPoints(recordId: string, state: PLComponentStateInterface, fn?: Function) {
    this.getMetricPoints$({
      recordId,
    }, state).subscribe(res => {
      fn && fn(res);
    });
  }

  loadIEPYear(state: PLComponentStateInterface): IEPYearInterface {
    return this.__mockIEPYear(state) || ((): IEPYearInterface => {
      return null;
    })();
  }

  loadGoals(state: PLComponentStateInterface): Array<any> {
    return this.__mockGoals(state) || ((): Array<any> => {
      return [];
    })();
  }

  loadMetrics(state: PLComponentStateInterface): Array<any> {
    return this.__mockMetrics(state) || ((): Array<any> => {
      return [];
    })();
  }

  getGoalsMap(goals: any) {
    const _map = {
      SLP: <Array<any>>[],
      OT: <Array<any>>[],
      BMH: <Array<any>>[],
    };
    goals.forEach((item: any) => {
      if (_map[item.serviceType]) {
        _map[item.serviceType].push(item);
      }
    });
    return _map;
  }

  getGoalsForServiceType(goals: any, serviceType: string) {
    return this.getGoalsMap(goals)[serviceType];
  }

  getGoalServiceTypesMap(goalsMap: any): any {
    const _result: any = {};
    const types = Object.keys(goalsMap);
    types.forEach((serviceType: string) => {
      if (goalsMap[serviceType].length) {
        _result[serviceType] = 1;
      }
    })
    return _result;
  }

  getGoalStatusOpts() {
    return goalStatusOpts;
  }

  getGoalStatus(code: string) {
    return goalStatus[code];
  }

  getServiceTypeInfo(serviceTypeCode: string) {
    return this.getServiceTypes()[serviceTypeCode];
  }

  getServiceTypes() {
    return serviceTypes;
  }

  getServiceAreas(iep: any) {
    return iep.serviceAreas;
  }

  isProviderSA(serviceArea: any, state: PLComponentStateInterface) {
    return state.currentUser.xProvider && serviceArea.serviceType.code === state.currentUser.xProvider.serviceTypeCode;
  }

  isServiceAreaClosed(serviceArea: any) {
    return serviceArea.closed;
  }

  getOtherSA_NotExited(iep: any, state: PLComponentStateInterface) {
    return this.getAllOtherServiceAreas(iep, state.currentUser).filter((item: any) => {
      return !this.isServiceAreaClosed(item);
    });
  }

  getOtherSA_NotExited_NotEmpty(iep: any, state: PLComponentStateInterface) {
    return this.getAllOtherServiceAreas(iep, state.currentUser).filter((item: any) => {
      return !this.isServiceAreaClosed(item) && item.goals && item.goals.length;
    });
  }

  isEndIepBlockedByOtherSA(iep: any, state: PLComponentStateInterface) {
    const exitedProviderSA = this.isServiceAreaClosed(this.getProviderServiceArea(state, iep));
    const notExitedOtherSA = this.getOtherSA_NotExited_NotEmpty(iep, state);
    return exitedProviderSA && notExitedOtherSA.length;
  }

  isModifiable(iep: any, serviceArea: any, state: PLComponentStateInterface) {
    if (!this.isProviderSA(serviceArea, state)) return false;
    if (iep.status === PLClientIEPGoalsService.IEP_STATUS_COMPLETE) return false;
    return !this.isServiceAreaClosed(serviceArea);
  }

  getProviderServiceType (user: any) {
    return user.xProvider.serviceType;
  }

  getProviderServiceTypeCode(user: any) {
    return user.xProvider.serviceType.code;
  }

  getProviderServiceTypeId(user: any) {
    return user.xProvider.serviceType.uuid;
  }

  newEmptyGoal(state: PLComponentStateInterface) {
    return {
      uuid: <any>null,
      serviceType: state.model.providerServiceType,
      label: this._getLabelForGoalServiceType(state.model.providerServiceType),
      status: {
        code: 'goal_not_achieved',
        label: this.getGoalStatus('goal_not_achieved').option.label,
      },
      goalText: 'empty goal',
    }
  }

  canAddIep(state: PLComponentStateInterface): boolean {
    return (this.canAddIepActive(state) || this.canAddIepFuture(state))
      && !this.util.inFlow(PLIEPFlow.ADD_IEP, state)
      && !this.util.inFlow((PLIEPFlow.EDIT_IEP), state);
  }

  canAddIepActive(state: PLComponentStateInterface) {
    return !this.getActiveIep(state) && !this.getFutureIep(state);
  }

  canAddIepFuture(state: PLComponentStateInterface) {
    return !this.getFutureIep(state);
  }

  // has no goals in any service area
  canRemoveIep(iep: any) {
    const withGoals = iep.serviceAreas.filter((item: any) => {
      return item.goals && item.goals.length;
    });
    return !withGoals.length;
  }

  getActiveIep(state: PLComponentStateInterface) {
    const ieps = state.model.data.ieps;
    return ieps && ieps.find((item: any) => item.status === PLClientIEPGoalsService.IEP_STATUS_ACTIVE);
  }

  getTypeOpts() {
    return [
      { label: 'IEP', value: PLClientIEPGoalsService.IEP_TYPE_IEP },
      { label: 'MTSS/RTI', value: PLClientIEPGoalsService.IEP_TYPE_MTSS_RTI }
    ];
  }

  getTypeDisplayName(iep: any) {
    return this.getTypeOpts().find((item: any) => item.value === iep.type).label;
  }

  isTypeIep(iep: any) {
    return iep.type === PLClientIEPGoalsService.IEP_TYPE_IEP;
  }

  isIepActive(iep: any) {
    return iep.status === PLClientIEPGoalsService.IEP_STATUS_ACTIVE;
  }

  isIepFuture(iep: any) {
    return iep.status === PLClientIEPGoalsService.IEP_STATUS_FUTURE;
  }

  isIepComplete(iep: any) {
    return iep.status === PLClientIEPGoalsService.IEP_STATUS_COMPLETE;
  }

  isIepActiveOrFuture(iep: any) {
    return this.isIepActive(iep) || this.isIepFuture(iep);
  }

  getFutureIep(state: PLComponentStateInterface) {
    const ieps = state.model.data.ieps;
    return ieps && ieps.find((item: any) => item.status === PLClientIEPGoalsService.IEP_STATUS_FUTURE);
  }

  // get in most recent first order
  getCompletedIeps(state: PLComponentStateInterface) {
    const ieps = state.model.data.ieps;
    const x =  ieps && ieps
      .filter((item: any) => item.status === PLClientIEPGoalsService.IEP_STATUS_COMPLETE)
      .sort((a: any, b: any) => {
        if (a.startDate < b.startDate) return 1;
        if (a.startDate > b.startDate) return -1;
        return 0;
      });
      return x;
  }

  getMostRecentCompletedIep(state: PLComponentStateInterface) {
    const ieps = this.getCompletedIeps(state);
    return ieps && (ieps.length || undefined) && ieps[0];
  }

  hasIEPs(state: PLComponentStateInterface) {
    return state.model.data.ieps && state.model.data.ieps.length;
  }

  hasGoalServiceType(goalTypes: any, serviceType: string) {
    return goalTypes[serviceType];
  }

  hasGoalInProviderSA(providerSA: any) {
    return providerSA && providerSA.goals && providerSA.goals && providerSA.goals.length;
  }

  hasGoalInAnySA(iep: any) {
    return iep.serviceAreas.find((item: any) => item.goals && item.goals.length);
  }

  hasGoalInOpenProviderSA(providerSA: any) {
    return providerSA && !providerSA.closed && providerSA.goals && providerSA.goals.length;
  }

  hasMetrics(state: PLComponentStateInterface) {
    return !state.model.data.metrics || (state.model.data.metrics && !state.model.data.metrics.length);
  }

  hasOtherIncompleteServiceTypes(iep: any, state: PLComponentStateInterface) {
    return state.currentUser.xProvider && iep.serviceAreas.find((item: any) => item.serviceType.code !== state.currentUser.xProvider.serviceTypeCode);
  }

  getFirstIep(state: PLComponentStateInterface) {
    const ieps = state.model.data.ieps;
    return ieps && ieps.length && ieps[0];
  }

  getCompleteIep(state: PLComponentStateInterface) {
    const ieps = state.model.data.ieps;
    return ieps && ieps.length && ieps
      .find((item: any) => item.status === PLClientIEPGoalsService.IEP_STATUS_COMPLETE);
  }

  getProviderServiceArea(state: PLComponentStateInterface, iep: any) {
    return iep.serviceAreas.find((item: any) => state.currentUser.xProvider && item.serviceType.code === state.currentUser.xProvider.serviceTypeCode);
  }

  isProviderServiceAreaClosed(state: PLComponentStateInterface, iep: any) {
    const providerSA = this.getProviderServiceArea(state, iep);
    return providerSA && providerSA.closed;
  }

  // An empty SA is one with no goals
  getOtherNonEmptyServiceAreas(iep: any, currentUser: any) {
    const otherSA = this.getAllOtherServiceAreas(iep, currentUser);
    // TODO: use a sort function instead of all this code...
    const ot = otherSA && otherSA.find((item: any) => item.serviceType.code === 'ot');
    const bmh = otherSA && otherSA.find((item: any) => item.serviceType.code === 'bmh');
    const slt = otherSA && otherSA.find((item: any) => item.serviceType.code === 'slt');
    // 2019-06-11 (slack)
    // List remaining service areas in alphabetical order
    const result = [];
    bmh && bmh.goals.length && result.push(bmh);
    ot && ot.goals.length && result.push(ot);
    slt && slt.goals.length && result.push(slt);
    return result;
  }

  getAllOtherServiceAreas(iep: any, currentUser: any) {
    return iep.serviceAreas.reduce((result: Array<any>, item: any) => {
      if (!currentUser.xProvider || item.serviceType.code !== currentUser.xProvider.serviceTypeCode) {
        result.push(item);
      }
      return result;
    }, []);
  }

  // An open SA is one that with SA.closed = false
  getAllOtherOpenServiceAreas(iep: any, currentUser: any) {
    return this.getOtherNonEmptyServiceAreas(iep, currentUser).filter((item: any) => !item.closed);
  }

  getStatusDisplayName(iep: any) {
    if (iep.status === PLClientIEPGoalsService.IEP_STATUS_ACTIVE) return 'Active';
    if (iep.status === PLClientIEPGoalsService.IEP_STATUS_FUTURE) return 'Future';
    if (iep.status === PLClientIEPGoalsService.IEP_STATUS_COMPLETE) return 'Past';
  }

  canDeleteIep(iep: any) {
    const serviceAreas = iep.serviceAreas;
    return !serviceAreas.find((item: any) => {
      return item.closed;
    });
  }

  // returns a prioritized set of field-level validations
  // NOT
  validateIepForm(state: PLComponentStateInterface, clickSave?: boolean) {
    const activeIep = state.model.data.activeIep;
    const futureIep = state.model.data.futureIep;
    const completedIep = state.model.data.completedIep;
    const editIep = state.model.data.editIep;
    const activeStart = activeIep && this.util.getDateNormalized(activeIep.startDate).date;
    const futureStart = futureIep && this.util.getDateNormalized(futureIep.startDate).date;
    const completedStart = completedIep && this.util.getDateNormalized(completedIep.startDate).date;
    const editStart = editIep && this.util.getDateNormalized(editIep.startDate).date;
    const today = this.util.getTodayNormalized().date;

    const type = state.model.type;
    const _s = state.model.startDate;
    const _n = state.model.nextAnnualIepDate;
    const _pt = state.model.lastTriEvalDate;
    const _nt = state.model.nextTriEvalDate;
    const start = this.util.getDateNormalized(_s).date;
    const next = this.util.getDateNormalized(_n).date;
    const prevTri = this.util.getDateNormalized(_pt).date;
    const nextTri = this.util.getDateNormalized(_nt).date;
    const v = state.model.iepFormValidation = {};

    // NOTE: The order of these checks matter. When more than 1 check is true,
    // the last such check is considered the most relevant.
    if (_s && _n && (next.diff(start, 'd') <= 0)) {
      v[IEPFormFields.NEXT] = { message: 'Must be greater than Start'};
    }
    if (_s && _n && (next.diff(start.clone().add(1, 'y'), 'd') > 0)) {
      v[IEPFormFields.NEXT] = {message: 'Cannot be more than 1 year after start' };
    }
    if (completedIep && _s  && (start.diff(completedStart, 'd') < 0)) {
      v[IEPFormFields.START] = { message: 'Cannot precede Completed IEP/Progress Tracker start' };
    }
    if (activeIep && editIep && (editIep.id !== activeIep.id) && _s && (start.diff(activeStart, 'd') < 0)) {
      v[IEPFormFields.START] = { message: 'Cannot precede Active IEP/Progress Tracker start' };
    }
    if (activeIep && !editIep && _s && (start.diff(activeStart, 'd') < 0)) {
      v[IEPFormFields.START] = { message: 'Cannot precede Active IEP/Progress Tracker start' };
    }
    if (futureIep && (editIep.id !== futureIep.id) && _s && (start.diff(futureStart, 'd') > 0)) {
      v[IEPFormFields.START] = { message: 'Cannot be after Future IEP/Progress Tracker start' };
    }
    if (futureIep && (editIep.id !== futureIep.id) && _s && (start.diff(today, 'd') > 0)) {
      v[IEPFormFields.START] = { message: 'Cannot be in the future' };
    }
    if (_pt && _nt && (nextTri.diff(prevTri, 'd') <= 0)) {
      v[IEPFormFields.NEXT_TRI] = { message: 'Must be greater than Last Triennial' };
    }
    if (_pt && _nt && (nextTri.diff(prevTri.clone().add(3, 'y'), 'd') > 0)) {
      v[IEPFormFields.NEXT_TRI] = { message: 'Cannot be more than 3 years after Last Triennial' };
    }

    if (clickSave) {
      !_s && (v[IEPFormFields.START] = { message: 'REQUIRED FIELD'});
      !_n && (v[IEPFormFields.NEXT] = { message: 'REQUIRED FIELD' });
      !_pt && (v[IEPFormFields.PREV_TRI] = { message: 'REQUIRED FIELD' });
      !_nt && (v[IEPFormFields.NEXT_TRI] = { message: 'REQUIRED FIELD' });
    }

    return { results: v, isValid: (Object.keys(v).length === 0)};
  }

  getValidationMessage(key: IEPFormFields, state: PLComponentStateInterface) {
    const ifv = state.model.iepFormValidation;
    return (ifv && ifv[key] && ifv[key].message) || (ifv && ifv[key]) || '';
  }

  validMetrics(metrics: any) {
    return !metrics || !metrics.find((item: any) => {
      return item._invalid;
    });
  }

  // ------------------------------
  // single fetch data API methods
  // ------------------------------

  getIEPs$(variables: {clientId: string}, state: PLComponentStateInterface) {
    return this.plGraphQL.query(GQL_GET_IEPS_QUERY, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('get ieps', res, state)),
      );
  }

  createIEP$(variables: CreateClientIEPInput, state: PLComponentStateInterface) {
    const status = variables.input.clientIep.status;
    status && (variables.input.clientIep.status = status.toLowerCase());
    return this.plGraphQL.mutate(GQL_CREATE_IEP_QUERY, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('create iep', res, state)),
      );
  }

  deleteIEP$(variables: {id: string}, state: PLComponentStateInterface) {
    return this.plGraphQL.mutate(GQL_DELETE_IEP_QUERY, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('delete iep', res, state)),
      );
  }

  updateIEP$(variables: UpdateClientIEPInputData, state: PLComponentStateInterface) {
    const status = variables.clientIep.status;
    status && (variables.clientIep.status = status.toLowerCase());
    return this.plGraphQL.mutate(GQL_UPDATE_IEP_QUERY, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('update iep', res, state)),
      );
  }

  createServiceArea$(variables: CreateServiceAreaInput, state: PLComponentStateInterface) {
    return this.plGraphQL.mutate(GQL_CREATE_SERVICE_AREA, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('create service area', res, state)),
      );
  }

  updateServiceArea$(variables: UpdateServiceAreaInputData, state: PLComponentStateInterface) {
    return this.plGraphQL.mutate(GQL_UPDATE_SERVICE_AREA_QUERY, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('update service area', res, state)),
      );
  }

  createGoal$(variables: CreateGoalInput, state: PLComponentStateInterface) {
    return this.plGraphQL.mutate(GQL_CREATE_GOAL_QUERY, variables, {})
    .pipe(
      first(),
      tap(res => this.util.debugLogApi('create goal', res, state)),
    )
  }

  deleteGoal$(variables: { id: string }, state: PLComponentStateInterface) {
    return this.plGraphQL.mutate(GQL_DELETE_GOAL_QUERY, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('delete goal', res, state)),
      );
  }

  updateGoal$(variables: UpdateGoalInputData, state: PLComponentStateInterface) {
    return this.plGraphQL.mutate(GQL_UPDATE_GOAL_QUERY, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('update goal', res, state)),
      );
  }

  createMetric$(variables: CreateMetricInput, state?: PLComponentStateInterface) {
    return this.plGraphQL.mutate(GQL_CREATE_METRIC_QUERY, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('create metric', res, state)),
      )
  }

  deleteMetric$(variables: { id: string }, state?: PLComponentStateInterface) {
    return this.plGraphQL.mutate(GQL_DELETE_METRIC_QUERY, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('delete metric', res, state)),
      );
  }

  updateMetric$(variables: UpdateMetricInputData, state?: PLComponentStateInterface) {
    return this.plGraphQL.mutate(GQL_UPDATE_METRIC_QUERY, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('update metric', res, state)),
      );
  }

  getIEPServiceTypes$(state?: PLComponentStateInterface) {
    return this.plGraphQL.query(GQL_GET_SERVICE_TYPES, {}, {})
      .pipe(
        tap(res => this._logApi('get iep service types', res, state)),
      )
  }

  getMetricPoints$(variables: { recordId: string }, state: PLComponentStateInterface) {
    return this.plGraphQL.query(GQL_GET_METRIC_POINTS, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('get metric points', res, state)),
      );
  }

  private _logApi(text: string, res: any, state: PLComponentStateInterface) {
    this.util.debugLogApi('get iep service types', res, state);
  }

  findIepFromServiceArea(ieps: any, serviceAreaId: string) {
    return ieps.find((iep: any) => {
      return iep.serviceAreas && iep.serviceAreas.find((sa: any) => sa.id === serviceAreaId);
    });
  }

  findServiceArea(ieps: any, serviceAreaId: string) {
    const iep = this.findIepFromServiceArea(ieps, serviceAreaId);
    return iep && iep.serviceAreas && iep.serviceAreas.find((sa: any) => sa.id === serviceAreaId);
  }

  findGoal(goals: any, goalId: string) {
    return goals && goals.find((goal: any) => goal.id === goalId);
  }

  findGoalFromIeps(ieps: any, serviceAreaId: string, goalId: string) {
    const serviceArea = this.findServiceArea(ieps, serviceAreaId);
    return this.findGoal(serviceArea.goals, goalId);
  }

  // Dates need to be interpreted in some timezone.
  // Date comparisons need to use a consistent interpretation.
  // Use dateUtc for date comparisons.
  getTodayNormalized() {
    return this.util.getTodayNormalized();
  }

  getDateNormalized(day: string) {
    return this.util.getDateNormalized(day);
  }

  isIepStartDateFuture(iep: any) {
    const today = this.getTodayNormalized().date;
    const start = this.getDateNormalized(iep.startDate).date;
    return start.diff(today, 'days') > 0;
  }

  // ----------------------------
  // private methods
  // ----------------------------

  _getLabelForGoalServiceType(serviceType: string) {
    return serviceTypes[serviceType].label;
  }

  // ----------------------------
  // mock helpers
  // ----------------------------
  private __mockIEPs(state: PLComponentStateInterface): Array<IEPYearInterface> {
    if (this.util.flag(state, 'IEP_NONE')) {
      return [];
    } else if (this.util.flag(state, 'IEP_ONE')) {
      return [MOCK_IEP_YEAR_ONE];
    }
  }

  private __mockIEPYear(state: PLComponentStateInterface): IEPYearInterface {
    if (this.util.flag(state, 'IEP_NONE')) {
      return null;
    } else if (this.util.flag(state, 'IEP_ONE') || this.util.flag(state, 'GOAL_STATUS')) {
      return MOCK_IEP_YEAR_ONE;
    }
  }

  private __mockGoals(state: PLComponentStateInterface): Array<any> {
    if (this.util.flag(state, 'GOALS_NONE')) {
      return [];
    } else if (state.componentName === 'PLClientEndIEPGoalStatusComponent' && this.util.flag(state, 'GOAL_STATUS')) {
      return MOCK_GOALS_SLP_THREE;
    } else if (this.util.flag(state, 'GOALS_SLP_ONE')) {
      return MOCK_GOALS_SLP_ONE;
    } else if (this.util.flag(state, 'GOALS_SLP_TWO')) {
      return MOCK_GOALS_SLP_TWO;
    } else if (this.util.flag(state, 'GOALS_SLP_THREE')) {
      return MOCK_GOALS_SLP_THREE;
    } else if (this.util.flag(state, 'GOALS_MIXED')) {
      return MOCK_GOALS_MIXED;
    }
  }

  private __mockMetrics(state: PLComponentStateInterface): Array<any> {
    if (this.util.flag(state, 'METRICS_NONE')) {
      return [];
    } else if (this.util.flag(state, 'METRICS_ONE')) {
      return MOCK_METRICS_ONE;
    } else if (this.util.flag(state, 'METRICS_MULTI')) {
      return MOCK_METRICS_MULTI;
    }
  }
}

// -------------------------------------
// enums, interfaces, constants, mocks
// -------------------------------------

// Flows are UI states.
// Flow changes are often triggered using message events.
// As a result, there is often a correlation between flow and context names.
export enum PLIEPFlow {
  ADD_IEP = 'ADD_IEP',
  ADD_GOAL = 'ADD_GOAL',
  ADD_METRIC = 'ADD_METRIC',

  EDIT_IEP = 'EDIT_IEP',
  DISABLE_EDIT_IEP = 'DISABLE_EDIT_IEP',
  EDIT_GOAL = 'EDIT_GOAL',
  EDIT_METRIC = 'EDIT_METRIC',

  END_IEP = 'END_IEP',
  IEP_GOAL_STATUS = 'IEP_GOAL_STATUS',
  IEP_EXIT_STATUS = 'IEP_EXIT_STATUS',
}

// Contexts are keys for message events.
// Message contexts help indicate that something happened.
// Message events can be used to trigger flow changes or other side effects.
export enum PLIEPContext {
  ADD_IEP = 'ADD_IEP',
  EDIT_IEP = 'EDIT_IEP',
  DELETE_IEP = 'DELETE_IEP',

  ADD_IEP_SAVED = 'ADD_IEP_SAVED',
  ADD_IEP_CANCELED = 'ADD_IEP_CANCELED',

  ENTER_IEP_GOAL_STATUS = 'ENTER_IEP_GOAL_STATUS',
  ENTER_IEP_EXIT_STATUS = 'ENTER_IEP_EXIT_STATUS',
  END_IEP_DONE = 'END_IEP_DONE',
  END_IEP_CANCELED = 'END_IEP_CANCELED',

  ADD_GOAL_DONE = 'ADD_GOAL_DONE',
  EDIT_GOAL_SAVED = 'END_EDIT_GOAL_SAVED',
  EDIT_GOAL_CANCELED = 'END_EDIT_GOAL_CANCELED',
  DELETE_GOAL = 'DELETE_GOAL',

  TOGGLE_EXPAND_ALL_GOALS = 'TOGGLE_EXPAND_ALL_GOALS',

  END_ADD_METRIC = 'END_ADD_METRIC',

  GOAL_STATUS_CHANGED = 'GOAL_STATUS_CHANGED',
  RELOAD_IEPS = 'RELOAD_IEPS',
  GET_IEPS_THEN_FN = 'GET_IEPS_THEN_FN',
  IEPS_RELOADED = 'IEPS_RELOADED',
}

export enum IEPFormFields {
  START = 'START_DATE',
  NEXT = 'NEXT_IEP_DATE',
  PREV_TRI = 'PREV_TRIENNIAL_DATE',
  NEXT_TRI = 'NEXT_TRIENNIAL_DATE',
}

export interface IEPYearInterface {
  id: string,
  start: string,
  end: string,
}

export interface CreateClientIEPInput {
  input: {
    clientIep: {
      providerId: string,
      clientId: string,
      status: string,
      startDate: string,
      nextAnnualIepDate: string,
      nextEvaluationDate: string,
      prevEvaluationDate: string,
      type: string,
    },
  }
}

export interface UpdateClientIEPInputData {
  clientIep: {
    providerId: string,
    id: string,
    clientId?: string,
    status?: string,
    startDate?: string,
    nextAnnualIepDate?: string,
    nextEvaluationDate?: string,
    prevEvaluationDate?: string,
  }
}

export interface CreateServiceAreaInput {
  input: {
    serviceArea: {
      providerId: string,
      clientIepId: string,
      serviceTypeId: string,
    }
  }
}

export interface UpdateServiceAreaInputData {
  serviceArea: {
    providerId: string,
    id: string,
    closed?: boolean,
    clientExited?: boolean,
  }
}

export interface CreateGoalInput {
  input: {
    goal: {
      providerId: string,
      serviceAreaId: string,
      description: string,
      status?: string,
    }
  }
}

export interface UpdateGoalInputData {
  goal: {
    providerId: string,
    id: string,
    status?: string,
    description?: string,
  }
}

export interface NewGoalType {
  providerId: string,
  serviceAreaId: string,
  status?: string,
  description: string,
}

export interface EditedGoalType {
  providerId: string,
  id: string,
  status?: string,
  description?: string,
}

export interface CreateMetricInput {
  input: {
    metric: {
      providerId: string,
      goalId: string,
      name: string,
      goalPercentage: number,
    }
  }
}

export interface UpdateMetricInputData {
  metric: {
    providerId: string,
    id: string,
    name?: string,
    goalPercentage?: number,
  }
}

export interface ClientSelectedActionInterface {
  clientId: string,
  state: PLComponentStateInterface,
}

const goalStatus = {
  [`${PLClientIEPGoalsService.GOAL_STATUS_DISCONTINUED}`]: {
    option: {
      label: 'Goal discontinued',
      value: PLClientIEPGoalsService.GOAL_STATUS_DISCONTINUED,
    },
    colors: ['yellow','yellow','yellow','yellow'],
  },
  [`${PLClientIEPGoalsService.GOAL_STATUS_NOT_ADDRESSED}`]: {
    option: {
      label: 'Goal not addressed',
      value: PLClientIEPGoalsService.GOAL_STATUS_NOT_ADDRESSED,
    },
    colors: ['gray', 'gray', 'gray', 'gray'],
  },
  [`${PLClientIEPGoalsService.GOAL_STATUS_PARTIAL}`]: {
    option: {
      label: 'Goal partially achieved',
      value: PLClientIEPGoalsService.GOAL_STATUS_PARTIAL,
    },
    colors: ['blue', 'blue', 'gray', 'gray'],
  },
  [`${PLClientIEPGoalsService.GOAL_STATUS_ACHIEVED}`]: {
    option: {
      label: 'Goal achieved',
      value: PLClientIEPGoalsService.GOAL_STATUS_ACHIEVED,
    },
    colors: ['green', 'green', 'green', 'green'],
  },
};

const goalStatusOpts = [
  goalStatus[PLClientIEPGoalsService.GOAL_STATUS_DISCONTINUED].option,
  goalStatus[PLClientIEPGoalsService.GOAL_STATUS_NOT_ADDRESSED].option,
  goalStatus[PLClientIEPGoalsService.GOAL_STATUS_PARTIAL].option,
  goalStatus[PLClientIEPGoalsService.GOAL_STATUS_ACHIEVED].option,
];

const serviceTypes = {
  'slt': {
    code: 'slt',
    label: 'Speech/Language Therapy',
  },
  'ot': {
    code: 'ot',
    label: 'Occupational Therapy',
  },
  'bmh': {
    code: 'bmh',
    label: 'Behavioral & Mental Health Therapy',
  },
};

const MOCK_IEP_YEAR_ONE: IEPYearInterface = {
  id: '001', start: '2019-01-01', end: '2020-01-01'
};

const MOCK_GOALS_SLP_ONE: Array<any> = [
  {
    uuid: '001',
    serviceType: 'SLP',
    label: 'Speech/Language Therapy Goals',
    status: {
      code: 'GNA',
      label: 'Goal Not Addressed',
    },
    goalText: 'SLP - This is the text of the goal. Work hard to reach your goals. (1)',
  },
];

const MOCK_GOALS_SLP_TWO: Array<any> = [
  {
    uuid: '001',
    serviceType: 'SLP',
    label: 'Speech/Language Therapy Goals',
    status: {
      code: 'GNA',
      label: 'Goal Not Addressed',
    },
    goalText: 'SLP - This is the text of the goal. Work hard to reach your goals. (1)',
  },
  {
    uuid: '002',
    serviceType: 'SLP',
    label: 'Speech/Language Therapy Goals',
    status: {
      code: 'GNA',
      label: 'Goal Not Addressed',
    },
    goalText: 'A tool unlike anything we have seen before. (2)',
  },
];

const MOCK_GOALS_SLP_THREE: Array<any> = [
  {
    uuid: '001',
    serviceType: 'SLP',
    label: 'Speech/Language Therapy Goals',
    status: {
      code: 'GNA',
      label: 'Goal Not Addressed',
    },
    goalText: 'SLP - This is the text of the goal. Work hard to reach your goals.',
  },
  {
    uuid: '002',
    serviceType: 'SLP',
    label: 'Speech/Language Therapy Goals',
    status: {
      code: 'GNA',
      label: 'Goal Not Addressed',
    },
    goalText: 'A tool unlike anything we have seen before.',
  },
  {
    uuid: '003',
    serviceType: 'SLP',
    label: 'Speech/Language Therapy Goals',
    status: {
      code: 'GNA',
      label: 'Goal Not Addressed',
    },
    goalText: 'SLP - Don\'t let your schooling interfere with your education',
  },
];

const MOCK_GOALS_MIXED: Array<any> = [
  {
    uuid: '001',
    serviceType: 'SLP',
    label: 'Speech/Language Therapy Goals',
    status: {
      code: 'GNA',
      label: 'Goal Not Addressed',
    },
    goalText: 'SLP - This is the text of the goal. Work hard to reach your goals.',
  },
  {
    uuid: '002',
    serviceType: 'OT',
    label: 'Occupational Therapy Goals',
    status: {
      code: 'GNA',
      label: 'Goal Not Addressed',
    },
    goalText: 'OT - This is the text of the goal. Work hard to reach your goals.',
  },
  {
    uuid: '003',
    serviceType: 'BMH',
    label: 'Behavioral & Mental Health Therapy Goals',
    status: {
      code: 'GNA',
      label: 'Goal Not Addressed',
    },
    goalText: 'BMH - This is the text of the goal. Work hard to reach your goals.',
  },
];

const MOCK_METRICS_ONE: Array<any> = [
  {
    uuid: '001',
    name: 'Medial /r/ word level',
    targetAccuracy: '',
  }
];

const MOCK_METRICS_MULTI: Array<any> = [
  {
    uuid: '001',
    name: 'Medial /r/ word level',
    targetAccuracy: '',
  },
  {
    uuid: '002',
    name: 'Preliminary /r/ sentence design',
    targetAccuracy: '',
  },
];

// ----------------------------
// GQL Strings
// ----------------------------
const __SUB_GQL_ERRORS = `
  errors {
    code
    field
    message
  }
`;

const __SUB_METRIC = `
  id
  name
  goalPercentage
  totalAverage
  currentMonthAverage
  monthMinus1Average
  monthMinus2Average
  currentMonthDate
  monthMinus1Date
  monthMinus2Date
`;

const __SUB_GOAL = `
  id
  status
  description
  metrics {
    edges {
      node {
        ${__SUB_METRIC}
      }
    }
  }
`;

const __SUB_SERVICE_AREA = `
  id
  serviceType {
    id
    code
    shortName
  }
  clientExited
  closed
  goals {
    edges {
      node {
        ${__SUB_GOAL}
      }
    }
  }
`;

const __SUB_CLIENT_IEP = `
  id
  client {
    id
  }
  status
  startDate
  nextAnnualIepDate
  nextEvaluationDate
  prevEvaluationDate
  type
  serviceAreas {
    edges {
      node {
        ${__SUB_SERVICE_AREA}
      }
    }
  }
`;

const GQL_GET_IEPS_QUERY = `
  query IEPs($clientId: UUID!) {
    clientIeps(clientId: $clientId) {
      edges {
        node {
          ${__SUB_CLIENT_IEP}
        }
      }
    }
  }
`;

const GQL_GET_SERVICE_TYPES = `
{
  iepServiceTypes {
    edges {
      node {
        id
        code
      }
    }
  }
}
`;

const GQL_CREATE_IEP_QUERY = `
  mutation createClientIep($input: CreateClientIEPInput!) {
    createClientIep(input: $input) {
      ${__SUB_GQL_ERRORS}
      status
      clientIep {
        ${__SUB_CLIENT_IEP}
      }
    }
  }
`;

const GQL_CREATE_SERVICE_AREA = `
mutation createSa($input: CreateServiceAreaInput!) {
  createServiceArea(input: $input) {
    ${__SUB_GQL_ERRORS}
    serviceArea {
      ${__SUB_SERVICE_AREA}
    }
  }
}
`;

const GQL_CREATE_GOAL_QUERY = `
mutation createGoal($input: CreateGoalInput!) {
  createGoal(input: $input) {
    ${__SUB_GQL_ERRORS}
    goal {
      ${__SUB_GOAL}
    }
  }
}
`;

const GQL_CREATE_METRIC_QUERY = `
mutation createMetric($input: CreateMetricInput!) {
  createMetric(input: $input) {
    ${__SUB_GQL_ERRORS}
    metric {
      ${__SUB_METRIC}
    }
  }
}
`;

const GQL_DELETE_IEP_QUERY = `
mutation deleteIep($id: UUID!) {
  deleteClientIep(input: {id: $id}) {
    ${__SUB_GQL_ERRORS}
    clientIep {
      id
    }
  }
}
`;

const GQL_DELETE_GOAL_QUERY = `
mutation deleteGoal($id: UUID!) {
  deleteGoal(input: {id: $id}) {
    ${__SUB_GQL_ERRORS}
    goal {
      id
    }
  }
}
`;

const GQL_DELETE_METRIC_QUERY = `
mutation deleteMetric($id: UUID!) {
  deleteMetric(input: {id: $id}) {
    ${__SUB_GQL_ERRORS}
    metric {
      id
    }
  }
}
`;

const GQL_UPDATE_IEP_QUERY = `
mutation updateIep($clientIep: UpdateClientIEPInputData!) {
  updateClientIep(input: {clientIep: $clientIep}) {
    ${__SUB_GQL_ERRORS}
    clientIep {
      ${__SUB_CLIENT_IEP}
    }
  }
}
`;

const GQL_UPDATE_SERVICE_AREA_QUERY = `
mutation updateServiceArea($serviceArea: UpdateServiceAreaInputData!) {
  updateServiceArea(input: {serviceArea: $serviceArea}) {
    ${__SUB_GQL_ERRORS}
    serviceArea {
      ${__SUB_SERVICE_AREA}
    }
  }
}
`;

const GQL_UPDATE_GOAL_QUERY = `
mutation updateGoal($goal: UpdateGoalInputData!) {
  updateGoal(input: {goal: $goal}) {
    ${__SUB_GQL_ERRORS}
    goal {
      ${__SUB_GOAL}
    }
  }
}
`;

const GQL_UPDATE_METRIC_QUERY = `
mutation updateMetric($metric: UpdateMetricInputData!) {
  updateMetric(input: {metric: $metric}) {
    ${__SUB_GQL_ERRORS}
    metric {
      ${__SUB_METRIC}
    }
  }
}
`;

const GQL_GET_METRIC_POINTS = `
query MetricPoints($recordId: UUID!) {
  goalMetricPoints(recordId: $recordId) {
    totalCount
    edges {
      node {
        id
        correct
        trials
        percentage
        metric {
          id
          name
          goal {
            id
            description
          }
        }
      }
    }
  }
}
`;
