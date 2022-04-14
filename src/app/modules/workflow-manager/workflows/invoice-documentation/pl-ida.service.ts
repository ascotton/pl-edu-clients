import { Injectable, OnDestroy } from '@angular/core';
import { forkJoin, of, Subject } from 'rxjs';
import { filter, finalize, first, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { PLLoadAppointment } from '@app/modules/schedule/store/schedule';
import { selectInvoicePeriod } from '@common/store/invoice';
import * as moment from 'moment';
import { NgProgress, NgProgressRef } from 'ngx-progressbar';
import { PLHttpService, PLUrlsService, PLApiFileAmazonService, PLToastService,
  PLGraphQLService, PLGQLStringsService }
  from '@root/index';
import { PLUtilService } from '@common/services';
import { PLClientIEPGoalsService }
  from '@modules/clients/pl-client-iep-goals/pl-client-iep-goals.service';
import { AppStore } from '@app/appstore.model';

/* tslint:disable */

/**
 * This is the business object for Invoice Documentation Assistant.
 * It serves as the core business and state service for
 * API service calls, business rules, and data state access.
 */
@Injectable()
export class PLInvoiceDocumentationService implements OnDestroy {

  private loadingBar: NgProgressRef;
  private _model: any = {};
  private _state: any = {};
  private _globalData: any = {};
  private _globalDataComplete = false;
  private _entryPointInProgress = false;

  // this is the current user provider for documentation
  // and the "appointment provider" in the case of an admin viewing another provider's documentation
  private _provider: any;

  // constants

  constructor(
    private loadingBarService: NgProgress,
    private plHttp: PLHttpService,
    private plUrls: PLUrlsService,
    private plFileUpload: PLApiFileAmazonService,
    private plToast: PLToastService,
    private plGraphQL: PLGraphQLService,
    private plGQLStrings: PLGQLStringsService,
    private util: PLUtilService,
    private iepService: PLClientIEPGoalsService,
    private store: Store<AppStore>,
    ) { }

  private destroyed$ = new Subject<boolean>();

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  //------------------------------------
  // PUBLIC business and utility methods
  //------------------------------------

  // public entry point method
  /**
   * This is the initial entry point method that must be called
   * from the entry point view component.
   * @param calendarProvider - user owning the calendar having .xProvider property
   * @param fn - post init callback
   */
  entryPoint(calendarProvider: any, fn?: Function) {
    if (this._entryPointInProgress) return;
    this._entryPointInProgress = true;
    this._provider = calendarProvider;
    this._init();
    fn && fn();
    this._state.startupInfo.debugFlags = this.getFlags();
    // If there is already a load in place unsubscribe
    this.destroyed$.next(true);
    if (this.isStandaloneAppointment()) {
        this.util.log('calendar documentation entrypoint', {appointment: this._state.standaloneAppointment, STATE: this._state});
    } else {
        this.util.log('ida entrypoint', { STATE: this._state });
    }
    this._loadAppointmentListData();
  }

  // SAVE STEPS
  // appointment -> [eval-document-upload] -> [eval] -> record
  saveItemDocumentation(item: any, afterSaveRecordFn: Function, stayOnSelectedItem: boolean) {
    if (this.isSaving()) {
      this.util.log('already saving...', item);
      return;
    }
    this.util.log('saving item', item);
    this._startSaving();
    const A = item.appointment;
    if (!A.uuid) {
      this._createAppointment(item, afterSaveRecordFn, stayOnSelectedItem); // also saves record
    } else {
      if (this.isEvaluationAppointment(item)) {
        // if amendable, save activities queued for save or delete
        item.model.savedEvaluationActivities.forEach((_: any, listIndex: number) => {
          if (!_.evalActivityUuid) {
            item.model.selectedActivityComponent = _.activity.uuid;
            item.model.selectedActivityDetail = _.activityDetail && _.activityDetail.uuid;
             // asynchronous best effort for now.
            this.saveEvaluationActivity(item);
          } else if (_.queuedForDelete) {
            this.deleteEvaluationActivity(item, _.evalActivityUuid,
              (res: any) => {
                item.model.savedEvaluationActivities.splice(listIndex, 1);
                this.logSelectedItem(res);
              },
              (err: any) => {
                  this.logSelectedItem(err);
              }
          );
          }
        });
        this._uploadReportAndSaveEval(item, afterSaveRecordFn, stayOnSelectedItem);
      } else {
        this._saveRecord(item, afterSaveRecordFn, stayOnSelectedItem);
      }
    }
  }

  saveEvaluationActivity(item: any, afterSaveFn?: Function) {
    const EVALUATION_UUID = item.model.clientService;
    const COMPONENT_UUID = item.model.selectedActivityComponent;
    const ACTIVITY_DETAIL_UUID = item.model.selectedActivityDetail;
    const URL = this.plUrls.urls.evaluationActivities.replace(':evaluation_uuid', EVALUATION_UUID);
    const PARAMS = { activity: COMPONENT_UUID, activity_detail: ACTIVITY_DETAIL_UUID };

    this.plHttp.save('', PARAMS, URL).subscribe(
      (res: any) => {
        if (this.isAmendable(item)) {
          const ea = item.model.savedEvaluationActivities.find((_: any) =>
            !_.uuid &&
            _.activity.uuid === COMPONENT_UUID &&
            (!_.activityDetail || _.activityDetail.uuid === ACTIVITY_DETAIL_UUID)
          );
          ea.evalActivityUuid = res.uuid;
        }
        this.debugResponse('save eval activity RESPONSE', res);
        this.logSelectedItem();
        if (afterSaveFn) afterSaveFn(res);
        this.setActivityComponents(item);
      },
      (error: any) => {
        this.debugError('save eval activity ERROR', error);
        if (error.status === 403 && error.error.detail === 'You do not have permission to perform this action.') {
          this.plToast.show('error', 'Can not create documentation for an evaluation not assigned to you.', 5000, true);
          return;
        }
        this.doneSavingWithError(item, error, PARAMS);
      }
    );
  }

  saveEvaluationActivityDetail(item: any, activityItem: any) {
    const activityUuid = activityItem.evalActivityUuid;
    const evaluation_uuid = item.model.clientService;
    const completedDate = activityItem.savedEvalActivity.modelCompletedDate;

    const URL = this.plUrls.urls.evaluationActivities.replace(':evaluation_uuid', evaluation_uuid);
    const FINISHED_URL = `${URL}${activityUuid}/`;

    const PARAMS = {
      uuid: activityUuid,
      evaluation_uuid,
      signed_on: completedDate && this.util.getLocalizedDateUTC(completedDate, this.providerTimezone),
      status: activityItem.savedEvalActivity.status,
    };

    this.plHttp.save('', PARAMS, FINISHED_URL).subscribe(
      (res: any) => {
        activityItem.savedEvalActivity = res;
        this.initSavedActivity(res);
        this.util.log('saved eval activity detail', {savedActivity: activityItem.savedEvalActivity});
      },
      (error: any) => {
        this.debugError('save eval activity status ERROR', error);
      },
    )
  }

  getActivityDateCompletedDisplayValue(activityItem: any) {
    const signedOn = activityItem.savedEvalActivity.signed_on;
    return (signedOn && moment.tz(signedOn, this.providerTimezone).format('M/DD/YYYY')) || '';
  }

  deleteEvaluationActivity(item: any, activityUuid: string, afterSuccess: Function, afterError: Function) {
    // prevent multiple rapid clicks on delete activity button
    this._state.deletedActivities = this._state.deletedActivities || {};
    if (this._state.deletedActivities[activityUuid]) {
        return;
    }
    this._state.deletedActivities[activityUuid] = 1;

    const EVALUATION_UUID = item.model.clientService;
    const URL = this.plUrls.urls.evaluationActivities.replace(':evaluation_uuid', EVALUATION_UUID);
    const FINISHED_URL = `${URL}${activityUuid}/`;
    this.plHttp.delete('', {}, FINISHED_URL)
    .subscribe(
      (res: any) => {
        this.debugResponse('PA delete eval activity RESPONSE', res);
        delete this._state.deletedActivities[activityUuid];
        afterSuccess(res);
        this.setActivityComponents(item);
      },
      (error: any) => {
        delete this._state.deletedActivities[activityUuid];
        this.debugError('PA delete eval activity ERROR', {error, deletedActivities: this._state.deletedActivities});
        this.doneSavingWithError(item, error, { eval: EVALUATION_UUID, activity: activityUuid });
        afterError(error);
      });
  }

  getSavedActivityCounts(item: any) {
    const activitiesCountMap = {};
    const activities = item.model.savedEvaluationActivities;
    if (activities && activities.length) {
      activities.forEach((_: any) => {
        // prevent a runtime error when bad data
        if (!_.activity) return;

        const activityCount = activitiesCountMap[_.activity.uuid] || 0;
        activitiesCountMap[_.activity.uuid] = activityCount + 1;
      });
    }
    return activitiesCountMap;
  }

  // Obtain the following data:
  // - available activities options
  // - historical activities saved on the eval
  fetchEvaluationActivities(item: any) {
    if (item.state.fetchEvalActivitiesInFlight) return;

    item.state.fetchEvalActivitiesInFlight = true;

    const isEval = this.isEvaluationAppointment(item);
    const id = item.model.clientService;

    if (!isEval || !id) {
      item.state.fetchEvalActivitiesInFlight = false;
      return;
    };

    const activityQueryFilters = this.util.flagLocalStorage('DEV_NO_ACTIVITY_QUERY_FILTERS')
      ? {}
      : {
        location_uuid: item.location.uuid,
        start: moment.utc(item.appointment.start).format('YYYY-MM-DD HH:mm:ss'),
      };

    const ACTIVITIES_QUERY_PARAMS = {
      expand: 'details',
      limit: MAX_QUERY_LIMIT,
      ...activityQueryFilters,
    };

    const savedActivitiesURL = this.plUrls.urls.evaluationActivities.replace(':evaluation_uuid', id);

    const GET_ACTIVITIES = this.plHttp.get('activities', ACTIVITIES_QUERY_PARAMS);
    const GET_SAVED_ACTIVITIES = this.plHttp.get('', { expand: ['activity','activity_detail']}, savedActivitiesURL);

    forkJoin([
      GET_ACTIVITIES,
      GET_SAVED_ACTIVITIES,
    ])
    .pipe(
      first(),
      finalize(() => {
        item.state.fetchEvalActivitiesInFlight = false;
      })
    )
    .subscribe((res: any) => {
        const availableActivities = res[0].results;
        const savedActivities = res[1].results;

        this.debugResponse('activity options', availableActivities);
        this.debugResponse('saved activities', savedActivities);

        if (!availableActivities.length) {
          this.util.warnLog('No available activity options were returned by the activities API', {item, res, });
        }

        item.evalActivitiesRaw = availableActivities;

        // ----- handle saved activities
        const activeEvalActivities = savedActivities.filter((_: any) => _.is_active);
        activeEvalActivities.sort((a: any, b: any) => moment(b.created).valueOf() - moment(a.created).valueOf());

        item.model.savedEvaluationActivities = activeEvalActivities.reduce((result: any, savedEvalActivity: any) => {
          result.push({
            savedEvalActivity,
            activity: savedEvalActivity.activity_expanded,
            activityDetail: savedEvalActivity.activity_detail_expanded,
            evalActivityUuid: savedEvalActivity.uuid,
          });
          this.initSavedActivity(savedEvalActivity);
          return result;
        }, []);
        if (this.isAmendable(item) && !item.clone.model.savedEvaluationActivities) {
            item.clone.model.savedEvaluationActivities = JSON.parse(JSON.stringify(item.model.savedEvaluationActivities));
        }

        this.setActivityComponents(item);
      },
      (error: any) => {
        item.model.savedEvaluationActivities = [];
        this.util.errorLog('get eval activities ERROR', {item, error});
      });
  }

  initSavedActivity(savedEvalActivity: any) {
    const signedOn = savedEvalActivity.signed_on;
    savedEvalActivity.modelCompletedDate = signedOn && this.util.formatUserDateSystem(moment.tz(signedOn, this.providerTimezone));
  }

  getClientServices(clientIds: Array<any>, statusAll?: boolean, limit?: Number, offset?: Number) {
    const _clientIds = clientIds.join(',');
    const _serviceTypeCodes = this._model.__providerServiceTypeList.map((item: any) => item.code).join(',');
    const params = { _clientIds, _serviceTypeCodes};
    if (!statusAll) {
      params[`_status_In`] = 'IN_PROCESS,NOT_STARTED,IDLE,COMPLETED,CANCELLED';
    }
    if (limit) {
      params[`_limit`] = limit;
    }
    if (offset || offset === 0) {
      params[`_offset`] = offset;
    }
    return this.plGraphQL.query(`query ClientServicesServices
      ($_clientIds: String, $_serviceTypeCodes: String ${statusAll ? '' : ', $_statusIn: String'} ${limit ? ', $_limit: Int!' : ''} ${offset || offset === 0 ? ', $_offset: Int!' : ''}) {
      clientServices (clientId_In: $_clientIds, serviceTypeCode_In: $_serviceTypeCodes ${statusAll ? '' : ', status_In: $_statusIn'} ${limit ? ', first: $_limit' : ''} ${offset || offset === 0 ? ', offset: $_offset' : ''}) {
        edges {
          node {
            __typename
            ... on DirectService {
              ${this.plGQLStrings.directServiceFull}
            }
            ... on Evaluation {
              id
              isActive
              created
              locked
              assignedTo {
                id
                username
                firstName
                lastName
              }
              evaluationType
              areasOfConcern {
                ${this.plGQLStrings.areasOfConcern}
              }
              assessmentsUsed {
                ${this.plGQLStrings.assessmentsUsed}
              }
              createdBy {
                ${this.plGQLStrings.createdBy}
              }
              client {
                id
                ${this.plGQLStrings.clientName}
                ${this.plGQLStrings.clientLanguages}
                ${this.plGQLStrings.clientEvalDates}
                locations {
                  edges {
                    node {
                      id
                      name
                    }
                  }
                }
              }
              bilingual
              service {
                ${this.plGQLStrings.service}
              }
              ${this.plGQLStrings.evaluation}
              evaluationTypeDisplay
              permissions {
                updateEvaluation
                reassignEvaluation
                reassignEvaluationWithoutBillingImplicationCheck
              }
              reassignmentHasBillingImplications
            }
          }
        }
      }
    }`, params, {})
    .pipe(
      first(),
    );
  }

  getEvaluationStatusDisplayValue(item: any) {
    if (!this.isEvaluationAppointment(item)) return;
    return Const.clientServiceStatusDisplayValue[item.model.evaluationStatus];
  }

  getMetricsPoints(item: any) {
    if (item.record) {
      this.iepService.getMetricPoints(item.record.uuid, this._state, (res: any) => {
        item.state.metricsPoints = res.goalMetricPoints;
      });
    }
  }

  importMetrics(item: any) {
    item.model.metricsPoints = item.state.metricsPoints
      .map( (item: any) => `${item.metric.name}: ${item.correct}/${item.trials} (${item.percentage}%)`)
      .join('; ');
    item.model.notes.objective += '\n\n' + item.model.metricsPoints;
  }

  // NOTE: applies only to SOAP 'objective'
  shouldShowImportMetricsPoints(item: any) {
    return item.state.metricsPoints && item.state.metricsPoints.length && !item.model.metricsPoints;
  }

  findActivityComponentByUuid(activityUuid: String) {
    return this.selectedAppointment.evalActivitiesRaw.find((_: any) => _.uuid === activityUuid);
  }

  findActivityDetail(activityUuid: String, detailUuid: String) {
    const activity = this.findActivityComponentByUuid(activityUuid);
    if (detailUuid) {
      const details = activity.details_expanded;
      if (details && details.length) {
        return details.find((item: any) => {
          return item.uuid === detailUuid;
        });
      }
    }
    return null;
  }

  getSelectedItem() {
    return this.selectedAppointment;
  }

  setSelectedItem(item: any) {
    const appt = this.selectedAppointment;
    if (appt && !this.isInSameEventGroup(appt, item)) {
      appt.state.groupFlags = {};
    }
    this.selectedAppointment = item;
    this._refreshView();
    this._resetAppointment(this.selectedAppointment);
    return item;
  }

  getSelectedIndex() {
    if (!this._model.appointmentsList) {
      return -1;
    }
    return this._model.appointmentsList.findIndex((item: any) => {
      return item.itemKey === this.selectedAppointment.itemKey;
    })
  }

  hasSelectedLastItem() {
    if (!this._model.appointmentsList) {
      return false;
    }
    return this.getSelectedIndex() === this._model.appointmentsList.length - 1;
  }

  getAppointmentType(item: any) {
    return item.info.type;
  }

  getListItemDisplayTitle(item: any) {
    const sortType = this.getSortType();
    switch(sortType) {
      case 'name':
        return item.displayTitle_sortName;
      case 'location':
        return item.displayTitle_sortLocation;
      default: // 'natural' date sort
        return item.displayTitle_sortNatural;
    }
  }

  getPercentCompleteInfo() {
    const unsignedCount = this._state.unsignedAppointmentsCount;
    const signedCount = this._state.signedAppointmentsCount;
    const total = unsignedCount + signedCount;
    const signedPercent = Math.floor(signedCount * 100.0 / total);
    const unsignedPercent = 100 - signedPercent;
    return { signedPercent, unsignedPercent };
  }

  getEndMessage() {
    if (this._state.workCompleteMessageInfo) {
      return this._state.workCompleteMessageInfo;
    }
    const random = Math.floor(Math.random() * WorkCompleteMessages.length);
    return this._state.workCompleteMessageInfo = WorkCompleteMessages[random];
  }

  getSavingErrorMessage() {
    return this.selectedAppointment.state.savingErrorMessage;
  }

  getSaveErrors(item: any) {
    return item.info.errors;
  }

  setOnSelectAppointmentCallback(fn: Function) {
    this._state.onSelectAppointmentCallback = fn;
  }

  setOnProcessAPIErrors(fn: Function) {
    this._state.onProcessAPIErrorsCallback = fn;
  }

  // used to force view refreshes (e.g. to trigger transition animations)
  toggle() {
    this._state.toggle = !this._state.toggle;
  }

  getToggle() {
    if (!this.isDataLoaded()) {
      return true;
    }
    return this._state.toggle;
  }

  getLocalDate(date: string) {
    const TZ = this.providerTimezone;
    const dateTime = moment(date);
      return TZ ? dateTime.tz(TZ) : dateTime;
  }

  getLocalizedDateMoment(date: string) {
    return this.util.getLocalizedDateMoment(date, this.providerTimezone);
  }

  getLocalizedDateValueNoOffset(date: string) {
    return this.util.getLocalizedDateValueNoOffset(date, this.providerTimezone);
  }

  getLocalizedDateValueWithOffset(date: string) {
    return this.util.getLocalizedDateValueWithOffset(date, this.providerTimezone);
  }

  getLocalizedDateUTC(date: string) {
    return this.util.getLocalizedDateUTC(date, this.providerTimezone);
  }

  // this adjusts for repeating events crossing DST line
  getDSTAdjustedAppointmentDatesForSave(A: any) {
      const dates = this.util.computeAppointmentLocalDateTimes(A, this.providerTimezone, false);
      return { start: dates.startFormattedISO, end: dates.endFormattedISO };
  }

  getComputedAppointmentDates(item: any) {
    const appointment = item.appointment;
    let result;
    let info = item.state.recurringAppointmentInfo;
    if (info) {
      result = {
        start: info.apptStart,
        end: info.apptEnd,
      };
    } else {
      result = {
        start: appointment.start,
        end: appointment.end,
      };
    }
    return result;
  }

  getSortType() {
    return this._state.sortType;
  }

  getVersionString() {
    return 'v1.0.5';
  }

  // shows up in HEAP logs
  getTelemetryInfoClasses(item: any) {
    const pageLoadTime = this.isStandaloneAppointment() ? this.getItemLoadTime(item) : this.getInitialPageLoadTime();
    const invoicePreviewLoadTime = this.getInvoicePreviewLoadTime();
    const apiErrorInfo = this.hasSaveErrors(item) && item.info.apiErrorMessageClass ? [
        `API-ERR-MSG-${item.info.apiErrorMessageClass}`,
        `API-ERR-PATH-${item.info.apiErrorPathClass}`,
     ] : [];
     if ((item.info.apiErrorMessage || '').startsWith('Duplicate appointments are not allowed')) {
         apiErrorInfo.push('API-ERR-CODE-DUPLICATE-APPOINTMENT');
     }
    const classes = [
      `pl-telemetry`,
      `source-${this.isStandaloneAppointment()?'cal':'ida'}`,
      `ida-version-${this.getVersionString()}`,
      `signed-${!!item.model.signed}`,
      `error-${!!this.getSavingErrorMessage()}`,
      `save-api-errors-${!!this.hasSaveErrors(item)}`,
      `invoice-preview-${invoicePreviewLoadTime === 'cached'?'cached':'refreshed'}`,
      `PROVIDER-${this.provider.first_name}.${this.provider.last_name}.${this.provider.username}.${this.provider.uuid}`,
      `load-time-${pageLoadTime}`,
      /* @ts-ignore */
      ...apiErrorInfo,
    ];
    if (!this.isStandaloneAppointment()) {
        classes.push(`page-load-time-${pageLoadTime}`);
        classes.push(`invoice-preview-load-time-${invoicePreviewLoadTime}`);
    }
    if (item.model.oBillingCode) {
      classes.push(`BC-${item.model.oBillingCode.code}`);
    }
    const clientService = item.model.oClientService;
    if (clientService) {
      classes.push(`CS-${clientService.service.code}`);
    }
    const client = item.client;
    if (client && client.uuid) {
      classes.push(`CLIENT-${client.first_name}.${client.last_name}.${client.uuid}`);
    }
    const appt = item.model.appointment;
    if (appt) {
      classes.push(`APPT-start-${appt.start}.end-${appt.end}`);
      if (appt.uuid) {
        classes.push(`APPT-uuid-${appt.uuid}`);
      }
    }
    if (this.isClientAppointment(item) && this.hasDataParsingError(item, 'ERR_CLIENT_NOT_IN_CASELOAD')) {
      classes.push(`ERR-not-in-caseload-${item.client.uuid}`)
    }
    if (pageLoadTime < 100) {
      classes.push('page-load-time-under-100ms')
    } else if (pageLoadTime >= 1000 && pageLoadTime < 5000) {
      classes.push('page-load-time-under-5s')
    } else if (pageLoadTime >= 5000 && pageLoadTime < 10000) {
      classes.push('page-load-time-5-10s')
    } else if (pageLoadTime >= 10000 && pageLoadTime < 15000) {
      classes.push('page-load-time-10-15s')
    } else if (pageLoadTime >= 15000) {
      classes.push('page-load-time-over-15s')
    }
    return classes.join(' ');
  }

  getInitialPageLoadTime() {
    return this._state.startupInfo.timings.loadPage || 0;
  }

  getItemLoadTime(item: any) {
    return item.info.pageLoadTime || 0;
  }

  getInvoicePreviewLoadTime() {
    return this._state.startupInfo.timings.loadInvoicePreview || 0;
  }

  getAppointmentGroup(item: any) {
    return item.state.appointmentGroup;
  }

  // generate a for-display only structure backed by
  // the appointmentsList model object
  // NOTE: perform list data mutations on _model.appointmentsList
  // and call setDisplayAppointmentGroups() on each mutation
  setDisplayAppointmentGroups() {
    const groupPast: any = [];
    const groupToday: any = [];
    const groupFuture: any = [];
    const groups = {
      past: groupPast,
      today: groupToday,
      future: groupFuture
    };
    this._model.appointmentsList.forEach((item:any) => {
      if (this.isPastAppointment(item)) {
        groupPast.push(item);
      } else if (this.isTodayAppointment(item)) {
        groupToday.push(item);
      } else {
        groupFuture.push(item);
      }
    });
    this._model.displayAppointmentGroups = groups;
  }

  // This is used for the main list iterable
  getAppointments(group?: any) {
    if (group) {
      return group;
    }
    if (this.isDateSort()) {
      return this.getGroupedAppointmentsArray();
    } else {
      return [this._model.appointmentsList];
    }
  }

  getGroupedAppointments() {
    return this._model.displayAppointmentGroups;
  }

  getGroupedAppointmentsArray() {
    const groups = this._model.displayAppointmentGroups;
    return groups ? [groups['past'], groups['today'], groups['future']] : [];
  }

  getGroupedRowIndex(groupIndex:any, itemIndex:number) {
    const groups = this.getGroupedAppointments();
    let sum = 0;
    if (groupIndex > 0) {
      sum += groups['past'].length;
    }
    if (groupIndex > 1) {
      sum += groups['today'].length;
    }
    return sum + itemIndex;
  }

  getAreasOfConcernList(item: any) {
    return item.areasOfConcernList;
  }

  getAssessmentsList(item: any) {
    return item.assessmentsList
  }

  //--------------------------------
  // PUBLIC boolean utility methods
  //--------------------------------

  isUserSchoolPsychologist() {
    return this._model.__isUserSchoolPsychologist;
  }

  isUserLeadClinician() {
    return this._model.__isUserLeadClinician;
  }

  isClientServiceRequired(item: any) {
    return !!item.model.oBillingCode.services.length;
  }

  isLocationRequired(item: any) {
    return !(item.model.oBillingCode.client_participates === 'NONE'
      && item.model.oBillingCode.location_participates === 'NONE');
  }

  isLocationTrackingRequired(item: any) {
    const billingCode = item.model.oBillingCode && item.model.oBillingCode.code;
    const serviceCode = item.model.oClientService && item.model.oClientService.service.code;
    const BC = Const.billingCode;
    const SC = Const.serviceCode;

    const isDirectServiceOrMakeup =
        (item.model.oBillingCode.code === 'direct_services') ||
        (item.model.oBillingCode.code === 'direct_makeup');

    const isEligibleBillingCodeAndServiceCode =

        // DIRECT SERVICES
        (
            (
                billingCode === BC.CONSULTATION ||
                billingCode === BC.STUDENT_ABSENCE_LT_24_HR ||
                billingCode === BC.STUDENT_ABSENCE_NO_NOTICE
            )
            &&
            (
                serviceCode === SC.SLT_SERVICES_DIRECT ||
                serviceCode === SC.OT_SERVICES_DIRECT ||
                serviceCode === SC.BMH_SERVICES_DIRECT
            )
        ) ||

        // CONSULTATION
        (
            (
                billingCode === BC.CONSULTATION ||
                billingCode === BC.STUDENT_ABSENCE_LT_24_HR ||
                billingCode === BC.STUDENT_ABSENCE_NO_NOTICE
            )
            &&
            (
                serviceCode === SC.SLT_CONSULTATION ||
                serviceCode === SC.OT_CONSULTATION ||
                serviceCode === SC.BMH_CONSULTATION
            )
        ) ||


        // SUPERVISION
        (
            (
                billingCode === BC.SL_OT_SUPERVISION_DIRECT ||
                billingCode === BC.SL_OT_SUPERVISION_INDIRECT_BY_CLIENT ||
                billingCode === BC.STUDENT_ABSENCE_LT_24_HR ||
                billingCode === BC.STUDENT_ABSENCE_NO_NOTICE
            )
            &&
            (
                serviceCode === SC.SLT_SUPERVISION ||
                serviceCode === SC.OT_SUPERVISION
            )
        );

    const hasLocationTracking = item.location && item.location.record_tracking_type;

    return hasLocationTracking && ( isDirectServiceOrMakeup || isEligibleBillingCodeAndServiceCode);
  }

  isDirectServiceAppointment(item: any) {
    return item.model.oBillingCode.code === 'direct_services';
  }

  isConsultationAppointment(item: any) {
    return item.model.oBillingCode.code === 'consultation';
  }

  isEvaluationAppointment(item: any) {
    const M = item.model;
    return M.oBillingCode && M.oBillingCode.code === 'evaluation'
      || (M.oClientService && !!M.oClientService.evaluationType);
  }

  isEvaluationModelStatusComplete(item: any) {
    return item.model.evaluationStatus === Const.clientServiceStatus.COMPLETED;
  }

  isEvaluationLocked(item: any) {
      return this.isEvaluationAppointment(item) && item.model.oClientService && item.model.oClientService.locked;
  }

  isSavedEvaluationStatusFinal(item: any) {
      return ( item.model.oClientService.status === Const.clientServiceStatus.COMPLETED
               || item.model.oClientService.status === Const.clientServiceStatus.CANCELLED );
  }

  isClientServiceEvalComplete(clientService: any) {
    return !!clientService.evaluationType && (
        clientService.status === Const.clientServiceStatus.COMPLETED ||
        clientService.status === Const.clientServiceStatus.CANCELLED
    );
  }

  isDirectClientServiceComplete(item: any) {
      return this.isDirectServiceAppointment(item)
        && (
            item.model.oClientService.status === Const.clientServiceStatus.COMPLETED
          || item.model.oClientService.status === Const.clientServiceStatus.CANCELLED
        );
  }

  isSeparatePsychEvals() {
      return false;
  }

  isPsychAssessmentAppointment(item: any) {
    return item.model.oClientService && item.model.oClientService.service.code === 'eval_pa';
  }

  isSelected(item: any) {
    return item.itemKey === this.selectedAppointment.itemKey;
  }

  isClientAppointment(item: any) {
    return this.getAppointmentType(item) === 'client';
  }

  isLocationAppointment(item: any) {
    return this.getAppointmentType(item) === 'location';
  }

  isOtherIndirectAppointment(item: any) {
    return this.getAppointmentType(item) === 'otherIndirect';
  }

  isDataLoaded() {
    return this._state.dataLoaded;
  }

  isSaving() {
    return this._state.saving;
  }

  isGlobalReadyState() {
    return this._state.globalReadyState;
  }

  isWorkComplete() {
    return this._state.unsignedAppointmentsCount <= 0;
  }

  isShowSignedItemsFlag() {
    return this.isDevDebug('SHOW_SIGNED');
  }

  isShowSignedItems() {
    return this._state.showSignedItems;
  }

  isGroupAppointment(item: any) {
      const clients = item.appointment.clients
      return clients && clients.length > 1;
  }

  getItemsInGroupAppointment(item: any) {
      // standalone multi-participant items share the same appt
      if (this.isStandaloneAppointment()) {
        return this.appointmentsList.filter((apptItem: any) => item.appointment.event.uuid === apptItem.appointment.event.uuid);
      }
      return [item];
  }

  isAppointmentEditable(item: any) {
    return !item.appointment.records.find((record: any) => record.signed);
  }

  shouldShowAllItems() {
    return this.isDevDebug('SHOW_SIGNED') && this.isDevDebug('IGNORE_DONE');
  }

  shouldShowList() {
    return (!this.isWorkComplete() || this.isIgnoreDoneAndDisplayAll());
  }

  shouldUseEvalActivityLimit() {
    return !!this.provider.xEnabledFeatures.find((feature: string) => feature === 'activity_limit');
  }

  isIgnoreDoneAndDisplayAll() {
    return this._model.allAppointmentsList && this._model.allAppointmentsList.length
      && this.shouldShowAllItems()
      && this.isShowSignedItems();
  }

  isInSameEventGroup(currentItem: any, nextItem: any) {
    if (!currentItem.state.group || !nextItem.state.group) return;
    return currentItem.state.group.headItem === nextItem.state.group.headItem;
  }

  cannotChangeDocumentation(item: any) {
    return !this.isAmendable(item) && this.isRecordLocked(item);
  }

  hasRecord(item: any) {
    return !!item.record;
  }

  isRecordLocked(item: any) {
    return !!(item.record && item.record.locked);
  }

  hasClientServices(item: any) {
    return item.clientServicesForBillingCode && item.clientServicesForBillingCode.length;
  }

  hasSelectedClientService(item: any) {
    return this.hasClientServices(item) && item.model.clientService;
  }

  // is a billing code selected from the dropdown
  // which, unfortunately, isn't always identical to the model value.
  hasSelectedBillingCode(item: any) {
    return item.model.billingCode && item.billingCodesList
      .find((code: any) => code.uuid === item.model.billingCode);
  }

  hasSelectedFileUpload(item: any) {
    return item.model.fileForUpload && item.model.fileForUpload.file;
  }

  hasNotes(item: any, /* S|O|A|P|G */whichNote: String) {
    const temp = {
      's': item.model.notes.subjective,
      'o': item.model.notes.objective,
      'a': item.model.notes.assessment,
      'p': item.model.notes.plan,
      'g': item.model.notes.notes,
    };
    return temp[`${whichNote.toLowerCase()}`];
  }

  hasCompleteSoapNotes(item: any) {
    return !!item.model.notes.subjective
      && !!item.model.notes.objective
      && !!item.model.notes.assessment
      && !!item.model.notes.plan;
  }

  hasCompletedEvaluation(item: any) {
    return item.model.oClientService && item.model.oClientService.status === Const.clientServiceStatus.COMPLETED;
  }

  hasMissingAssessmentActivity(item: any) {
    return this.isEvaluationAppointment(item) && !this.savedEvaluationActivities.length;
  }

  // allow removing all activities on an active eval unless signed
  requiresActivityToSave(item: any) {
    return item.model.signed
      && (item.model.evaluationStatus !== Const.clientServiceStatus.CANCELLED);
  }

  hasSavingErrors(item: any) {
    return item.state.errors && item.state.errors.length;
  }

  getMappedApiErrorMessage() {
      return this.selectedAppointment.state.mappedApiErrorMessage;
  }

  clearMappedApiErrorMessage() {
    this.selectedAppointment.state.mappedApiErrorMessage = null;
  }

  hasSaveErrors(item: any) {
    return item.info.errors && item.info.errors.length;
  }

  // use this to handle data conditions for which rendering the
  // item detail would be inappropriate or impossible.
  getDataParsingErrors(item: any) {
    const ERR_CLIENT_NOT_IN_CASELOAD = Const.errorTypes.ERR_CLIENT_NOT_IN_CASELOAD;

    if (item.state.dataParseErrors) {
      return item.state.dataParseErrors;
    }

    const temp = {count: 0};

    if (item.client && !this._model.__caseloadMap[item.client.uuid]) {
      temp[`${ERR_CLIENT_NOT_IN_CASELOAD}`] = {item};
      temp.count++;
    }

    if (temp.count) {
      item.state.dataParseErrors = Object.assign({}, temp);
    }
    return item.state.dataParseErrors;
  }

  hasDataParsingError(item: any, errorType: string) {
    const errors = this.getDataParsingErrors(item);
    return errors ? !!this.getDataParsingErrors(item)[errorType] : false;
  }

  requiresSoapNotes(item: any) {
    if (this.isLocationAppointment(item)) {
      return false;
    }
    if (this.isPsychAssessmentAppointment(item)) {
      return false;
    }
    const billingCodeRecordNoteType = item.model.oBillingCode.record_note_type;
    const notesSchema = this._globalData.__notesSchemasRaw.find((notesSchemaItem: any) => {
      return notesSchemaItem.uuid === billingCodeRecordNoteType;
    });
    return notesSchema && notesSchema.code === 'soap';
  }

  hasSoapNotes(item: any) {
      const S = item.model.notes.subjective;
      const O = item.model.notes.objective;
      const A = item.model.notes.assessment;
      const P = item.model.notes.plan;
      return !(S && S.trim().length)
          && !(O && O.trim().length)
          && !(A && A.trim().length)
          && !(P && P.trim().length);
  }

  isFutureAppointment(item: any) {
    return item.state.appointmentGroup === 'future';
  }

  isPastAppointment(item: any) {
    return item.state.appointmentGroup === 'past';
  }

  isTodayAppointment(item: any) {
    return item.state.appointmentGroup === 'today';
  }

  isGroupHeader(index: number) {
    const item = this._model.appointmentsList[index];
    if (index > 0) {
      const previousItem = this._model.appointmentsList[index - 1];
      return this.getAppointmentGroup(previousItem) !== this.getAppointmentGroup(item);
    }
    return true;
  }

  isActiveGroup(item: any) {
    return item.state.groupFlags && item.state.groupFlags.isActiveGroup;
  }

  isDateSort() {
    return this._state.sortType === 'natural';
  }

  isEditable(item: any) {
    return item && (!item.state.isSigned || !item.model.signed);
  }

  isSigned(item: any) {
    return item && item.state.isSigned;
  }

  isSignedCheckboxDirty(item: any) {
    return item && item.state.signedCheckboxDirty;
  }

  canSave(item: any) {
    return (!item.record || !item.record.signed)
        || (item.record.signed && !item.model.signed)
        || (item.record.signed && item.state.signedCheckboxDirty);
  }

  canUploadEvaluationDocument(item: any)  {
    return this.isEvaluationReportType(item);
  }

  hasIncompleteActivity(item: any) {
    const activities = item.model.savedEvaluationActivities
    return activities && activities.find((ea: any) => ea.savedEvalActivity.status !== 'done');
  }

  someEvaluationActivitiesRequireDoneStatus(item: any) {
    return this.isEvaluationAppointment(item)
    && this.isEvaluationModelStatusComplete(item)
    && this.hasIncompleteActivity(item);
}

  isEvaluationReportType(item: any) {
    const clientService = item.model.oClientService;
    return clientService && this.evaluationDocumentType.services.find((service: any) => {
      return service === clientService.service.id;
    });
  }

  isEvaluationReportRequiredAndMissing(item: any) {
    return this.isEvaluationAppointment(item)
      && this.canUploadEvaluationDocument(item)
      && this.isEvaluationModelStatusComplete(item)
      && !this.hasCompletedEvaluation(item)
      && !this.hasSelectedFileUpload(item);
  }

  isEvaluationAssessmentSelectionRequiredAndMissing(item: any) {
      // no longer used - using activity components now
      return false;
  }

    // avoid duplicate appointments
    // can occur from stale data on calendar with room documentation in another window
    findPersistedAppointment(appointment: any) {
        const A = appointment;
        const data = {
            event: A.event.uuid,
            original_start: A.original_start,
            original_end: A.original_end,
            persisted_only: true,
            provider: this.provider.uuid,
            calendar_view: true,
        };
        return this.plHttp.get('appointments', data);
    }

  // the date values on the appointment must be to be correctly adjusted
  // in the calling context. No further adjustments are made internally.
  saveDateTime(appointment: any, item: any) {
    const A = appointment;
    const reason_for_edit = A.reason_for_edit;
    const REASON_FOR_EDIT = reason_for_edit ? {reason_for_edit} : {};

    const logData = { new: appointment, old: item.appointment };

    if (A.uuid) {
        this.util.log('Save datetime-range PATCH appointment', logData);
        return this.plHttp.save('appointments', {
            uuid: A.uuid,
            start: A.start,
            end: A.end,
            ...REASON_FOR_EDIT,
        }, '', {suppressError: true});
    } else {
        // if part of a repeating event, create the appointment
        // if not part of a repeating event, update the event
        if (A.event.repeating) {
            this.util.log('Save datetime-range CREATE appointment (member of repeating event)', logData);
            return this.plHttp.save('appointments', {
                event: A.event.uuid,
                start: A.start,
                end: A.end,
                original_start: item.appointment.original_start,
                original_end: item.appointment.original_end,
                ...REASON_FOR_EDIT,
            }, '', {suppressError: true});
        } else {
            this.util.log('Save datetime-range PATCH event', logData);
            return this.plHttp.save('events', {
                uuid: A.event.uuid,
                start: A.start,
                end: A.end,
                provider: this.provider.uuid,
                billing_code: A.event.billing_code,
                event_type: 'BILLING',
                title: `${item.location ? item.location.name : ''} - ${item.billingCode.name}`,
                ...REASON_FOR_EDIT,
            }, '', {suppressError: true});
        }
    }
  }

  setRecurringAppointmentInfo(item: any) {
      item.state.recurringAppointmentInfo = this.getLocalDateTimes(item.appointment)
      this.isStandaloneAppointment()
        ? this.getLocalDateTimes(item.appointment)
        : this.util.computeAppointmentLocalDateTimes(item.appointment, this.providerTimezone);
  }

  getLocalDateTimes(A: any) {
      return this.util.getLocalDateTimes(A, this.providerTimezone);
  }

  getAppointmentLocalDateTimes(A: any) {
      return this.util.computeAppointmentLocalDateTimes(A, this.providerTimezone);
  }

  logAppointmentDebugInfo(message: string, A: any) {
      this.util.log(message, {
          A,
          A1_start: A.start,
          A2_end: A.end,
          E_start: A.event.start,
      });
  }

  updateLocalAppointmentDateTime(item: any, appointment: any) {
      item.appointment.start = appointment.start;
      item.appointment.end = appointment.end;

      // this updates the item detail header
      this.setRecurringAppointmentInfo(item);


      // the following updates the list item display titles and resulting sort position
      const apptStartLocal = this.getLocalDate(appointment.start);

      // update the list item titles for each sort mode
      const apptStartListItemDisplayValue = `${apptStartLocal.format('ddd').toUpperCase()} ${apptStartLocal.format('M/D')}`;

      const sortNaturalTitleParts = item.displayTitle_sortNatural.split(' - ');
      sortNaturalTitleParts[0] = apptStartListItemDisplayValue;
      item.displayTitle_sortNatural = sortNaturalTitleParts.join(' - ');

      const sortNameTitleParts = item.displayTitle_sortName.split(' - ');
      sortNameTitleParts[sortNameTitleParts.length - 1] = apptStartListItemDisplayValue;
      item.displayTitle_sortName = sortNameTitleParts.join(' - ');

      const sortLocationTitleParts = item.displayTitle_sortLocation.split(' - ');
      sortLocationTitleParts[sortLocationTitleParts.length - 1] = apptStartListItemDisplayValue;
      item.displayTitle_sortLocation = sortLocationTitleParts.join(' - ');

      // update the list item sort keys for each sort mode
      const apptStartSortValue = `${apptStartLocal.valueOf()}`;

      const sortKeyNaturalParts = item.sortKeyNatural.split(',');
      sortKeyNaturalParts[0] = apptStartSortValue;
      item.sortKeyNatural = sortKeyNaturalParts.join(',');

      const sortKeyNameParts = item.sortKeyName.split(',');
      sortKeyNameParts[sortKeyNameParts.length - 1] = apptStartSortValue;
      item.sortKeyName = sortKeyNameParts.join(',');

      const sortKeyLocationParts = item.sortKeyLocation.split(',');
      sortKeyLocationParts[sortKeyLocationParts.length - 1] = apptStartSortValue;
      item.sortKeyLocation = sortKeyLocationParts.join(',');

      this.setAppointmentGroup(item);
  }

  sortItems(item: any) {
      if (this.getSortType() === 'name') {
          this.sortByNameOrder(item);
      } else if (this.getSortType() === 'location') {
          this.sortByLocationOrder(item);
      } else {
          this.sortByNaturalAppointmentOrder(item);
      }
  }

  logSelectedItem(msg?: string) {
      this.util.log(`${msg || ''} selected item: ${this.getSelectedIndex()}`, { item: this.selectedAppointment });
  }

  //-------------------------
  // PUBLIC UI event handlers
  //-------------------------

  onChangeBillingCode($event: any) {
    const selectedBillingCode = $event.model;
    const item = this.selectedAppointment;
    item.model.oBillingCode = item.billingCodesList.find(((billingCode: any) => {
      return billingCode.uuid === selectedBillingCode;
    }));
    if (this.isEvaluationAppointment(item)) {
        this.setActivityComponents(item);
    }
    this._handleAfterChangeBillingCode(item);
  }

  // compare current item state with item.clone and return an {oldValue, newValue} (display) tuple
  getAmendedField(item: any, fieldName: string) {
      // original state deep clone
      const CLONE = item.clone;
      // helpers
      const field = (_: string) => _ === fieldName;
      const values = (testFn: any, valueFn: any) =>
        (testFn(CLONE) !== testFn(item)) && { oldValue: valueFn(CLONE), newValue: valueFn(item) };

      if (field('billingCode')) {
          return values(
              (_: any) => _.model.billingCode,
              (_: any) => _.model.oBillingCode.name
          );
      }
      if (field('clientService')) {
          return values(
              (_: any) => _.model.clientService,
              (_: any) => _.model.oClientService && _.model.oClientService.service.name
          );
      }
      if (field('trackingType')) {
          const trackingTypeOpts = this._model.__locationTrackingOpts;
          return values(
              (_: any) => _.model.trackingType,
              (_: any) => {
                  const val = trackingTypeOpts.find((tt: any) => tt.value === _.model.trackingType);
                  return val && val.label || '';
              }
          );
      }
      if (field('subjective') || field('objective') || field('assessment') || field('plan') || field('notes')) {
          return values(
              (_: any) => _.model.notes && _.model.notes[fieldName],
              (_: any) => _.model.notes && _.model.notes[fieldName]
          );
      }
      if (field('areasOfConcern')) {
          return values(
              (_: any) => _.model.areasOfConcern && _.model.areasOfConcern.sort().join(),
              (_: any) => _.model.areasOfConcern && _.model.areasOfConcern.map((id: string) => item.areasOfConcernList.find((aoc: any) => aoc.uuid === id).name)
          )
      }
      if (field('evalActivities')) {
        return values(
            (_: any) => {
                const EA = _.model.savedEvaluationActivities;
                return EA && EA.map((a: any) => a.activity.uuid).sort().join()
            },
            (_: any) => {
                let EA = _.model.savedEvaluationActivities;
                if (_.clone) {
                  EA = EA.filter((ea: any) => !ea.queuedForDelete);
                }
                return EA && EA.map((a: any) => {
                  const activity = a.activity.name;
                  const detail = (a.activityDetail && a.activityDetail.name && ` (${a.activityDetail.name})`) || '';
                  return `${activity}${detail}`;
                })
            }
        )
      }
      if (field('evalStatus')) {
          const evalStatusOpts = this.data.__evalStatusOpts;
          return values(
              (_: any) => _.model.evaluationStatus,
              (_: any) => {
                  const val = evalStatusOpts.find((es: any) => es.value === _.model.evaluationStatus);
                  return val && val.label || '';
              }
          );
      }
      if (field('dateTime')) {
          return values(
              (_: any) => `${_.model.startDate}${_.model.endDate}`,
              (_: any) => {
                  const start = moment.tz(_.model.startDate, this.providerTimezone);
                  const end = moment.tz(_.model.endDate, this.providerTimezone);
                  const LONG_DATE_FORMAT = 'ddd - MMM D, YYYY h:mma';
                  return {
                    start: start.format(LONG_DATE_FORMAT),
                    end: end.format(LONG_DATE_FORMAT),
                  }
              }
          );
      }
  }

  hasAmendedFields(item: any) {
    const hasAmendedBillingCode = this.hasSelectedBillingCode(item)
      && this.getAmendedField(item, 'billingCode');
    const hasAmendedClientService = this.hasSelectedBillingCode(item)
      && this.hasClientServices(item)
      && this.getAmendedField(item, 'clientService')
    const hasAmendedTrackingType = this.hasSelectedBillingCode(item)
      && this.isLocationTrackingRequired(item)
      && this.getAmendedField(item, 'trackingType');
    const notes = item.model.notes;
    return !! (
      hasAmendedBillingCode ||
      hasAmendedClientService ||
      hasAmendedTrackingType ||
      notes && this.getAmendedField(item, 'subjective') ||
      notes && this.getAmendedField(item, 'objective') ||
      notes && this.getAmendedField(item, 'assessment') ||
      notes && this.getAmendedField(item, 'plan') ||
      notes && this.getAmendedField(item, 'notes') ||
      this.getAmendedField(item, 'areasOfConcern') ||
      this.getAmendedField(item, 'evalActivities') ||
      this.getAmendedField(item, 'evalStatus')
    );
  }

  isAmendmentsEnabled() {
    return this._provider.xEnabledFeatures && this._provider.xEnabledFeatures.includes('amendments');
  }

  isAmendable(item: any): boolean {
      const appointmentDay = this.util.getDateString(item.appointment.start, this.providerTimezone);
      const isAmendableDay = item.dateStateRaw.amendable.find((amendableDay: string) => amendableDay === appointmentDay);
      return this.isAmendmentsEnabled() && !!(item.amendable || (isAmendableDay));
  }

  isAmendablePastEvent(item: any) {
    return this.isAmendable(item) && this.hasRecord(item);
  }

  isAmendableNewEvent(item: any): boolean {
    return this.isAmendable(item) && !this.hasRecord(item);
  }

  hasAmendments(item: any): boolean {
      return this.hasAmendedFields(item);
  }

  hasAmendmentsForNewEvent(item: any): boolean {
    return this.isAmendable(item) && this.hasAmendedFields(item) && !this.hasRecord(item);
  }

  hasAmendmentReason(item: any): boolean {
    return !!item.model.amendmentReason;
  }

  hasAmendedDateTime(item: any) {
    return this.getAmendedField(item, 'dateTime');
  }

  hasAmendedDateTimeForNewEvent(item: any) {
    return this.isAmendable(item) && this.hasAmendedDateTime(item) && !this.hasRecord(item);
  }

  lockedNotAmendable(item: any) {
    return (this.isRecordLocked(item) && !this.isAmendable(item));
  }

  notAmendableNotLocked(item: any) {
    return !this.isAmendable(item) && (!this.hasRecord(item) || !this.isRecordLocked(item));
  }

  amendableNotLocked(item: any) {
    return this.isAmendable(item) && (!this.hasRecord(item) || !this.isRecordLocked(item));
  }

  isPastEventMissingAmendments(item: any) {
    return (this.isAmendablePastEvent(item) && !(this.hasAmendments(item) && this.hasAmendmentReason(item)));
  }

  isNewEventMissingAmendments(item: any) {
    return (this.isAmendableNewEvent(item) && !(this.hasAmendmentsForNewEvent(item) && this.hasAmendmentReason(item)));
  }

  isPastEventMissingDateTimeAmendments(item: any) {
    return (this.isAmendablePastEvent(item) && !(this.hasAmendedDateTime(item) && this.hasAmendmentReason(item)));
  }

  isNewEventMissingDateTimeAmendments(item: any) {
    return (this.isAmendableNewEvent(item) && !(this.hasAmendedDateTimeForNewEvent(item) && this.hasAmendmentReason(item)));
  }

  canShowAmendmentReasonSection(item: any) {
    const hasAmendmentsPastEvent = this.isAmendable(item) && this.hasAmendments(item) && !this.isEditingDateTime(item);
    const hasAmendmentsNewEvent = this.isAmendable(item) && this.hasAmendmentsForNewEvent(item) && !this.isEditingDateTime(item);
    const hasAmendmentsDateTimePastEvent = this.isAmendable(item) && this.hasAmendedDateTime(item) && this.isEditingDateTime(item);
    const hasAmendmentsDateTimeNewEvent = this.isAmendable(item) && this.hasAmendedDateTimeForNewEvent(item) && this.isEditingDateTime(item);
    return hasAmendmentsPastEvent || hasAmendmentsNewEvent || hasAmendmentsDateTimePastEvent || hasAmendmentsDateTimeNewEvent;
  }

  addReasonForEditToSavePayload(item: any, payload: any) {
    payload.reason_for_edit = `[${item.model.amendmentReason}] ${(item.model.amendmentNotes && item.model.amendmentNotes.trim()) || ''}`;
  }

  isEditingDateTime(item: any) {
    return item.state.editingDateTime;
}

  initCloneState(item: any) {
      item.model.startDate = item.appointment.start;
      item.model.endDate = item.appointment.end;
      item.amendable = this.isAmendable(item);
      // deep clone the initial state
      item.clone = JSON.parse(JSON.stringify(item));
  }

  cloneAmendableDateTimeState(item: any) {
    item.clone.model.startDate = item.model.startDate;
    item.clone.model.endDate = item.model.endDate;
  }

  onChangeClientService($event: any, fn?: Function) {
    const item = this.selectedAppointment;
    item.model.oClientService = item.clientServicesList.find(((clientService: any) => {
      return clientService.id === $event.model;
    }));
    this._handleAfterChangeClientService(item, fn);
  }

  onChangeEvaluationStatus($event: any) {
    this.util.log('selected item (onChangeEvaluationStatus)', this.selectedAppointment);
  }

  onChangeEvalActivityStatus($event: any, activityItem: any) {
    const status = activityItem.savedEvalActivity.status;
    if (status !== 'done') {
      activityItem.savedEvalActivity.modelCompletedDate = null;
    }
    this.util.log('selected item (onChangeEvalActivityStatus)', {item: this.selectedAppointment, value: $event});
    this.saveEvaluationActivityDetail(this.selectedAppointment, activityItem);
  }

  onChangeEvalActivityCompletedDate($event: any, activityItem: any) {
    const completedDate = activityItem.savedEvalActivity.modelCompletedDate;
    if (completedDate) {
      activityItem.savedEvalActivity.status = 'done';
    }
    this.util.log('selected item (onChangeEvalActivityCompletedDate)', {item: this.selectedAppointment, value: $event});
    this.saveEvaluationActivityDetail(this.selectedAppointment, activityItem);
  }

  onSelectItem(isItemClick: boolean) {
    setTimeout(() => {
      if (this.shouldShowList()) {
        if (!isItemClick && !this.isStandaloneAppointment()) {
          document.getElementById(`row_${this.getSelectedIndex()}`).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
        }
        this.onNextItem(this.selectedAppointment);
      }

      setTimeout(() => {
        this._state.globalReadyState = true;
      }, 1);
    }, 200);
  }

  // pseudo event handler
  onNextItem(item: any) {
    if(!item) {
      return;
    }
    item.info.telemetry = this.getTelemetryInfoClasses(item).split(' ');
    if (this.isEvaluationAppointment(item)) {
      this.fetchEvaluationActivities(item);
    } else if (item.billingCode && item.record && this.requiresSoapNotes(item)) {
      this.getMetricsPoints(item);
    }
    this._setSelectedEventGroup();
  }

  setActivityComponents(item: any) {
    const selectedService = item.model.oClientService && item.model.oClientService.service;
    if (!selectedService) {
        return;
    }

    const savedActivityCounts = this.getSavedActivityCounts(item);
    setTimeout(() => {
      item.activityComponentOpts = item.evalActivitiesRaw
        .filter((_: any) => _.service === selectedService.id)
        .map((_: any) => {
            const limit = (_.max_usage === undefined) ? 100 : _.max_usage;
            const savedCount = savedActivityCounts[_.uuid] || 0;
            return {
                limit,
                label: _.name,
                value: _.uuid,
                max_usage: _.max_usage,
                disabled: savedCount >= limit,
            }
        });

      if (!item.activityComponentOpts.length) {
        this.util.warnLog('-- WARNING: Eval Service has no Activity Components. This may be a bad data condition in your env', item);
      }
    });
  }

  toggleShowSignedItems() {
    this._model.appointmentsList = this._state.showSignedItems
      ? this._model.unsignedAppointmentsList
      : this._model.allAppointmentsList
    this._state.showSignedItems = !this._state.showSignedItems;

    if (!this.shouldShowList()) return;

    if (this.getSortType() === 'name') {
      this.sortByNameOrder();
    } else if (this.getSortType() === 'location') {
      this.sortByLocationOrder();
    } else {
      this.sortByNaturalAppointmentOrder();
    }
  }

  //------------------------------------
  // public business and utility methods
  //------------------------------------

  // date first sort
  sortByNaturalAppointmentOrder(item?: any) {
    const list = this._model.appointmentsList.sort((a: any, b: any) => a.sortKeyNatural.localeCompare(b.sortKeyNatural));
    this.setDisplayAppointmentGroups();
    this._state.sortType = "natural";
    if (item) {
        // maintain selection on re-sort
        const index = list.findIndex((appt: any) => appt.sortKeyNatural === item.sortKeyNatural);
        this.setSelectedItem(list[index]);
    } else {
        this.setSelectedItem(list[0]);
    }
    this.onSelectItem(false);
    return list;
  }

  // name: client name | location name | billing code name
  sortByNameOrder(item?: any) {
    const list = this._model.appointmentsList.sort((a: any, b: any) => a.sortKeyName.localeCompare(b.sortKeyName));
    this.setDisplayAppointmentGroups();
    this._state.sortType = "name";
    if (!item) {
        this.setSelectedItem(list[0]);
    }
    this.onSelectItem(false);
    return list;
  }

  // group locations at the top of the list
  sortByLocationOrder(item?: any) {
    const list = this._model.appointmentsList.sort((a: any, b: any) => a.sortKeyLocation.localeCompare(b.sortKeyLocation));
    this.setDisplayAppointmentGroups();
    this._state.sortType = "location";
    if (!item) {
        this.setSelectedItem(list[0]);
    }
    this.onSelectItem(false);
    return list;
  }

  setAppointmentGroup(item: any) {
    const m = moment.tz(item.appointment.start, this.providerTimezone).startOf('day');
    const now = moment().tz(this.providerTimezone).startOf('day');
    if (m.diff(now, 'days') < 0) {
      item.state.appointmentGroup = 'past';
    } else if (m.diff(now, 'days') === 0) {
      item.state.appointmentGroup = 'today';
    } else {
      item.state.appointmentGroup = 'future';
    }
  }

  //--------------------------
  // business helper methods
  //--------------------------

  private _init() {
    this._state = this.util.newComponentStateInstance('idaService');
    this._model = {};
    this._state.debug = true;
    this._state.consoleContent = [{ message: 'CONSOLE Initialized.' }];
    this._state.flags = {
      RECORD: 0,
      RESPONSE: 0,
      CONSOLE: 0,
      ROW: 0,
      TRACKING: 0,
      TZ_PST: 0,
      TZ_EST: 0,
      TZ_NONE: 0,
      SEARCH: 0,
      TYPE: 0,
      ALL: 0,
      ERR_DETAIL: 1,
      FORCE_SAVE_ERROR: 0,
      LOADING_BAR: 1,
      TELEMETRY: 0,
      LOG_ONCE: 0,
      SHOW_SIGNED: 0,
      IGNORE_DONE: 0,
    };
    this._state.logOnce = {};
    this._state.startupInfo = {timings: {}, counts: {}};
    this._state.toggle = true;
    this._state.dataLoaded = false;
    this._state.saving = false;
    this._state.globalReadyState = false;
    this._state.workCompleteMessageInfo = null;

    // 'natural' | 'name' | 'location'
    // "natural" order is (date => event id => name), and grouped by event
    // "location" is (name => date)
    this._state.sortType = 'natural';

    // NOTE - clients and clientServices are identified from the appointments
    this._model.__clientsCache = {};
    this._model.__clientsArray = [];
    this._model.__clientServicesRaw = [];

    this._model.__locationTrackingOpts = [
      { value: 'regular', label: 'Regular' },
      { value: 'extended_school_year', label: 'Extended School Year' },
      { value: 'compensatory_time', label: 'Compensatory Time' },
    ];

    this._model.__evalStatusOpts = [
      { value: Const.clientServiceStatus.IN_PROCESS, label: 'In Process' },
      { value: Const.clientServiceStatus.COMPLETED, label: 'Completed' },
      { value: Const.clientServiceStatus.CANCELLED, label: 'Cancelled' },
    ];

    this._model.__amendmentReasonOpts = Const.amendmentReasonOpts;
    this._model.__evalActivityStatusOpts = Const.evalActivityStatusOpts;
    this._model.__isUserSchoolPsychologist = false;
  }

  // first fetch invoice billing period
  // then load appointments and supporting data in parallel
  private _loadAppointmentListData() {
    const timingStart = new Date().getTime();
    if (this.isDevDebug('LOADING_BAR')) {
        this.loadingBar = this.loadingBarService.ref();
        this.loadingBar.start();
    }
    if (this.isDevDebug('TZ_EST')) {
        this.providerTimezone = 'America/New_York';
    }
    if (this.isDevDebug('TZ_PST')) {
        this.providerTimezone = 'America/Los_Angeles';
    }
    if (this.isDevDebug('TZ_NONE')) {
        this.providerTimezone = null;
    }

    // this is used after calling invoice_preview
    const _loadAllData = (periodStart: string, periodEnd: string) => {
        const timingStart = new Date().getTime();
        this._model.__isUserLeadClinician = this._provider.groups.includes('LeadClinician');

        this._model.invoicePeriod = {
            start: periodStart,
            end: periodEnd,
        };

        if (periodEnd) {
            this._model.invoicePeriod.displayPeriodEnding = moment.utc(periodEnd).format('MMM D, YYYY');
        }

        // NOTE 1: Appt date-times are stored in UTC, offset by timezone.
        // To query against UTC, convert the start/end dates into their timezone relative UTC values
        // NOTE 2: Oddly, the query range is closed-closed [...] rather than closed-open [...), so
        // it is necessary to add a second from the converted start date.
        const apptQueryStart = moment.utc(moment.tz(periodStart, this.providerTimezone)).add(1, 'seconds').format('YYYY-MM-DDTHH:mm:ss');
        const apptQueryEnd = moment.utc(moment.tz(periodEnd, this.providerTimezone)).add(1, 'days').format('YYYY-MM-DDTHH:mm:ss');

        const GET_APPOINTMENTS = this.getStandaloneAppointment() || this.plHttp.get('appointments', {
            event_type__in: 'BILLING',
            provider: this._provider.uuid,
            calendar_view: true,
            start: `${apptQueryStart}`,
            end: `${apptQueryEnd}`,
        });

        const GET_CASELOAD = this.plHttp.get('clients', {
            provider: this._provider.uuid,
            limit: MAX_QUERY_LIMIT,
        });

        const GET_TIMESHEETS = this.plHttp.get('timesheet', { status__in: 'submitted,approved', limit: MAX_QUERY_LIMIT});
        const GET_DATE_STATE = this.plHttp.get('dateState');

        let ALL_REQUESTS = [];

        let includeOneTimeData = false;
        if (!this._globalDataComplete) {
            includeOneTimeData = true;
            const GET_BILLING_CODES = this.plHttp.get('billingCodes', {
                with_can_provide: 1,
                limit: MAX_QUERY_LIMIT,
            });
            const GET_NOTES_SCHEMAS = this.plHttp.get('notesSchemas', { limit: MAX_QUERY_LIMIT });
            const GET_AREAS_OF_CONCERN = this.plHttp.get('areasOfConcern', { limit: MAX_QUERY_LIMIT });
            const GET_ASSESSMENTS = this.plHttp.get('assessments', { limit: MAX_QUERY_LIMIT });
            const GET_SERVICES = this.plHttp.get('services', { limit: MAX_QUERY_LIMIT });
            const GET_PROVIDER_TYPES = this.plHttp.get('providerTypes', { limit: MAX_QUERY_LIMIT });
            const GET_DOCUMENT_TYPES = this.plHttp.get('documentTypes', { limit: MAX_QUERY_LIMIT });

            ALL_REQUESTS.push(GET_BILLING_CODES);
            ALL_REQUESTS.push(GET_NOTES_SCHEMAS);
            ALL_REQUESTS.push(GET_AREAS_OF_CONCERN);
            ALL_REQUESTS.push(GET_ASSESSMENTS);
            ALL_REQUESTS.push(GET_SERVICES);
            ALL_REQUESTS.push(GET_PROVIDER_TYPES);
            ALL_REQUESTS.push(GET_DOCUMENT_TYPES);
        }

        ALL_REQUESTS.push(GET_DATE_STATE);
        ALL_REQUESTS.push(GET_APPOINTMENTS);
        ALL_REQUESTS.push(GET_CASELOAD);

        if (this.isStandaloneAppointment()) {
            const GET_PERSISTED_APPOINTMENT = this.findPersistedAppointment(this._state.standaloneAppointment);
            ALL_REQUESTS.push(GET_PERSISTED_APPOINTMENT);
        }

        if (this.isW2Provider()) {
            ALL_REQUESTS.push(GET_TIMESHEETS);
        }

        forkJoin(ALL_REQUESTS).pipe(first())
            .subscribe((res: any) => {
                let resIndex = 0;
                if (includeOneTimeData) {
                    this._globalDataComplete = true;

                    this._globalData.__billingCodesRaw = res[resIndex++].results;
                    this._globalData.__notesSchemasRaw = res[resIndex++].results;
                    this._globalData.__areasOfConcernRaw = res[resIndex++].results;
                    this._globalData.__assessmentsRaw = res[resIndex++].results;
                    this._globalData.__servicesRaw = res[resIndex++].results;
                    this._globalData.__providerTypesRaw = res[resIndex++].results;
                    this._globalData.__documentTypesRaw = res[resIndex++].results;
                }

                this._model.__dateStateRaw = res[resIndex++];
                this._model.__appointmentsRaw = res[resIndex++].results;
                this._model.__caseloadRaw = res[resIndex++].results;

                if (this.isStandaloneAppointment() && res[resIndex++].count) {
                    this._model.__appointmentsRaw = res[resIndex -1].results;
                }

                if (this.isW2Provider()) {
                    this._model.__timesheetsRaw = res[resIndex++].results;
                }

                this._model.evaluationReportDocumentType = this._globalData.__documentTypesRaw
                    .find((item: any) => item.code === 'evaluation_report');
                // determine if user is School Psychologist.
                const PA_PROVIDER_TYPE = this._globalData.__providerTypesRaw
                    .find((item: any) => item.code === 'pa');
                // Validation for when a CAM comes to the calendar to view a Provider's documentation
                if (this._provider.xProvider.provider_types) {
                    this._model.__isUserSchoolPsychologist = !!this._provider.xProvider.provider_types
                        .find((providerTypeUuid: any) => providerTypeUuid === PA_PROVIDER_TYPE.uuid);
                } else {
                    // set to false when is a CAM
                    this._model.__isUserSchoolPsychologist = false;
                }
                // for each provider type on the user
                // find all the matching services
                const providerTypes = this.provider.xProvider.provider_types;
                const providerServiceTypeList: Array < String > = [];
                const serviceTypeMap = {};
                // Validation for when a CAM comes to the calendar to view a Provider's documentation
                // If providerTypes is valid then is not a CAM and we can execute the forEach
                if (providerTypes) {
                    providerTypes.forEach((_providerTypeUuid: any) => {
                        this._globalData.__servicesRaw.forEach((_service: any) => {
                            const providerType = _service.provider_types.find((_providerType: any) => {
                                return _providerTypeUuid === _providerType.uuid;
                            });
                            if (providerType) {
                                if (!serviceTypeMap[_service.service_type.uuid]) {
                                    providerServiceTypeList.push(_service.service_type);
                                    serviceTypeMap[_service.service_type.uuid] = _service.service_type;
                                }
                            }
                        });
                    });
                }
                this._model.__providerServiceTypeList = providerServiceTypeList;
                // construct caseload map
                this._model.__caseloadMap = this._model.__caseloadRaw.reduce((result: any, _: any) => {
                    result[_.uuid] = _;
                    return result;
                }, {});
                this._getClients(this._model.__appointmentsRaw, () => {
                    this._buildAppointmentsList(
                        this._model.__appointmentsRaw,
                        this._model.__clientServicesRaw,
                        this._globalData.__billingCodesRaw,
                    );
                    const LIST = this._model.appointmentsList;

                    const timingEnd = new Date().getTime();
                    if (this.selectedAppointment) {
                        if (this.isStandaloneAppointment()) {
                            this.selectedAppointment.info.pageLoadTime = timingEnd - timingStart;
                        }
                        this.onNextItem(this.selectedAppointment);
                        if (this.isStandaloneAppointment()) {
                            this._state.standaloneAppointmentReady = true;
                            this.detectChanges();
                        }
                    }
                    if (!this.isStandaloneAppointment()) {
                        this._state.startupInfo.timings.loadPage = timingEnd - timingStart;
                    }
                    setTimeout(() => {
                        this._state.dataLoaded = true;
                        this._state.globalReadyState = true;
                        this._entryPointInProgress = false;
                        if (this.isDevDebug('LOADING_BAR')) {
                            this.loadingBar.complete();
                        }
                        this._state.startupInfo.counts.appointmentsRaw = this._model.__appointmentsRaw ? this._model.__appointmentsRaw.length : 0;
                        this.util.log(`selected item: ${this.getSelectedIndex()}`, {
                            item: this.selectedAppointment,
                            state: {
                                user: this.provider,
                                model: this._model,
                                state: this._state,
                                timings: this._state.startupInfo.timings,
                                counts: this._state.startupInfo.counts,
                                flags: this.getFlags(),
                                bizobj: this,
                            },
                        });
                    }, 500);
                });
            }, (err: any) => {
                // handle errors for parallel data fetches (appointments, services, billing codes, etc)
                this.debugError('error loading initial data', err);
            });
    }

    // Calendar standalone documentation or iDA
    if (this.isStandaloneAppointment()) {
        _loadAllData(null, null);
    } else {
        // use workPeriod or invoicePeriod
        if (this.isW2Provider()) {
            // workPeriod
            this.plHttp.get('timesheetPreview').subscribe((res: any) => {
                const preview = this._model.__timesheetPreview = res;
                const workPeriod = preview.work_period_expanded;
                _loadAllData(workPeriod.start_date, workPeriod.end_date);
            });
        } else {
            // use invoicePeriod
            const now = moment().tz(this.providerTimezone);
            const data = localStorage.getItem(Const.KEY_BILLING_PERIOD);
            if (data) {
                const invoicePeriod = JSON.parse(data);
                if (now.isSame(invoicePeriod.lastRefresh, 'd')) {
                    console.log('--- using cached invoice period', invoicePeriod);
                    this._state.startupInfo.timings.loadInvoicePreview = 'cached';
                    _loadAllData(invoicePeriod.start, invoicePeriod.end);
                    return;
                }
            }
            this.store.select(selectInvoicePeriod)
            .pipe(filter((invoice: any) => !!invoice), first())
            .subscribe(({ start, end }: any) => {
                _loadAllData(start, end);
            });
        }
    }
  }

  setStandaloneAppointment(appointment: any) {
      this._state.standaloneAppointment = appointment;
      this.setDevDebugOn('SHOW_SIGNED');
      this.setDevDebugOn('IGNORE_DONE');
  }

  isStandaloneAppointment() {
      return !!this._state.standaloneAppointment;
  }

  isStandaloneAppointmentReady() {
      return this._state.standaloneAppointmentReady;
  }

  isW2Provider() {
      return this._provider.xEnabledFeatures
        && this._provider.xEnabledFeatures.includes('timesheet')
        && this._provider.xProvider.isW2;
  }

  isBlackoutDay(item: any) {
    return item.appointment.is_blacked_out || this.util.flagLocalStorage('DEBUG_BLACKOUT_DAY');
  }

  getW2Timesheet(item: any) {
      if (item.timesheet) return item.timesheet;

      const A = item.appointment;
      const timesheets = item.timesheetsRaw;
      return timesheets.find((ts: any) => {
          const workPeriod = ts.work_period_expanded;
          const apptStart = moment.tz(A.start, this.providerTimezone);
          const tsStart = moment.tz(workPeriod.start_date, this.providerTimezone);
          const tsEnd = moment.tz(workPeriod.end_date, this.providerTimezone);
          return apptStart.isBetween(tsStart, tsEnd, 'day', '[]');
      });
  }

  getW2WorkPeriod(item: any) {
      return this.getW2Timesheet(item).work_period_expanded;
  }

  setChangeDetectorRef(cdr: any) {
      this._state.cdr = cdr;
  }

  detectChanges() {
      if (this.cdr) {
          this.cdr.markForCheck();
      }
  }

  private getStandaloneAppointment() {
      const appt = this._state.standaloneAppointment;
      return appt && of({ results: [appt] });
  }

  // build the list of Unsigned Appointments for the respective billing period.
  private _buildAppointmentsList(appointmentsRaw: any, clientServicesRaw: any, billingCodesRaw: any) {
    this._state.signedAppointmentsCount = 0;
    this._state.unsignedAppointmentsCount = 0;

    const allAppointmentsList: any[] = this._model.allAppointmentsList = [];
    const LIST = this._model.unsignedAppointmentsList = appointmentsRaw.reduce((unsignedAppointmentsList: any, A: any, index: number) => {

      // normalize iDA and calendar documentation to start as DST adjusted values.
      // calendar documentation passes an already DST adjusted appointment
      // iDA loads directly from the API and needs to initialize accordingly
      // the method toLocalTime() is copied from schedule.effects
      // TODO: schedule.effects should be refactored to call util.toLocalTime()
      const appointment = this.isStandaloneAppointment() && !A.uuid ? A : this.util.toLocalTime(A, this.providerTimezone);

      if (appointment.event.event_type !== 'BILLING') return unsignedAppointmentsList;
      const records = appointment.records;
      const clients = appointment.clients;
      const locations = appointment.locations;

      // handle client appointments
      if (clients && clients.length) {
        clients.forEach((client: any) => {
          this._addClientAppointment(appointment, client, records, clientServicesRaw, billingCodesRaw, unsignedAppointmentsList, allAppointmentsList);
        })
      } else if (locations && locations.length) {
        // handle indirect (location) appointments
        const location = locations[0];
        this._addLocationAppointment(appointment, location, records, billingCodesRaw, unsignedAppointmentsList, allAppointmentsList);
      } else {
        // handle other indirect appointments
        this._addOtherIndirectAppointment(appointment, records, billingCodesRaw, unsignedAppointmentsList, allAppointmentsList);
      }
      return unsignedAppointmentsList;
    }, []);

    if (this.shouldShowAllItems()) {
      this._state.showSignedItems = true;
      this._model.appointmentsList = this._model.allAppointmentsList;
    } else {
      this._state.showSignedItems = false;
      this._model.appointmentsList = this._model.unsignedAppointmentsList;
    }

    if (this.shouldShowList()) {
      this._sortAppointments();
    }
  }

  getSignoffLabel(item: any) {
    if (this.isAmendable(item)) {
      return SIGNOFF_LABEL_AMENDMENT;
    } else {
      return SIGNOFF_LABEL_OPEN_PERIOD;
    }
  }

  private _finishItemToAdd(itemToAdd: any) {
      itemToAdd.model.selectedActivityComponent = null;
      this.initCloneState(itemToAdd);
      if (this.isAmendable(itemToAdd)) {
          itemToAdd.model.signed = false;
          itemToAdd.state.signedCheckboxDirty = true;
          itemToAdd.state.signoffLabel = SIGNOFF_LABEL_AMENDMENT;
      } else {
          itemToAdd.state.signoffLabel = SIGNOFF_LABEL_OPEN_PERIOD;
      }
      const isW2Provider = itemToAdd.isW2Provider = this.isW2Provider();
      if (isW2Provider) {
          const timesheet = itemToAdd.timesheet = this.getW2Timesheet(itemToAdd);
          if (timesheet) {
              itemToAdd.workPeriod = this.getW2WorkPeriod(itemToAdd);
          }
      }
      this.setRecurringAppointmentInfo(itemToAdd);
  }

  // add a single client appointment to the appointments result list
  private _addClientAppointment(
      appointment: any,
      client: any,
      records: any,
      clientServicesRaw: any,
      billingCodesRaw: any,
      unsignedAppointmentsList: any,
      allAppointmentsList: any
  ) {
    const itemToAdd: any = this._initClientItemToAdd(appointment, client);

    this.setAppointmentGroup(itemToAdd);

    // get record if it exists
    if (records && records.length) {
      itemToAdd.record = records.find((_: any) => _.client === client.uuid);
    }

    // billing codes list (basic filter)
    const billingCodesList = itemToAdd.billingCodesList = this._filterBillingCodesByParticipates(billingCodesRaw, appointment);
    itemToAdd.eBillingCode = billingCodesRaw.find((item: any) => item.uuid === (appointment.billing_code || appointment.event.billing_code));

    const IS_SIGNED = itemToAdd.state.isSigned = (itemToAdd.record && itemToAdd.record.signed) || appointment.signed;

    // use record billing code with event billing code as fallback
    if (itemToAdd.record) {
      itemToAdd.billingCode = billingCodesList.find((_: any) => _.uuid === itemToAdd.record.billing_code);
    } else {
      itemToAdd.billingCode = itemToAdd.eBillingCode;
    }

    // if a recorded clientService is not found among the listed clientServices,
    // check if there is a matching completed client service.
    if (itemToAdd.record && itemToAdd.record.client_service) {
      itemToAdd.info.warnings.push({
        msg: 'item has record.client_service but no active match was found',
        clientService: itemToAdd.record.client_service,
      });

      let recordClientService = itemToAdd.record && itemToAdd.record.client_service;
      recordClientService = recordClientService && this._model.__clientServicesRawUnfiltered.find((csItem: any) => {
        return recordClientService === csItem.id;
      });

      const clientServices = clientServicesRaw || this._model.__clientServicesRaw;
      if (recordClientService) {
        if (!clientServices.find((_: any) => _.id === recordClientService.id)) {
            clientServices.push(recordClientService);
        }
        itemToAdd.clientService = recordClientService;
      }
    }

    this._filterClientServices(itemToAdd, client, itemToAdd.billingCode);

    if (itemToAdd.clientServicesList.length) {
      if (itemToAdd.record) {
        itemToAdd.clientService = itemToAdd.clientServicesList.find((_: any) => _.id === itemToAdd.record.client_service);
      } else if (itemToAdd.clientServicesList.length === 1) {
        itemToAdd.clientService = itemToAdd.clientServicesList[0];
      }
    }

    // filter billing codes by client services
    itemToAdd.billingCodesList = this._filterBillingCodesByClientServices(itemToAdd.billingCodesList, itemToAdd.clientServicesForClient)
    this._buildBillingCodesOpts(itemToAdd);

    itemToAdd.billingCodesList.find((_: any) => _.uuid === itemToAdd.billingCode);

    // ----- handle locations
    itemToAdd.locationsList = this._model.__clientsCache[client.uuid].locations;
    itemToAdd.location = itemToAdd.locationsList[0];

    // NOTE: title and sorts get initialized earlier, but we only have location now.
    itemToAdd.displayTitle_sortNatural += ` - ${itemToAdd.location.name}`;
    const titleParts = itemToAdd.displayTitle_sortName.split(' - ');
    itemToAdd.displayTitle_sortName = `${titleParts[0]} - ${itemToAdd.location.name} - ${titleParts[1]}`;
    // ----- initialize FORM model
    if (itemToAdd.billingCode) {
      itemToAdd.model.billingCode = itemToAdd.billingCode.uuid;
      itemToAdd.model.oBillingCode = itemToAdd.billingCode;
      this._handleAfterChangeBillingCode(itemToAdd);
    }
    if (itemToAdd.clientService) {
      itemToAdd.model.clientService = itemToAdd.clientService.id;
      itemToAdd.model.oClientService = itemToAdd.clientService;
      this._handleAfterChangeClientService(itemToAdd);
    }

    itemToAdd.model.areasOfConcern = (itemToAdd.model.areasOfConcern && itemToAdd.model.areasOfConcern.length > 0) ? itemToAdd.model.areasOfConcern : [];
    itemToAdd.model.assessmentsUsed = [];
    //itemToAdd.model.evaluationStatus = Const.clientServiceStatus.IN_PROCESS;

    if (itemToAdd.location) {
      itemToAdd.model.location = itemToAdd.location.uuid;
      itemToAdd.model.oLocation = itemToAdd.location;

      // NOTE: (A-group) equal priority with location appointments
      itemToAdd.sortKeyLocation = `A,${itemToAdd.model.oLocation.name.toLowerCase()},B,${itemToAdd.sortKeyLocation}`;
      itemToAdd.displayTitle_sortLocation = `${itemToAdd.model.oLocation.name} - ${itemToAdd.displayTitle_sortLocation}`;
      if (this.isDevDebug('TRACKING')) {
        itemToAdd.model.oLocation.record_tracking_type = true;
      }
    }
    if (itemToAdd.record) {
      if (itemToAdd.record.notes) {
        itemToAdd.model.notes = JSON.parse(itemToAdd.record.notes);
      }
      itemToAdd.model.signed = !!itemToAdd.record.signed;
      itemToAdd.model.trackingType = itemToAdd.record.tracking_type;
    } else {
      const now = new Date();
      const month = now.getMonth();
      // do not default to Regular if current month is July or Agust
      if(![6,7].includes(month)) {
        itemToAdd.model.trackingType = this._model.__locationTrackingOpts[0].value;
      }
    }

    const blankNotes = { subjective: '', objective: '', assessment: '', plan: '', notes: '' };
    itemToAdd.model.notes = Object.assign(blankNotes, itemToAdd.model.notes);


    if (IS_SIGNED) {
      this._state.signedAppointmentsCount++;
    } else {
      this._state.unsignedAppointmentsCount++;
      unsignedAppointmentsList.push(itemToAdd);
    }

    allAppointmentsList.push(itemToAdd);
    this._finishItemToAdd(itemToAdd);
    return itemToAdd;
  }

  // add a single "indirect" location appointment to the appointments result list
  private _addLocationAppointment(appointment: any, location: any, records: any, billingCodesRaw: any, unsignedAppointmentsList: any, allAppointmentsList: any) {

    // billing codes list
    const billingCodesList = this._filterBillingCodesByParticipates(billingCodesRaw, appointment);
    const eBillingCode = billingCodesRaw.find((item: any) => item.uuid === (appointment.billing_code || appointment.event.billing_code));

    const itemToAdd: any = this._initLocationItemToAdd(appointment, location, eBillingCode);

    this.setAppointmentGroup(itemToAdd);

    itemToAdd.billingCodesList = billingCodesList;
    this._buildBillingCodesOpts(itemToAdd);
    itemToAdd.eBillingCode = eBillingCode;

    // get record if it exists
    if (records && records.length) {
      itemToAdd.record = records[0];
    }

    const IS_SIGNED = itemToAdd.state.isSigned = (itemToAdd.record && itemToAdd.record.signed) || appointment.signed;

    // use record billing code with event billing code as fallback
    if (itemToAdd.record) {
      itemToAdd.billingCode = billingCodesList.find((item: any) => item.uuid === itemToAdd.record.billing_code);
    } else {
      itemToAdd.billingCode = itemToAdd.eBillingCode;
    }
    // initialize FORM model
    itemToAdd.model.billingCode = itemToAdd.billingCode.uuid;
    itemToAdd.model.oBillingCode = itemToAdd.billingCode;

    itemToAdd.model.location = itemToAdd.location.uuid;
    itemToAdd.model.oLocation = itemToAdd.location;

    // NOTE: (A-group) equal priority with client appointment, which has location
    itemToAdd.sortKeyLocation = `A,${itemToAdd.model.oLocation.name.toLowerCase()},A,${itemToAdd.sortKeyLocation}`

    if (itemToAdd.record) {
      if (itemToAdd.record.notes) {
        itemToAdd.model.notes = JSON.parse(itemToAdd.record.notes);
      }
      itemToAdd.model.signed = !!itemToAdd.record.signed;
    }
    const blankNotes = { subjective: '', objective: '', assessment: '', plan: '', notes: '' };
    itemToAdd.model.notes = Object.assign(blankNotes, itemToAdd.model.notes);

    if (IS_SIGNED) {
      this._state.signedAppointmentsCount++;
    } else {
      this._state.unsignedAppointmentsCount++;
      unsignedAppointmentsList.push(itemToAdd);
    }

    allAppointmentsList.push(itemToAdd);
    this._finishItemToAdd(itemToAdd);
    return itemToAdd;
  }

  // add a single "indirect" "other" appointment to the appointments result list
  private _addOtherIndirectAppointment(appointment: any, records: any, billingCodesRaw: any, unsignedAppointmentsList: any, allAppointmentsList: any) {
    // billing codes list
    const billingCodesList = this._filterBillingCodesByParticipates(billingCodesRaw, appointment);
    const eBillingCode = billingCodesRaw.find((item: any) => item.uuid === (appointment.billing_code || appointment.event.billing_code));

    const itemToAdd: any = this._initOtherIndirectItemToAdd(appointment, eBillingCode);

    this.setAppointmentGroup(itemToAdd);

    itemToAdd.billingCodesList = billingCodesList;
    this._buildBillingCodesOpts(itemToAdd);
    itemToAdd.eBillingCode = eBillingCode;

    // get record if it exists
    if (records && records.length) {
      itemToAdd.record = records[0];
    }

    const IS_SIGNED = itemToAdd.state.isSigned = (itemToAdd.record && itemToAdd.record.signed) || appointment.signed;

    // use record billing code with event billing code as fallback
    if (itemToAdd.record) {
      itemToAdd.billingCode = billingCodesList.find((item: any) => item.uuid === itemToAdd.record.billing_code);
    } else {
      itemToAdd.billingCode = itemToAdd.eBillingCode;
    }
    // initialize FORM model
    itemToAdd.model.billingCode = itemToAdd.billingCode.uuid;
    itemToAdd.model.oBillingCode = itemToAdd.billingCode;

    if (itemToAdd.record) {
      if (itemToAdd.record.notes) {
        itemToAdd.model.notes = JSON.parse(itemToAdd.record.notes);
      }
      itemToAdd.model.signed = !!itemToAdd.record.signed;
    }
    const blankNotes = { subjective: '', objective: '', assessment: '', plan: '', notes: '' };
    itemToAdd.model.notes = Object.assign(blankNotes, itemToAdd.model.notes);

    if (IS_SIGNED) {
      this._state.signedAppointmentsCount++;
    } else {
      this._state.unsignedAppointmentsCount++;
      unsignedAppointmentsList.push(itemToAdd);
    }

    allAppointmentsList.push(itemToAdd);
    this._finishItemToAdd(itemToAdd);
    return itemToAdd;
  }

  private _setSelectedEventGroup() {
    const groupUuid = this.selectedAppointment.appointment.event.uuid;
    const groupDate = this.selectedAppointment.appointment.start;
    this._state.selectedGroup = {
      itemCount: 0,
      headItem: null,
    }
    this._model.appointmentsList.map((item: any) => {
      if (groupUuid === item.appointment.event.uuid && groupDate === item.appointment.start) {
        this._state.selectedGroup.headItem = this._state.selectedGroup.headItem || item.itemKey;
        this._state.selectedGroup.itemCount++;
        item.state.group = this._state.selectedGroup;
        item.state.groupFlags = item.state.groupFlags || {}
        item.state.groupFlags.isActiveGroup = true;
        item.state.groupFlags.isHeadItem = this._state.selectedGroup.headItem === item.itemKey;
      } else {
        item.state.group = {};
        item.state.groupFlags = {};
      }
    });
    if (this.isGlobalReadyState()) {
        this.util.log(`selected item: ${this.getSelectedIndex()}`, { item: this.selectedAppointment, STATE: this });
    }
  }

  // workflow method
  private _onWorkComplete() {

  }

  //-----------------------
  // initializers
  //-----------------------

  private _initClientItemToAdd(appointment: any, client: any) {
    return this._buildItem(appointment, 'client', { client });
  }

  private _initLocationItemToAdd(appointment: any, location: any, billingCode: any) {
    return this._buildItem(appointment, 'location', { location, billingCode });
  }

  private _initOtherIndirectItemToAdd(appointment: any, billingCode: any) {
    return this._buildItem(appointment, 'otherIndirect', { billingCode });
  }

  private _buildItem(appointment: any, type: string, obj: any) {
    let __displayTitleFragment, sortName, itemName, itemNameKey;
    let sortKeyNatural, sortKeyName, sortKeyLocation;
    let itemObj: any = {};
    const apptStartLocal = this.getLocalDate(appointment.start);

    itemObj.clientServicesRaw = this._model.__clientServicesRaw;
    itemObj.timesheetsRaw = this._model.__timesheetsRaw;
    itemObj.dateStateRaw = this._model.__dateStateRaw;
    itemObj.billingCodesRaw = this._globalData.__billingCodesRaw;

    if (type === 'client') {
      itemObj.client = obj.client;
      __displayTitleFragment = `${obj.client.first_name} ${obj.client.last_name}`;
      itemName = __displayTitleFragment;
      sortName = itemNameKey = itemName.toLowerCase();
      sortKeyNatural = `${apptStartLocal.valueOf()},${appointment.event.uuid},${sortName}`;
      // NOTE: location is determined later, so mutate this value then.
      sortKeyLocation = `${sortKeyNatural}`;
    } else if (type === 'location') {
      itemObj.location = obj.location;
      __displayTitleFragment = `${obj.location.name} - ${obj.billingCode.name}`;
      itemName = `${obj.location.name}`;
      sortName = itemName.toLowerCase();
      itemNameKey = `${obj.location.uuid}`;
      sortKeyNatural = `${apptStartLocal.valueOf()},${sortName}`;
      sortKeyLocation = `A,${sortName},${apptStartLocal.valueOf()}`;
    } else if (type === 'otherIndirect') {
      itemObj.location = obj.location;
      __displayTitleFragment = `${obj.billingCode.name}`;
      itemName = `${obj.billingCode.name}`;
      sortName = itemName.toLowerCase();
      itemNameKey = `${obj.billingCode.uuid}`;
      sortKeyNatural = `${apptStartLocal.valueOf()},${sortName}`;
      sortKeyLocation = `C,${sortKeyNatural}`
    }

    const displayTitle_sortNatural = `${apptStartLocal.format('ddd').toUpperCase()} ${apptStartLocal.format('M/D')} - ${__displayTitleFragment}`;
    const displayTitle_sortName = `${__displayTitleFragment} - ${apptStartLocal.format('ddd').toUpperCase()} ${apptStartLocal.format('M/D')}`;
    const displayTitle_sortLocation = `${__displayTitleFragment} - ${apptStartLocal.format('ddd').toUpperCase()} ${apptStartLocal.format('M/D')}`;
    const itemKey = apptStartLocal.valueOf() + itemNameKey + appointment.event.uuid;
    sortKeyName = `${sortName},${apptStartLocal.valueOf()}`;
    // NOTE: in the case of client appointment, location is determined later.

    const info: any = { errors: [], warnings: [], type };
    if (!['client', 'location', 'otherIndirect'].find(_ => _ === type)) {
      this.util.elog(' ***** unknown type:', type);
    }
    const ITEM =  {
      ...itemObj,
      amendable: false,
      appointment: {...appointment},
      itemKey,
      itemName,
      info,
      displayTitle_sortNatural,
      displayTitle_sortName,
      displayTitle_sortLocation,
      sortKeyNatural,
      sortKeyName,
      sortKeyLocation,
      model: {},
      state: {},
    };
    return ITEM;
  }

  //-----------------------
  // filter functions
  //-----------------------

  private _filterBillingCodesByParticipates(billingCodesRaw: any[], appointment: any) {
    // do not over-filter: check the record billing code
    const records = appointment.records;
    const recordBillingCode = records && records.length && records[0].billing_code;

    let codes = billingCodesRaw;
      codes = codes.filter((code: any) =>
        (code.is_active && code.can_provide)
        || (code.uuid === recordBillingCode));

    // client participates
    if (this._doesClientParticipate(appointment, billingCodesRaw)) {
      codes = codes.filter((code: any) =>
        (code.client_participates && code.client_participates !== 'NONE')
        || (code.uuid === recordBillingCode));
      // location participates
    } else if (this._doesLocationParticipate(appointment, billingCodesRaw)) {
      codes = codes.filter((code: any) =>
        (code.location_participates && code.location_participates !== 'NONE')
        || (code.uuid === recordBillingCode));
      // neither client nor location participates
    } else {
      codes = codes.filter((code: any) =>
        ((!code.client_participates || code.client_participates === 'NONE')
          && (!code.location_participates || code.location_participates === 'NONE'))
        || (code.uuid === recordBillingCode));
    }
    // filter by
    return codes.sort((a: any, b: any) => a.name.localeCompare(b.name));
  }

  private _filterBillingCodesByClientServices(billingCodes: Array<any>, clientServices: Array<any>) {
    const clientServicesMap = clientServices.reduce((result, item) => {
      result[item.service.code] = 1;
      return result;
    }, {});
    return billingCodes.filter(item => {
      if (item.services.length === 0) return true;
      return item.services.find((service: any) => {
        return clientServicesMap[service.code];
      });
    })
  }

  private _filterBillingCodesByType(item: any, billingCode: any) {
    const record = item.record && item.record.uuid && item.record;
    if (!record) return;

    const clientServiceType = ['direct_services', 'direct_makeup', 'evaluation', 'consultation', 'group_bmh'];
    const exclusionType = ['iep_meeting', 'parent_contact'];
    if (clientServiceType.includes(billingCode.code)) {
      item.billingCodesList = item.billingCodesList.filter((__: any) => !exclusionType.includes(__.code));
    }
    if (exclusionType.includes(billingCode.code)) {
      item.billingCodesList = item.billingCodesList.filter((__: any) => !clientServiceType.includes(__.code));
    }
    this._buildBillingCodesOpts(item);
  }

  private _filterClientServices(item: any, client: any, billingCode: any) {
    item.state.clientServiceReadyFlag = false;
    const clientServicesForClient = this._filterClientServicesHelper(item, client, null);
    const clientServicesForBillingCode = this._filterClientServicesHelper(item, client, billingCode);
    item.clientServicesList = clientServicesForBillingCode;
    item.clientServicesOpts = this._buildClientServiceOpts(item);
    item.clientServicesForBillingCode = clientServicesForBillingCode;
    item.clientServicesForClient = clientServicesForClient;
  }

  // filter client services by client and services allowed for the given billing code
  private _filterClientServicesHelper(item: any, client: any, oBillingCode: any) {
    // client services for the client
    const withClient = this._model.__clientServicesRawUnfiltered.filter((_: any) => _.client && (_.client.id === client.uuid));
    // client services for the billing code
    const withBillingCode = withClient.filter((_: any) => {
        return !oBillingCode || (oBillingCode.services
            .find((billingCodeServiceItem: any) => billingCodeServiceItem.uuid === (_.service && _.service.id))
        );
    });

    // remove evals that are not assigned to the calendar provider
    const assignedToProvider = withBillingCode.filter((_: any) => {
      const isEvalService = _.hasOwnProperty('evaluationType');
      return !isEvalService || (isEvalService && this.provider.uuid === (_.assignedTo && _.assignedTo.id));
    });

    // check completed
    return assignedToProvider.filter((_: any) => {
      const isRecordClientService = item.record && item.record.client_service === _.id;
      const isComplete = this.isClientServiceEvalComplete(_)
      return !isComplete || (isComplete && isRecordClientService);
    });
  }

  private _filterAreasOfConcern(item: any) {
    item.areasOfConcernList = this._globalData.__areasOfConcernRaw.reduce((result: Array<any>, aoc: any) => {
      if (item.model.oClientService.service.serviceType.id === aoc.service_type) {
        result.push(aoc);
      }
      return result;
    }, []);
  }

  private _filterAssessments(item: any) {
    const serviceType = item.model.oClientService.service.serviceType.id;
    const servicesMap = this._globalData.__servicesRaw.reduce((result: any, service: any) => {
      if (service.service_type.uuid === serviceType) {
        result[service.uuid] = service;
      }
      return result;
    }, {});

    item.assessmentsList = this._globalData.__assessmentsRaw.reduce((result: Array<any>, assessment: any) => {
      for (let i = 0; i < assessment.services.length; i++) {
        const serviceUuid = assessment.services[i];
        if (servicesMap[serviceUuid]) {
          result.push(assessment);
          break;
        }
      }
      return result;
    }, []);
  }

  //-----------------------
  // handler functions
  //-----------------------

  private _handleAfterChangeBillingCode(item: any) {
    if (this.isClientAppointment(item)) {
      this._filterClientServices(item, item.client, item.model.oBillingCode);
      this._filterBillingCodesByType(item, item.model.oBillingCode);
      setTimeout(() => {
        const serviceMatch = item.clientServicesList.find((service: any) => service.id === item.model.clientService);
        if (!serviceMatch) {
          if (item.clientServicesList.length === 1) {
            item.model.oClientService = item.clientServicesList[0];
            item.model.clientService = item.model.oClientService.id;
            this._handleAfterChangeClientService(item);
          } else {
            item.model.oClientService = null;
            item.model.clientService = null;
          }
        }
      }, 100);
    }
    setTimeout(() => {
      this.debugIf(()=>this.isGlobalReadyState(), 'selected item (onChangeBillingCode)', item);
    }, 101);
  }

  private _handleAfterChangeClientService(item: any, fn?: Function) {
    // if evaluation, update model with areasOfConcern and assessments
    if (this.isEvaluationAppointment(item)) {
      const clientService = item.model.oClientService;
      this._filterAreasOfConcern(item);
      this._filterAssessments(item);
      item.model.areasOfConcern = (clientService.areasOfConcern || []).map((item: any) => item.id);
      item.model.assessmentsUsed = (clientService.assessmentsUsed || []).map((item: any) => item.id);
      item.model.evaluationStatus = clientService.status;

      // eval status business rule - default to "in_process";
      const statusList = [
        Const.clientServiceStatus.IN_PROCESS,
        Const.clientServiceStatus.COMPLETED,
        Const.clientServiceStatus.CANCELLED
      ];
      const statusFound = statusList.find((item: String) => item === clientService.status);
      if (!statusFound) {
        item.model.evaluationStatus = Const.clientServiceStatus.IN_PROCESS;
      }
      this.fetchEvaluationActivities(item);
    }

    if (this.isGlobalReadyState()) {
        this.util.log('selected item (onChangeClientService)', item);
    }
    if (fn) {
        fn();
    }
  }

  public isLeadBillingCode(bc: any) {
      return bc.code === 'service_coord_billable' || bc.code === 'pa_coordination';
  }

  public isLeadBillingCategory(bc: any) {
      return bc.event_creation_category === 'Meetings';
  }

  private _makeBillingCodesOpts(billingCodesList: any[]) {
      return billingCodesList.map((e: any) => ({
          label: e.service_expanded ? e.service_expanded.name : e.name,
          value: e.uuid,
      }));
  }
  private _buildBillingCodesOpts(item: any) {
    item.billingCodesOpts = this._makeBillingCodesOpts(item.billingCodesList)
    setTimeout(() => {
        const isLeadClinician = this.isUserLeadClinician();
        const BC = item.billingCode;
        if (isLeadClinician && (this.isLeadBillingCode(BC) || this.isLeadBillingCategory(BC))) {
            const list = item.billingCodesList.filter((bc: any) => this.isLeadBillingCode(bc));
            if (!this.isLeadBillingCode(BC) && this.isLeadBillingCategory(BC)) {
                list.push(BC);
            }
            item.billingCodesOpts = this._makeBillingCodesOpts(list);
        }
    });
  };

  private _buildClientServiceOpts(item: any) {
    const _serviceLabelMap = {
      consultation_bmh: 'BMH Consultation',
      direct_bmh: 'BMH Direct',
      consultation_ot: 'OT Consultation',
      supervision_ot: 'OT Supervision',
      direct_ot: 'OT Direct',
      consultation_slt: 'SLT Consultation',
      supervision_slt: 'SLT Supervision',
      direct_slt: 'SLT Direct',
    };

    let opts = item.clientServicesList.reduce((result: any[], e: any) => {
      const value = e.id;
      const service = e.service;
      const productType = service.productType;
      const isEvalProduct = productType.code.toLowerCase().indexOf('eval') > -1;
      const isEvalService = e.hasOwnProperty('evaluationType');

      let label = service.name;
      const startDate = moment.utc(e.startDate).format('M/YYYY');
      const endDate = e.endDate ? moment.utc(e.endDate).format('M/YYYY') : 'no end date';

      const labelPrefix = _serviceLabelMap[service.code];
      label = (labelPrefix || label);
      label += isEvalProduct ? ` (${productType.name})` : '';
      label += isEvalService && e.dueDate ? ` -- <b>Evaluation Due Date</b>: ${moment.utc(e.dueDate).format('M/D/YYYY')}` : ` ${startDate} - ${endDate}`;
      label += isEvalService && this.provider.uuid !== (e.assignedTo && e.assignedTo.id)
        ? `, <b>Assigned Provider: </b>${e.assignedTo.firstName} ${e.assignedTo.lastName}`
        : '';
      label = (e.status === Const.clientServiceStatus.COMPLETED ? '<b>Completed</b> - ' : '') + label;
      label = (e.status === Const.clientServiceStatus.CANCELLED ? '<b>Cancelled</b> - ' : '') + label;

      this.logOnceIf(
        ()=>this.getPageParam('client') === item.client.uuid,
        'clientServiceOpts', item, e, label);
      result.push({ label, value });
      return result;
    }, []);
    opts.sort((a: any, b: any) => a.label.localeCompare(b.label));
    item.state.clientServiceReadyFlag = true;
    return opts;
  };

  //-----------------------
  // small helpers
  //-----------------------

  private _sortAppointments(sortFn?: Function) {
    let list = this._model.appointmentsList;
    if (sortFn) {
      sortFn(list);
    } else {
      // default sort
      this.sortByNaturalAppointmentOrder();
    }
  }

  private _resetAppointment(item: any) {
    item.info.errors = [];
  }

  //--------------------------
  // boolean utility functions
  //--------------------------

  private _doesClientParticipate(appointment: any, billingCodes: any) {
    const billing_code = appointment.billing_code || appointment.event.billing_code;
    const oBillingCode = billingCodes.find((item: any) => {
      return item.uuid === billing_code;
    });

    return appointment.client_expanded ||
      (oBillingCode && oBillingCode.client_participates && oBillingCode.client_participates !== 'NONE');
  }

  private _doesLocationParticipate(appointment: any, billingCodes: any) {
    const billing_code = appointment.billing_code || appointment.event.billing_code;
    const oBillingCode = billingCodes.find((item: any) => {
      return item.uuid === billing_code;
    });
    return appointment.location_expanded ||
      (oBillingCode && oBillingCode.location_participates && oBillingCode.location_participates !== 'NONE');
  }


  //-------------------------
  // data, state, ui control
  //-------------------------

  private _createAppointment(item: any, afterSaveRecordFn: Function, stayOnSelectedItem: boolean) {
    const A = item.appointment;
    if (!A.uuid) {
      const dateValues = this.getDSTAdjustedAppointmentDatesForSave(A);
      const APPT_TO_SAVE = {
        event: A.event.uuid,
        start: dateValues.start,
        end: dateValues.end,
        original_start: A.original_start,
        original_end: A.original_end,
      };

      if (this.isAmendable(item)) {
        this.addReasonForEditToSavePayload(item, APPT_TO_SAVE);
      }

      this.util.log('CREATING appointment...', { APPT_TO_SAVE });

      this.plHttp.save('appointments', APPT_TO_SAVE)
      .subscribe((res: any) => {
        this.debugResponse('CREATED appointment...', res);
        this.getItemsInGroupAppointment(item).map((apptItem: any) => {
            apptItem.appointment = {
              ...apptItem.appointment,
              uuid: res.uuid,
            };
        });
        if (this.isEvaluationAppointment(item)) {
          this._uploadReportAndSaveEval(item, afterSaveRecordFn, stayOnSelectedItem);
        } else {
          this._saveRecord(item, afterSaveRecordFn, stayOnSelectedItem);
        }
      }, (err: any) => {
        this.debugError('ERROR creating appointment...', err);
        this.doneSavingWithError(item, err, APPT_TO_SAVE);
      });
    }
  }

  /**
    Save Record requires special handling because
    it takes the signed flag, which can entail signing-off
    an appointment, and we don't want to commit a sign-off until
    all related data is successfully saved and consistent.
    This implies that other associated calls have all
    succeeded (/appointments, file-upload, /documents, /evaluations).

    However, there is a special case - sending COMPLETED to /evaluations
    that requires that a record already exists. In this case, save the record
    with a short-circuit callback before saving the eval.

    This will have the effect of first saving the record without the signed flag
    and later re-saving the record with the signed flag after the other calls
    have been completed successfully. If the other calls were to fail, the
    record will be updated but remain unsigned while passing off to the error
    handling flow.
  */
  private _saveRecord(item: any, afterSaveFn: Function, stayOnSelectedItem: boolean) {
    const A = item.appointment;

    const notes = Object.assign(item.model.notes);
    const payload: any = {
      appointment: A.uuid,
      billing_code: item.model.billingCode,
      note_schema: item.model.oBillingCode.record_note_type,
      provider: this._provider.uuid,
      notes: JSON.stringify(notes),
      ui_source: this.isStandaloneAppointment() ? `cal` : `ida`,
    };

    if (this.isDevDebug('FORCE_SAVE_ERROR')) {
      payload.provider += 'DEV_DEBUG.FORCE_SAVE_ERROR';
      payload.notes = { DEV_DEBUG: 'FORCE_SAVE_ERROR' };
    }

    if (item.record) {
      payload.uuid = item.record.uuid;
    }

    if (this.isClientAppointment(item)) {
      payload.client = item.client.uuid;
    }

    const _record = item.record;
    const _oldClientService = _record && _record.client_service;
    const _clientService = item.model.clientService;
    if (this.isClientAppointment(item) && _clientService) {
      // allow a patch to an existing documentation record
      // for a client service that has since been marked completed
      if (_oldClientService !== _clientService) {
        payload.client_service = _clientService;
      }
    }

    if (this.isLocationAppointment(item) || this.isClientAppointment(item)) {
      payload.location = item.location.uuid;
    }

    if (item.model.trackingType) {
      payload.tracking_type = item.model.trackingType;
    }

    if (item.model.signed) {
      payload.signed = true;
      payload.signed_by = this._provider.uuid;
      payload.signed_on = new Date().toISOString();
    } else {
      payload.signed = false;
      payload.signed_by = null;
      payload.signed_on = null;
    }

    if (this.isAmendable(item) && (this.hasAmendments(item) || this.hasAmendmentsForNewEvent(item))) {
        this.addReasonForEditToSavePayload(item, payload);
    }

    this.plHttp.save('records', payload)
    .subscribe((res: any) => {
      const WAS_ALREADY_SIGNED = item.record && item.record.signed;
      if (WAS_ALREADY_SIGNED && !item.model.signed) {
          this._state.unsignedAppointmentsCount++;
          this._state.signedAppointmentsCount--;
      }
      if (!WAS_ALREADY_SIGNED && item.model.signed) {
          this._state.unsignedAppointmentsCount--;
          this._state.signedAppointmentsCount++;
      }

      // sync the local item record
      item.record = res;

      // sync the local appointment records array for each item in the group
      this.getItemsInGroupAppointment(item).map((apptItem: any) => {
          const records = apptItem.appointment.records;
          const index = records.findIndex((r: any) => r.uuid === item.record.uuid);
          if (index > -1) {
              records[index] = res;
          } else {
              apptItem.appointment.records = [...records, res];
          }
      });

      if (this.isEvaluationAppointment(item) && afterSaveFn) {
        this.util.log('saved eval record short-circuit, response:', {res, item});
        afterSaveFn(res);
        this._doneSaving(stayOnSelectedItem);
      } else {
        this.util.log('saved record final, response:', {res, item});
        let result;
        if (afterSaveFn) {
            result = afterSaveFn(res);
        }
        if (result !== 'EXIT') {
            this._doneSaving(stayOnSelectedItem);
        }
      }

      this._filterBillingCodesByType(item, item.model.oBillingCode);
      this.store.dispatch(PLLoadAppointment({ payload: item.appointment.uuid }));
    }, (err: any) => {
      this.debugError('error saving record', err);
      this.doneSavingWithError(item, err, payload);
    });
    if (this.isDevDebug('TELEMETRY')) {
      this.util.log('telemetry', this.getTelemetryInfoClasses(item));
    }
  }

    // When saving an evaluation, we need to check the response for updated status
    // to refresh client side state (e.g. In Process -> Completed renders differently)
    // To accomplish this, we'd like to use the existing data processing initializers
    // but the evaluation response differs slightly from the raw client service format
    // This method serves to process the evaluation response data into the expected
    // client service format to pass into the (re)initialization methods.
    // See workplace /api/v3/evaluations/:evaluation_uuid/activities/
    private _handleEvaluationResponseData(resEval: any, item: any) {
        // find the cached raw client service object
        const raw = item.clientServicesRaw
        const itemClientServiceId = (item.clientService && item.clientService.id)
            || item.model.clientService
            || (item.model.oClientService && item.model.oClientService.id)
        const index = raw.findIndex(((cs: any) => cs.id === itemClientServiceId));
        const clientService = raw[index];

        // update the raw client service object from the evaluation response data
        clientService.status = resEval.status.toUpperCase();
        clientService.statusDisplay = resEval.status_display;
        clientService.locked = resEval.locked;
        item.clientService = clientService;

        // run the _filterClientServices() method to update dependent state
        this._filterClientServices(item, item.client, item.model.oBillingCode);
    }

  private _saveEvaluation(item: any, afterSaveRecordFn: Function, stayOnSelectedItem: boolean) {
    const assessmentsUsed: string[] = [];
    item.model.assessmentsUsed.forEach((item: any) => item.length && assessmentsUsed.push(item));
    const params = {
      uuid: item.model.oClientService.id,
      service: item.model.oClientService.service.id,
      status: item.model.evaluationStatus.toLowerCase(),
      areas_of_concern: item.model.areasOfConcern,
      assessments_used: assessmentsUsed,
    };

    this.plHttp.save('evaluations', params, null, { suppressError: true })
        .subscribe((res: any) => {
          this.selectedAppointment.state.mappedApiErrorMessage = undefined;
          this._handleEvaluationResponseData(res, item);
          this._saveRecord(item, afterSaveRecordFn, stayOnSelectedItem);
        }, (err: any) => {
          this.debugError('error saving eval or upload', err);
          this.doneSavingWithError(item, err, params);
        });
  }

  private _handleDocumentUpload(item: any, awsInfo: any, saveEvalCallback: Function) {
    const fileObj = item.model.fileForUpload;
    this.util.log('upload file', fileObj);

    // TODO: add error callback to uploadBulk
    this.plFileUpload.uploadBulk(fileObj.files, awsInfo.url, awsInfo.fields, '0_', fileObj.file)
    .pipe(
      first(),
    )
    .subscribe((awsRes: any) => {
      const UPLOAD_DETAIL = awsRes[0];
      this.debugResponse('aws-upload res', UPLOAD_DETAIL);
      const documentSaveParams: any = {
        client: item.model.oClientService.client.id,
        client_service: item.model.oClientService.id,
        file_path: UPLOAD_DETAIL.key,
        document_type: this._model.evaluationReportDocumentType.uuid,
      };
      if (item.record && item.record.signed_on) {
        documentSaveParams.signed_on = this.util.formatUserDateSystem(moment(item.record.signed_on));
      }
      this.plHttp.save('documents', documentSaveParams)
      .subscribe((res: any) => {
        this.debugResponse('save documents res', res);
        saveEvalCallback(item);
      }, (err: any) => {
        this.debugError('error saving document', err);
        this.doneSavingWithError(item, err, documentSaveParams);
      });
    });
  }

  _uploadReportAndSaveEval(item: any, afterSaveRecordFn: Function, stayOnSelectedItem: boolean) {
      this._uploadEvaluationReport(item, () => {
          if (item.model.evaluationStatus === Const.clientServiceStatus.COMPLETED) {
              this._saveRecord(item, () => {
                  this._saveEvaluation(item, afterSaveRecordFn, stayOnSelectedItem);
              }, stayOnSelectedItem);
          } else {
              this._saveEvaluation(item, afterSaveRecordFn, stayOnSelectedItem);
          }
      });
  }
  _uploadEvaluationReport(item: any, saveEvalFn: Function) {
      if (item.model.fileForUpload) {
          this.plFileUpload.getAmazonUrl({ namespace: 'evaluation_reports' })
              .pipe(
                  first(),
              )
              .subscribe((res: any) => {
                  this.debugResponse('Amazon URL Detail', res);
                  this._handleDocumentUpload(item, res, saveEvalFn);
              }, (err: any) => {
                  this.debugError('error saving eval or upload', err);
                  this.doneSavingWithError(item, err, {});
              });
      } else {
          saveEvalFn();
      }
  }

  private _startSaving() {
    this._state.saving = true;
    this._state.globalReadyState = false;
    this._state.savingStartTime = new Date().getTime();
  }

  private _doneSaving(stayOnSelectedItem: boolean) {
    // use a minimum save time so user can see the "saving message";
    const MINIMUM_SAVE_TIME = 1;
    const now = new Date().getTime();
    const timeElapsed = now - this._state.savingStartTime;
    const extraTime = MINIMUM_SAVE_TIME - timeElapsed; // ok if negative

    this.selectedAppointment.state.signedCheckboxDirty = false;

    setTimeout(() => {
      this._state.saving = false;
      this.initCloneState(this.selectedAppointment);
      this.updateComponentListState(stayOnSelectedItem);
    }, extraTime);
  }

  private _processErrors(err: any, payload: any) {
    return {
      request_payload: payload,
      response_error: err.error,
      status: `${err.status} ${err.statusText}`,
      timestamp: new Date(),
      url: err.url,
      browser: navigator.userAgent,
      platform: navigator.platform,
    };
  }

  doneSavingWithError(item: any, err: any, payload: any) {
    const errorInfo = this._processErrors(err, payload);

    const ERROR = err.error;
    const NON_FIELD_ERR_MESSAGE = (ERROR && ERROR.non_field_errors && ERROR.non_field_errors[0])
    const MAPPED_ERR_MESSAGE = this._getMappedApiErrors(ERROR, NON_FIELD_ERR_MESSAGE);
    const ERR_MSG = NON_FIELD_ERR_MESSAGE || MAPPED_ERR_MESSAGE;

    if (ERR_MSG) {
        // check for spcific error messages for "friendly" display
        if (MAPPED_ERR_MESSAGE) {
            item.state.mappedApiErrorMessage = MAPPED_ERR_MESSAGE;
            this.util.errorLog('mapped api error', { ERR_MSG, MAPPED_ERR_MESSAGE });
        }
        // for all other API errors, show the "debug/support" display
        else
        {
            item.info.errors = [errorInfo];
        }
        item.info.apiErrorMessage = MAPPED_ERR_MESSAGE || ERR_MSG;
        const MSG = ERR_MSG && ERR_MSG.replace(/\s+/g, '-');
        item.info.apiErrorMessageClass = MSG && MSG.replace(/"/g, ' '); // avoid breaking HTML
        const ERR_URL_PARTS = err.url && err.url.split('/api/');
        const ERR_PATH = ERR_URL_PARTS && ERR_URL_PARTS.length === 2 && ERR_URL_PARTS[1];
        item.info.apiErrorPathClass = ERR_PATH && ERR_PATH.replace(/\//g, '-');
    }

    this.util.errorLog('_doneSavingWithError', errorInfo);
    if (this._state.onProcessAPIErrorsCallback) {
      try {
        this._state.onProcessAPIErrorsCallback();
        this.plToast.delayHide(100);
      } catch (e) { }
    }
    this._state.saving = false;
    this._state.globalReadyState = true;
  }

  private _getMappedApiErrors(err: any, nonFieldError: string): String {
      const SERVER_ERR_MSG = nonFieldError || (err.status && err.status[0]);
      if (SERVER_ERR_MSG) {
          const mappedMessage = ApiErrorMessages[SERVER_ERR_MSG];
          const useClientSideMessage = mappedMessage && (typeof (mappedMessage) === 'string');
          console.log('---', {SERVER_ERR_MSG, mappedMessage, useClientSideMessage })
          return useClientSideMessage ? mappedMessage : SERVER_ERR_MSG;
      }
  }

  private _getClients(appointmentsList: any[], fn: Function) {
    const timingStart = new Date().getTime();
    const clients = {};
    const GET_CLIENTS: any[] = [];
    const GET_CLIENT_SERVICES: any[] = [];
    const clientUuids: any[] = [];
    appointmentsList.forEach((item: any) => {
      item.clients.forEach((client: any) => {
        if (!clients[client.uuid]) {
          clients[client.uuid] = client;
          clientUuids.push(client.uuid)
          GET_CLIENTS.push(this.plHttp.get('clients', { uuid: client.uuid }));
          GET_CLIENT_SERVICES.push(this.plHttp.get('clientServices', { client: client.uuid }))
        }
      });
    });

    if (GET_CLIENTS.length) {
      const _CLIENT_FACTOR = 20;
      const _LIMIT = 100;

      const queries: any[] = [
        ...GET_CLIENTS,
        this.getClientServices(clientUuids, true, _LIMIT, 0),
      ];

      // INFO: gql BE is limited to pages of 100. Get all the client services.
      for (let i=1; i<6; i++) {
        if (GET_CLIENTS.length < _CLIENT_FACTOR * i) {
          break;
        }
        queries.push(this.getClientServices(clientUuids, true, _LIMIT, _LIMIT * i));
      }

      forkJoin(queries)
      .pipe(
        takeUntil(this.destroyed$),
        first(),
      )
      .subscribe(
        (res: any) => {
          res.map((resItem: any) => {
            // resItem can be either CLIENT or CLIENT_SERVICE
            if (resItem.birthday) {
              // CLIENT
              this._model.__clientsCache[resItem.uuid] = resItem;
              this._model.__clientsArray.push(resItem);
            } else {
              // CLIENT_SERVICE
              const cs = this._model.__clientServicesRawUnfiltered = [...this._model.__clientServicesRaw, ...resItem.clientServices];
              // filter client services by documentation-appropriate status
              this._model.__clientServicesRaw = cs.reduce ((result:string[], csItem:any) => {
                // remove evals that are not assigned to the calendar provider
                const isEvalService = csItem.hasOwnProperty('evaluationType');
                if (isEvalService && this.provider.uuid !== (csItem.assignedTo && csItem.assignedTo.id)) {
                    return result;
                }

                const nonTerminalClientServices = [
                    Const.clientServiceStatus.NOT_STARTED,
                    Const.clientServiceStatus.IN_PROCESS,
                    Const.clientServiceStatus.IDLE,
                ];
                if (nonTerminalClientServices.includes(csItem.status)) {
                  result.push(csItem);
                }
                return result;
              }, []);
            }
          });
          if (fn) fn();
          const timingEnd = new Date().getTime();
          this._state.startupInfo.timings.loadClientServices = timingEnd - timingStart;
          this._state.startupInfo.counts.clientServicesRaw = this._model.__clientServicesRaw.length;
          this._state.startupInfo.counts.clients = clientUuids.length;
        },
      (error: any) => {
        this.util.log('ERROR during get clients/services', error);
      });
    } else {
      if (fn) fn();
    }
  }

  // Order of operations matters!
  updateComponentListState(stayOnSelectedItem: boolean) {
    if (!this.selectedAppointment.record) return;
    
    const list = this._model.appointmentsList;
    const unsignedList = this._model.unsignedAppointmentsList;
    this.selectedAppointment.state.isSigned = this.selectedAppointment.record.signed;
    let nextItem: any;

    if (!stayOnSelectedItem && !this.isWorkComplete()) {
      // if at tail end of the list, wrap around to the first item
      if (this.getSelectedIndex() === list.length - 1) {
        nextItem = list[0];
      } else {
        // otherwise pick the next
        nextItem = list[this.getSelectedIndex() + 1];
      }
    } else {
      nextItem = this.selectedAppointment;
    }

    if (!this.isStandaloneAppointment() && this.selectedAppointment.record.signed) {
      unsignedList.splice(this.getSelectedIndex(), 1);
      this.setDisplayAppointmentGroups();
      if (!this.shouldShowList()) {
        nextItem = null;
        this._onWorkComplete();
      }
    }

    this._resetAppointment(this.selectedAppointment);
    this.selectedAppointment = nextItem;

    this._refreshView(() => {
      setTimeout(() => {
        if (!this.isWorkComplete() && !this.isStandaloneAppointment()) {
          document.getElementById(`row_${this.getSelectedIndex()}`).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
          this.onNextItem(this.selectedAppointment);
        }

        setTimeout(() => {
          this._state.globalReadyState = true;
          if (this.isStandaloneAppointment() && this.cdr) {
              this.detectChanges();
          }
        }, 1);
      }, 400);
    });
  }

  private _refreshDetailState() {
    this.toggle();
    setTimeout(() => {
      this.toggle();
      if (this._state.onSelectAppointmentCallback) {
        try {
          this._state.onSelectAppointmentCallback();
        } catch (e) { }
      }
    }, 200);
  }

  private _refreshView(fn?: Function) {
    this._refreshDetailState();
    if (fn) {
      fn();
    }
  }

  //-----------------------
  // class getter functions
  //-----------------------

  get data() {
    return this._model;
  }

  get model() {
    return this._model;
  }

  get state() {
    return this._state;
  }

  get appointmentsList() {
    return this._model.appointmentsList;
  }

  get selectedAppointment() {
    return this._model.selectedAppointment;
  }

  set selectedAppointment(item: any) {
    this._model.selectedAppointment = item;
  }

  get billingCodesList() {
    return this.selectedAppointment.billingCodesList;
  }

  get clientServicesList() {
    return this.selectedAppointment.clientServicesList;
  }

  get savedEvaluationActivities() {
    return this.selectedAppointment.model.savedEvaluationActivities;
  }

  get provider() {
    return this._provider;
  }

  get providerTimezone() {
      return this._provider.xProvider.timezone;
  }

  set providerTimezone(tz) {
      this._provider.xProvider.timezone = tz;
  }

  get evaluationDocumentType() {
    return this._model.evaluationReportDocumentType;
  }

  get cdr() {
      return this._state.cdr;
  }

  //--------------------------
  // system dev util functions
  //--------------------------

  setPageParams(params: any) {
    this._state.pageParams = params;
  }
  setDevDebug(csv: string) {
    this._state.flags = csv.split(',').reduce((result: any, item: String) => {
      result[`${item}`] = 1;
      return result;
    }, this._state.flags);
  }

  setDevDebugOn(key: string) {
    this._state.flags[`${key}`] = 1;
  }

  setDevDebugOff(key: string) {
    this._state.flags[`${key}`] = 0;
  }

  getFlags() {
    return this._state.flags;
  }

  getPageParam(name: string) {
    return this._state.pageParams && this._state.pageParams[`${name}`];
  }

  isDevDebug(key: string): Boolean {
    return !!(this._state.flags[`${key}`] || this._state.flags[`ALL`] || localStorage.getItem(key));
  }

  debug(message: string, ...values: Array<any>) {
    if (this._state.debug || localStorage) {
      console.log('[ DEBUG ]', `-- ${message}`);
      console.log('[ DEBUG ]', ...values);
      console.log('[ DEBUG ]');
    }
  }

  debugIf(fn: Function, message: string, ...values: Array<any>) {
    if (fn()) {
      this.debug(message, values);
    }
  }

  logOnceIf(fn: Function, context: string, ...values: Array<any>) {
    if (!fn()) return;
    if (this.isDevDebug('LOG_ONCE') && !this._state.logOnce[`${context}`]) {
      this.debug(`LOG-ONCE ${context}`, ...values);
    }
    this._state.logOnce[`${context}`] = 1;
  }

  logOnce(context: string, ...values: Array<any>) {
    if (this.isDevDebug('LOG_ONCE') && !this._state.logOnce[`${context}`]) {
      this.debug(`LOG-ONCE ${context}`, ...values);
    }
    this._state.logOnce[`${context}`] = 1;
  }

  debugResponse(message: string, ...values: Array<any>) {
    if (this.isDevDebug('RESPONSE')) {
      console.log('[ DEBUG ]', `-- ${message}`);
      console.log('[ DEBUG ]', ...values);
      console.log('[ DEBUG ]');
    }
  }

  debugConsole(info: any) {
    this._state.consoleContent.unshift(info);
  }

  debugError(message: string, err: any) {
    this.debug(message, err, err.error ? err.error.status : err.message);
    this.debugConsole({
      message: `[${message}]`,
      errMessage: `${err.message} | ${err.error ? err.error.status : ''}`,
    });
  }

  json(obj: any) {
    return JSON.stringify(obj);
  }
}

// work complete messages
const WorkCompleteMessages = [
    { text: `Enjoy a virtual cookie.`, graphic: 'cookie', width: 100, height: 96 },
    { text: `Nothing squirrely going on here.`, graphic: 'squirrel', width: 125, height: 168 },
    { text: `You didn't even need me - go you!`, graphic: 'coffee', width: 98, height: 125 },
    { text: `Early bird gets the invoice worm!`, graphic: 'robin', width: 112, height: 125 },
];

// handle known error messages
const ApiErrorMessages = {
    [`The evaluation can't be completed because it has appointments in the future`]: 1,
    [`Modification of a locked appointment is not allowed!`]: 1,
    [`Cannot create appointments in a locked period.`]: 1,
    [`The evaluation can't be cancelled because it contains unsigned activities.`]: 'Cannot mark evaluation as CANCELLED unless all components have been updated to Done or removed',
}

const SIGNOFF_LABEL_OPEN_PERIOD = 'I verify that this event occurred, as reported';
const SIGNOFF_LABEL_AMENDMENT = 'I verify that the amendments made are accurate';
const MAX_QUERY_LIMIT = 1000;

const Const = {
    clientServiceStatus: {
        IDLE: 'IDLE',
        NOT_STARTED: 'NOT_STARTED',
        IN_PROCESS: 'IN_PROCESS',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED',
    },
    clientServiceStatusDisplayValue: {
      IDLE: 'Idle',
      NOT_STARTED: 'Not Started',
      IN_PROCESS: 'In Process',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    },
    billingCode: {
        CONSULTATION: 'consultation',
        STUDENT_ABSENCE_LT_24_HR: 'unplanned_student_absence',
        STUDENT_ABSENCE_NO_NOTICE: 'student_absence_no_notice',

        SL_OT_SUPERVISION_DIRECT: 'cf_slpa_cota_sup_direct',
        SL_OT_SUPERVISION_INDIRECT_BY_CLIENT: 'cf_slpa_cota_sup_indirect',

        SL_SUPERVISION_INDIRECT_BY_LOCATION: 'supervisionIndirect',
    },
    serviceCode: {
        SLT_SUPERVISION: 'supervision_slt',
        OT_SUPERVISION: 'supervision_ot',

        BMH_CONSULTATION: 'consultation_bmh',
        BMH_SERVICES_DIRECT: 'direct_bmh',

        SLT_CONSULTATION: 'consultation_slt',
        SLT_SERVICES_DIRECT: 'direct_slt',

        OT_CONSULTATION: 'consultation_ot',
        OT_SERVICES_DIRECT: 'direct_ot',
    },
    amendmentReasonOpts: [
      { value: 'Late Entry', label: '<b>Late Entry</b> - Added a new event that did not previously exist'},
      { value: 'Addendum', label: '<b>Addendum</b> - Added new information to a prior event'},
      { value: 'Correction', label: '<b>Correction</b> - Corrected the details of a prior event'},
      { value: `Manager's Request`, label: `<b>Manager's Request</b> - Updated the event based on manager's feedback`},
      { value: `Customer's Request`, label: `<b>Customer's Request</b> - Updated the event based on the customer's feedback`},
    ],
    evalActivityStatusOpts: [
      { value: 'todo', label: 'To Do'},
      { value: 'in_progress', label: 'In Progress'},
      { value: 'done', label: 'Done'},
    ],
    errorTypes: {
        ERR_CLIENT_NOT_IN_CASELOAD: 'ERR_CLIENT_NOT_IN_CASELOAD',
    },
    // use for local storage of the billing period data range to minimize calls to the API.
    KEY_BILLING_PERIOD: 'KEY_BILLING_PERIOD',
}
