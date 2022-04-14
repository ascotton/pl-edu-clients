import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PLHttpService, PLGraphQLService, PLTimezoneService } from '@root/index';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, Subject, forkJoin, of } from 'rxjs';
import { first, tap, map, mergeMap } from 'rxjs/operators';

import { AppStore } from '@app/appstore.model';

import * as moment from 'moment';

@Injectable()
export class PLUtilService {
    public static CONSOLE_STYLE_DEBUG = 'color:darkgray;font-size:11px;padding:';
    public static CONSOLE_STYLE_DEBUG_API = 'color:darkorange;font-size:11px;padding:';
    public static CONSOLE_STYLE_TRACE = 'background-color:black;color: silver;font-size:11px;padding: 1px 0';
    public static CONSOLE_STYLE_INFO = 'color:darkorange;font-size:11px;border:1px solid black;border-radius:5px;padding: 5px;margin:10px;';
    public static CONSOLE_STYLE_WARN = 'color:brown;font-size:11px;border:1px solid black;border-radius:5px;padding: 5px;margin:10px;';
    public static CONSOLE_STYLE_ERROR = 'background-color:brown;color:white;font-size:13px;border:1px solid black;border-radius:5px;padding: 5px;margin:10px;';
    public static CONSOLE_STYLE_TEST = 'color:green;font-size:12px;';
    public static CONSOLE_STYLE_HILITE = 'color:yellow;font-size:12px;';
    public static CONSOLE_STYLE_MOCK = 'color:cyan;font-size:12px;';

    public ID = Math.random().toString().substring(2, 6);
    constructor(
        private store: Store<AppStore>,
        private route: ActivatedRoute,
        private plHttp: PLHttpService,
        private plGraphQL: PLGraphQLService,
        private location: Location,
        private plTimezone: PLTimezoneService,
    ) {}

    getFlows(state: PLComponentStateInterface) {
        return state.flow;
    }

    inFlow(key: string, state: PLComponentStateInterface) {
        return state.flow && state.flow[key];
    }

    startFlow(key: string, state: PLComponentStateInterface) {
        state.flow[key] = true;
        this.debugLog(`start flow ${key}`, '', state);
    }

    endFlow(key: string, state: PLComponentStateInterface) {
        delete state.flow[key];
        this.debugLog(`end flow ${key}`, '', state);
    }

    getRoute() {
        return this.route;
    }

    getQueryParams(route?: ActivatedRoute) {
        return route ? route.queryParams : this.route.queryParams;
    }

    flag(state: PLComponentStateInterface, key: string) {
        return this.isDevDebug_(state, key);
    }

    flagDebug(state: PLComponentStateInterface, key: string) {
        return this.isDebug(state) && this.flag(state, key);
    }

    flagLocalStorage(key: string) {
        return localStorage.getItem(key);
    }

    initComponent(input: PLComponentInitInput): PLComponentStateInterface {
        const state: PLComponentStateInterface = this.newComponentStateInstance(input.name, input.params || {});
        const initObservables = state.init.initObservables = input.initObservables || [];
        if (!input.skipAutoInitObservables) {
            initObservables.push(this.getCurrentUserInitObservable());
            initObservables.push(this.getQueryParamsInitObservable());
        }
        const observables = initObservables.map(((item: PLComponentInitObservable) => item.observable));
        let subscribeReentryCount = 0;

        state.init.initSubscriptions = combineLatest(
      observables,
    )
    .subscribe((res: any[]) => {
        subscribeReentryCount++;
      // NOTE: subscribe is re-entrant until observables are ready.
      // CAUTION: ensure that we complete initialization only once.
        const complete = !initObservables.find((item: any) => !item.finished);
        if (!complete) {
            initObservables.forEach((item: PLComponentInitObservable, index: number) => {
                const data = res[index];
                const isDataReady = !item.isDataReady || item.isDataReady(data, state);
                if (!isDataReady || item.finished) return;

                item.handler(data, state);
                item.data = data;
                item.finished = true;
            });

            const ready = !initObservables.find((item: any) => !item.finished);
            if (!ready) return;
        }

      // HERE - Subscriptions are finished
        this.traceLog(`init subscribe re-entry count ${subscribeReentryCount}`, '', state);

        this.setDebugFlags_(state, input);
        state.activeFlags = this.getActiveDebugFlags(state);
        state.availableFlags = INFO_DEBUG_KEYS;

        const done$ = new Subject();
        const done: PLComponentInitDone = (doneParams) => {
            if (state.hasOwnProperty('asyncCount')) {
                if (--state.asyncCount) {
                    return false;
                }
            }
            setTimeout(() => {
                done$.next();
                if (!state.destroyingComponent && input.afterDoneFn) {
                    input.afterDoneFn(state);
                }
                if (doneParams && doneParams.message && this.flag(state, 'DEBUG') && this.flag(state, 'INIT_DONE_MESSAGE')) {
                    this.debugLog(`init done\n-- ${doneParams.message}`, '', state);
                }
            });
            return true;
        };
        if (!input.fn) done$.next();

        try {
            if (input.fn) input.fn(state, done);
        } catch (e) {
            state.init.initError = e;
            this.errorLog('', state.init.initError, state);
            done$.next();
        }

        done$.pipe(first()).subscribe((_: any) => {
            state.initialized = true;
            state.init.initResultResponses = res;
            if (this.flag(state, 'DEBUG')
          && !this.flag(state, 'NO_DEBUG')
          && this.flag(state, 'COMPONENT_INIT')
          && !state.init.initError) {
                this.debugLog(`component initialized`, null, state);
            }
            if (state.init.initSubscriptions) state.init.initSubscriptions.unsubscribe();
        });
    });
        state.flag = (key: string) => this.flag(state, key);
        return state;
    }

    reRender(renderToggle: { toggle: boolean }) {
        renderToggle.toggle = false;
        setTimeout(() => {
            renderToggle.toggle = true;
        }, 0);
    }

    getRouteInitObservable(): PLComponentInitObservable {
        return {
            name: 'Route Param',
            observable: this.getRoute().params.pipe(first()),
            isDataReady: (data: any, state: PLComponentStateInterface) => {
                return data;
            },
            handler: (data: any, state: PLComponentStateInterface) => {
                state.routeParams = state.routeParams || {};
                state.routeParams.params = data.params;
            },
        };
    }

    getParentRouteInitObservable(): PLComponentInitObservable {
        return {
            name: 'Parent Route Param',
            observable: this.getRoute().parent.params.pipe(first()),
            isDataReady: (data: any, state: PLComponentStateInterface) => {
                return data;
            },
            handler: (data: any, state: PLComponentStateInterface) => {
                state.routeParams = state.routeParams || {};
                state.routeParams.parentParams = data.params;
            },
        };
    }

    getCurrentClientInitObservable(uuid: string): PLComponentInitObservable {
        const observable: Observable<any> = this.plHttp.get('clients', { uuid });
        return {
            observable,
            name: 'current-client',
            isDataReady: (data: any, state: PLComponentStateInterface) => {
                return data.uuid;
            },
            handler: (data: any, state: PLComponentStateInterface) => {
                state.model.clientId = data.uuid;
                state.client = data;
            },
        };
    }

    getCurrentClientInitObservable2(): PLComponentInitObservable {
        const url = window.location.href;
        const parts = url.split('/c/client/');
        const end = parts[1].indexOf('/');
        const uuid = parts[1].substring(0, end);
        return {
            name: 'current-client',
            observable: this.plHttp.get('clients', { uuid }),
            isDataReady: (data: any, state: PLComponentStateInterface) => {
                return data.uuid;
            },
            handler: (data: any, state: PLComponentStateInterface) => {
                state.model.clientId = data.uuid;
                state.client = data;
            },
        };
    }

    getCurrentUserInitObservable(): PLComponentInitObservable {
        return {
            name: 'current-user',
            observable: this.store.select('currentUser'),
            isDataReady: (data: any, state: PLComponentStateInterface) => {
                return data && data.uuid;
            },
            handler: (data: any, state: PLComponentStateInterface) => {
                state.currentUser = data;
            },
        };
    }

    getQueryParamsInitObservable(): PLComponentInitObservable {
        return {
            name: 'query-params',
            observable: this.getQueryParams(this.route),
            isDataReady: (data: any, state: PLComponentStateInterface) => {
                return data;
            },
            handler: (data: any, state: PLComponentStateInterface) => {
                if (data) {
                    state.queryParams = data;
                }
            },
        };
    }

    showDivs(state: PLComponentStateInterface) {
        return this.flag(state, 'SHOW_DIVS') && !this.flag(state, 'OVERRIDE_SHOW_DIVS');
    }

    isFullScreenRoute() {
        if (this.flagLocalStorage('FORCE_FULL_SCREEN')) {
            return true;
        }
    // TODO: use regex pattern match
        const fullScreenRoutes: string[] = [
            '/goal-status',
            '/exit-status',
            '/test-api',
        ];
        return fullScreenRoutes.find((item: any) => {
            return !!document.location.href.includes(item);
        });
    }

    getUrlPath(withHash?: boolean) {
        return this.location.path(withHash);
    }

    setHashFragment(fragment: string) {
        const path = this.location.path();
        this.location.go(`${path}#${fragment}`);
    }

    getHashFragment() {
        const path = this.location.path(true);
        const split = path.split('#');
        return split.length === 2 && split[1];
    }

    getHashFragmentTokens(hashFragment?: string) {
        const hf = hashFragment || this.getHashFragment();
        return hf && hf.split('/');
    }

    removeHashFragment() {
        const path = this.location.path();
        this.location.go(path);
    }

    getDateString(dateTime: string, timezone: string) {
        return moment.tz(dateTime, timezone).format('YYYY-MM-DD');
    }

  // Dates need to be interpreted in some timezone.
  // Date comparisons need to use a consistent interpretation.
  // Use utc for date comparisons.
  // https://jsfiddle.net/2reqthzo/
    getTodayNormalized() {
        const date = moment.utc(moment().format('YYYY-MM-DD'));
        return {
            date,
            dateString: date.format('YYYY-MM-DD'),
            dateStringDisplay: date.format('MM/DD/YYYY'),
            dateStringDisplayCompact: date.format('M/D/YYYY'),
            monthAbbrev: date.format('MMM'),
        };
    }

  // normalize a plain DATE (T00:00 UTC)
    getDateNormalized(dateString: string) {
        const date = moment.utc(dateString);
        return {
            date,
            dateString: date.format('YYYY-MM-DD'),
            dateStringDisplay: date.format('MM/DD/YYYY'),
            dateStringDisplayCompact: date.format('M/D/YYYY'),
            monthAbbrev: date.format('MMM'),
        };
    }

    // moment for a date in a timezone
    getLocalizedDateMoment(date: string, timezone: string) {
        return moment.tz(date, timezone);
    }

    // local formatted date-time string, offset not appended
    getLocalizedDateValueNoOffset(date: string, timezone: string) {
        return this.getLocalizedDateMoment(date, timezone).format(DATE_FORMAT_LOCAL_NO_OFFSET);
    }

    // local formatted date-time string, with offset
    getLocalizedDateValueWithOffset(date: string, timezone: string) {
        return this.getLocalizedDateMoment(date, timezone).format().replace('T', ' ');
    }

    // date in a timezone, formatted to iso UTC [Z]
    getLocalizedDateUTC(date: string, timezone: string) {
        return this.getLocalizedDateMoment(date, timezone).toISOString();
    }

    toLocalTime(appointment: any, timezone: string, forDisplay: boolean = true): any {
        const { apptStart, apptEnd, apptOriginalEnd, apptOriginalStart } = this.computeAppointmentLocalDateTimes(appointment, timezone, forDisplay);
        return {
            ...appointment,
            end: apptEnd.format(this.plTimezone.formatDateTime),
            start: apptStart.format(this.plTimezone.formatDateTime),
            original_start: apptOriginalStart.format(this.plTimezone.formatDateTime),
            original_end: apptOriginalEnd.format(this.plTimezone.formatDateTime),
        };
    }

    formatUserDateSystem(userDateMoment: any) {
        return userDateMoment.format(DATE_FORMAT_SYSTEM);
    }

    formatUserDateDisplay(userDateMoment: any) {
        return userDateMoment.format(DATE_FORMAT_DISPLAY);
    }

  /**
   * For appointments on a recurring event that are shifted after a DST crossover
   * adjust by the amount of the utcOffsetDiff to preserve the provider's appointment time.
   * @param forDisplay - controls the direction of the adjustment (for display or save)
   */
    computeAppointmentLocalDateTimes(A: any, timezone: string, forDisplay: boolean = true) {
        const IS_DST = moment(A.start).isDST();
        const OFFSET_DIFF = moment.tz(A.event.start, timezone).utcOffset() - moment.tz(A.start, timezone).utcOffset();
        const DIRECTION = forDisplay ? 'add' : 'subtract';
        const apptStart = moment.tz(A.start, timezone)[DIRECTION](OFFSET_DIFF, 'minutes');
        const apptEnd = moment.tz(A.end, timezone)[DIRECTION](OFFSET_DIFF, 'minutes');
        const startFormattedISO = apptStart.toISOString();
        const endFormattedISO = apptEnd.toISOString();

        let CROSSOVER = 'NONE';
        if (IS_DST && OFFSET_DIFF < 0) {
            CROSSOVER = 'ST -> DST';
        } else if (!IS_DST && OFFSET_DIFF > 0) {
            CROSSOVER = 'DST -> ST';
        }

        let apptOriginalStart;
        let apptOriginalEnd;
        if (A.original_start) {
            apptOriginalStart = moment.tz(A.original_start, timezone);
        }
        if (A.original_end) {
            apptOriginalEnd = moment.tz(A.original_end, timezone);
        }
        if (!forDisplay) {
            this.log('DST crossover offset diff for Save', {
                OFFSET_DIFF,
                DIRECTION,
                IS_DST,
                CROSSOVER,
                timezone,
                appointment: A,
            });
        }

        return {
            apptStart,
            apptEnd,
            apptOriginalStart,
            apptOriginalEnd,
            startFormattedISO,
            endFormattedISO,
        };
    }

    getLocalDateTimes(A: any, timezone: string) {
        return {
            apptStart: moment.tz(A.start, timezone),
            apptEnd: moment.tz(A.end, timezone),
        }
    }

  /*
  // no adjustment if appointment time is modified
  return (A.start !== A.original_start || A.end !== A.original_end) ? 0
    : moment.tz(A.event.start, timezone).utcOffset() - moment.tz(A.start, timezone).utcOffset();
  */

  // A Basic form validator
  // fn(messages, enums, clickSave) {
  //  messages[key] = {message: 'REQUIRED'};
  // }
    validateForm(state: PLComponentStateInterface, fn: Function) {
        const messages = state.model.validationResults = {};
        fn(messages);
        return { results: messages, isValid: (Object.keys(messages).length === 0) };
    }

    getValidationMessage(key: string, state: PLComponentStateInterface) {
        const r = state.model.validationResults;
        return (r && r[key] && r[key].message) || (r && r[key]) || '';
    }

    getValidationResults(state: PLComponentStateInterface) {
        return state.model.validationResults;
    }

    registerReleaseableSubscription(state: PLComponentStateInterface, sub: any) {
        state.subs.push(sub);
    }

  /**
   * 1. fetch the first page
   * 2. get the total count
   * 3. determine how many more pages
   * 4. forkJoin the rest
   * 5. return the combined result
   */
    fetchAll(typeLabel: string, resourceNameOrGql: string, params: any, gqlResultHandler: (r: any) => any = undefined, gqlCountHandler: (r: any) => any = undefined) {
        const PAGE_LIMIT = params.first /** GQL */ || params.limit /** REST */ || 1000;

        const resultHandler = gqlResultHandler || ((_: any) => _.results);

        const firstFetch$ = gqlResultHandler
            ? this.plGraphQL.query(resourceNameOrGql, { first: PAGE_LIMIT, offset: 0, ...params }, {}).pipe(first())
            : this.plHttp.get(resourceNameOrGql, { limit: PAGE_LIMIT, page: 1, ...params });

        return firstFetch$.pipe(
          tap((r1: any) => {
              console.log('--- FETCH ALL', {typeLabel, r1})
            }),
          mergeMap((r1: any) => {
              const r1Results = resultHandler(r1);
              const COUNT = gqlCountHandler ? gqlCountHandler(r1) : r1.count;
              const totalPages = Math.floor(COUNT / PAGE_LIMIT) + ((COUNT % PAGE_LIMIT) && 1);
              if (totalPages > 1) {
                  const remainingFetches: any[] = [];
                  for (let i = 1; i < totalPages; i++) {
                      const nextFetch$ = gqlResultHandler
                          ? this.plGraphQL.query(resourceNameOrGql, { first: PAGE_LIMIT, offset: i * PAGE_LIMIT, ...params }, {}).pipe(first())
                          : this.plHttp.get(resourceNameOrGql, { limit: PAGE_LIMIT, page: i+1,  ...params });
                      remainingFetches.push(nextFetch$);
                  }
                  return forkJoin(remainingFetches).pipe(
                      map((r2: any) => {
                          /* @ts-ignore */
                          return [...r1Results, ...r2.flatMap(resultHandler)]
                      }),
                  );
              }
              return of(r1Results);
          }),
      );
    }

    noLog(message: string, obj?: any) {
        // do nothing
    }

    logOnly(message: string, obj?: any) {
        console.log(`%c${message}`, PLUtilService.CONSOLE_STYLE_DEBUG, obj || '');
    }

    log(message: string, obj?: any) {
        if (localStorage.getItem('LOG_OFF')) return;
        console.log(`%c${message}`, PLUtilService.CONSOLE_STYLE_DEBUG, obj || '');
    }

    log2(message: string, obj?: any) {
        if (localStorage.getItem('LOG_OFF')) return;
        console.log(`%c💠 --- ${message}`, PLUtilService.CONSOLE_STYLE_DEBUG, obj || '');
    }

    plog(message: string, obj?: any) {
        if (localStorage.getItem('LOG_OFF')) return;
        const state = obj && (obj.STATE || obj.state);
        const prefix = (state && state.ID && `[${state.ID}] ${state.componentName}\n`) || '';
        console.log(`%c${prefix}${message}`, PLUtilService.CONSOLE_STYLE_DEBUG, obj || '');
    }

    llog(message: string, obj: any, key?: string) {
        if (localStorage.getItem('LOG_OFF')) return;
        const ON = !key || this.flagLocalStorage(key);
        if (!ON) return;
        const state = obj && (obj.STATE || obj.state);
        const prefix = (state && state.ID && `[${state.ID}] ${state.componentName}\n`) || '';
        console.log(`🌿 %c${prefix}${message}`, PLUtilService.CONSOLE_STYLE_DEBUG, obj);
    }

    elog(message: string, obj: any, key?: string) {
        const state = obj && (obj.STATE || obj.state);
        const prefix = (state && state.ID && `[${state.ID}] ${state.componentName}\n`) || '';
        console.log(`🚫 %c${prefix}${message}`, PLUtilService.CONSOLE_STYLE_DEBUG, obj);
    }

    debugLog(message: string, obj: any, state: PLComponentStateInterface) {
        if (localStorage.getItem('LOG_OFF')) return;
        const prefix = state && `[${state.ID}] ${state.componentName}\n` || '';
        const OBJ = (obj && { obj }) || {};
        const _obj = { ...OBJ, STATE: state || {} };
        if (this.flag(state, 'DEBUG')) console.log(`%c${prefix}${message}`, PLUtilService.CONSOLE_STYLE_DEBUG, _obj);
    }

    traceLog(message: string, obj: any, state?: PLComponentStateInterface) {
        if (localStorage.getItem('LOG_OFF')) return;
        const prefix = state && `[${state.ID}] ${state.componentName}\n ` || '';
        const _obj = { obj: obj || '', STATE: state || {} };
        if (this.flag(state, 'TRACE')) console.log(`%c ${prefix}${message} `, PLUtilService.CONSOLE_STYLE_TRACE, _obj);
    }

    infoLog(message: string, obj: any, state?: PLComponentStateInterface) {
        if (localStorage.getItem('LOG_OFF')) return;
        console.log(`%c${message}`, PLUtilService.CONSOLE_STYLE_INFO, obj || '', state || '');
    }

    warnLog(message: string, obj: any, state?: PLComponentStateInterface) {
        if (localStorage.getItem('LOG_OFF')) return;
        console.log(`%cWARNING: ${message}`, PLUtilService.CONSOLE_STYLE_WARN, obj || '', state || '');
    }

    errorLog(message: string, obj: any, state?: PLComponentStateInterface) {
        console.log(`⭕ %c ERROR: ${message}`, PLUtilService.CONSOLE_STYLE_ERROR, obj || '', state || '');
    }

    testLog(message: string, obj: any, state: PLComponentStateInterface) {
        if (localStorage.getItem('LOG_OFF')) return;
        const prefix = state && `[${state.ID}] ${state.componentName}\n` || '';
        if (this.flag(state, 'DEBUG') && this.flag(state, 'RUN_TEST')) {
            console.log(`-- init test %c${prefix}${message}`, PLUtilService.CONSOLE_STYLE_TEST, obj || '', state || '');
        }
    }

    hiliteLog(message: string, obj: any, state: PLComponentStateInterface) {
        const prefix = state && `[${state.ID}] ${state.componentName}\n` || '';
        if (this.flag(state, 'DEBUG') && this.flag(state, 'DEBUG_HILITE')) {
            console.log(`%c${prefix}${message}`, PLUtilService.CONSOLE_STYLE_HILITE, obj || '', state || '');
        }
    }

    mockLog(message: string, obj: any, state: PLComponentStateInterface) {
        if (localStorage.getItem('LOG_OFF')) return;
        const prefix = state && `[${state.ID}] ${state.componentName}\n` || '';
        if (this.flag(state, 'DEBUG') && this.flag(state, 'MOCKS')) {
            console.log(`%c${prefix}${message}`, PLUtilService.CONSOLE_STYLE_MOCK, obj || '', state || '');
        }
    }

    debugLogApi(message: string, obj: any, state?: PLComponentStateInterface) {
        if (localStorage.getItem('LOG_OFF')) return;
        const prefix = state && `[${state.ID}] ${state.componentName}\n` || '';
        if (this.flag(state, 'DEBUG') && this.flag(state, 'DEBUG_API')) {
            console.log(`%c${prefix}API: ${message}`, PLUtilService.CONSOLE_STYLE_DEBUG_API, obj || '', state || '');
        }
    }

    isDebug(state: PLComponentStateInterface) {
        return this.isDevDebug_(state, 'DEBUG');
    }

    useMock(state: PLComponentStateInterface, mockKey: string) {
        return this.flag(state, mockKey);
    }

    hackRecalcTooltipPosition() {
        setTimeout(() => {
            window.scrollBy(0, 1);
            window.scrollBy(0, -1);
        });
    }

    newComponentStateInstance(componentName: String, params?: any): PLComponentStateInterface {
        const { flags, mocks, model } = (params || { flags: {}, mocks: [], model: {} });
        const mockFlags = {};
        if (mocks) {
            mocks.forEach((key: string) => mockFlags[key] = 1);
        }

        return {
            componentName,
            flags: {
                ...flags,
                ...mockFlags,
                HILITE: 1,
            },
            enabledMocks: mocks || [],
            model: {
                ...model,
                data: {},
                info: {},
            },
            test: {},
            currentUser: {},
            route: this.route,
            initialized: false,
            refreshPage: 0,
            destroyingComponent: false,
            initSubscriptions: null,
            subscriptions: [],
            initObservables: [],
            ID: Math.random().toString().substring(2, 6),
            flow: {},
            init: {},
        };
    }

    runTest(state: PLComponentStateInterface, fn: Function) {
        if (!this.isDevDebug_(state, 'RUN_TEST')) return;
        if (fn) setTimeout(fn, 1000);
    }

  // ----------- private -----------
    private isDevDebug_(state: PLComponentStateInterface, key: string): Boolean {
        return (state && state.flags && (!!(state.flags[`${key}`] || state.flags[`ALL`])))
      || !!localStorage.getItem(key);
    }

    private setDebugFlags_(state: any, input: any) {
        const queryFlags = (state.queryParams && state.queryParams.flags && state.queryParams.flags.split(',')) || [];
        const inputFlags = (input.params && input.params.flags) || {};
        const mockFlags = (input.params && input.params.mocks) || [];
        const allFlags = {};

        queryFlags.forEach((item: string) => {
            allFlags[item.trim()] = 1;
        });
        Object.keys(inputFlags).forEach((key: string) => {
            if (inputFlags[key]) {
                allFlags[key] = 1;
            }
        });
        mockFlags.forEach((item: string) => {
            allFlags[item.trim()] = 1;
        });

        state.flags = allFlags;
    }

  // ----------- lifecycle -----------
    destroyComponent(state: PLComponentStateInterface, fn?: Function) {
        state.destroyingComponent = true;
        if (state && state.subscriptions) {
            state.subscriptions.forEach((s: any) => s.unsubscribe());
            this.traceLog(`unsubscriptions count: ${state.subscriptions.length}`, '', state);
        }
        if (fn) fn();
    }

  // ---- deprecated, backward compatibility -----
    setDebugFlags(state: any, params: any) {
        if (params.flags) {
            state.flags = params.flags.split(',').reduce((result: any, item: String) => {
                result[`${item}`] = 1;
                return result;
            }, state.flags);
        }
    }

    initDebugFlags(state: any, callback?: Function) {
        this.getQueryParams(this.route).subscribe((params: any) => {
            this.setDebugFlags(state, params);
            if (callback) {
                callback(state);
            }
            console.log(`--- ${state.componentName} init`, state);
        });
    }

    debugFlag(state: any, key: string) {
        return state.devDebugFlags && state.devDebugFlags[key] || localStorage.getItem(key);
    }

    debugComponent(state: any) {
        return this.debugFlag(state, 'DEBUG');
    }

    debugDiv(state: any) {
        return this.debugComponent(state) && this.debugFlag(state, 'SHOW_DIVS');
    }

    getActiveDebugFlags(state: PLComponentStateInterface) {
        const result = {};
        let count = 0;
        const enabledMocks = state.enabledMocks || [];
        const keys = [...Object.keys(INFO_DEBUG_KEYS), ...enabledMocks, ...Object.keys(state.flags)];
        delete state.enabledMocks;
        keys.forEach((key: string) => {
            if (this.flag(state, key)) {
                const globalMark = localStorage.getItem(key) ? ' *' : '';
                result[`${key}${globalMark}`] = INFO_DEBUG_KEYS[key] || 'enabled';
                count++;
            }
        });
        if (count) {
            return result;
        }
    }

    canCopyToClipboard() {
        return (window.getSelection && window.getSelection().empty)
    || window.getSelection().removeAllRanges;
    }

    copyToClipboard(querySelector: string) {
        this.selectElementText(querySelector);
        document.execCommand('copy');
        this.clearSelectedText();
    }

    selectElementText(querySelector: string, win_?: any) {
        const win = win_ || window;
        const el = document.querySelector(querySelector);
        const doc = win.document;
        let sel;
        let range;
        if (win.getSelection && doc.createRange) {
            sel = win.getSelection();
            range = doc.createRange();
            range.selectNodeContents(el);
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (doc.body.createTextRange) {
            range = doc.body.createTextRange();
            range.moveToElementText(el);
            range.select();
        }
    }

    clearSelectedText() {
        if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) {  // Firefox
                window.getSelection().removeAllRanges();
            }
        }
    }
}

const INFO_DEBUG_KEYS = {
  // General
    DEBUG: 'enable debug logging',
    DEBUG_ADMIN: 'allow admin level functions, e.g. for api_playground',
    DEBUG_BAR: 'display debug bar',
    TRACE: 'enable trace logging',
    MOCKS: 'enable mocks logging',
    DEBUG_API: 'enable api call logging',
    NO_DEBUG: 'disable debug logging for a single log message',
    COMPONENT_INIT: 'enable component init debug logging',
    INIT_DONE_MESSAGE: 'enable init done messages',
    SHOW_DIVS: 'display component borders, name, and ID',
    FORCE_FULL_SCREEN: 'display page component in full screen mode',
    RUN_TEST: 'run and display "tests" included in component init',
    PL_ENV: 'override stag env auth domain, e.g. PL_ENV=bitcoin',

  // Features, mocks
    NO_ADD_USER: 'force no add user permission',

  // Experimental
    TEST_API_STREAMS: 'rxjs streams with async pipe',
};

export interface PLComponentStateInterface {
    componentName: String;
    flags: {};
    model: any;
    test: any;
    route: ActivatedRoute;
    currentUser: any;
    destroyingComponent: boolean;
    initSubscriptions?: any;
    initObservablesx?: PLComponentInitObservable[];
    [x: string]: any;
}

export interface PLComponentInitObservable {
    name: String;
    observable: Observable<any>;
    handler: Function;
    finished?: boolean;
    data?: any;
    isDataReady(data: any, state: PLComponentStateInterface): any;
}

export interface PLComponentInitInput {
    name: String;
    params?: any;
    initObservables?: PLComponentInitObservable[];
    skipAutoInitObservables?: boolean;
    fn?: PLComponentInit;
    afterDoneFn?: Function;
}

export type PLComponentInitObservableHandler = (data: any, state: PLComponentStateInterface) => void;
export type PLComponentInitDone = (params?: {message?: string, asyncCount?: number}) => boolean;
type PLComponentInit = (state: PLComponentStateInterface, done: PLComponentInitDone) => void;
const DATE_FORMAT_ISO = 'YYYY-MM-DD HH:mm:ss+00:00';
const DATE_FORMAT_LOCAL_NO_OFFSET = 'YYYY-MM-DD HH:mm:ss';
const DATE_FORMAT_LOCAL_WITH_OFFSET = 'YYYY-MM-DD HH:mm:ssZ';
const DATE_FORMAT_SYSTEM = 'YYYY-MM-DD';
const DATE_FORMAT_DISPLAY = 'MM/DD/YYYY';
