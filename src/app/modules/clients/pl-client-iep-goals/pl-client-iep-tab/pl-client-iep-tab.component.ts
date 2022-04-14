import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import {
    PLUtilService, PLComponentStateInterface,
    PLEventMessageBus, PLEventStream, PLMessageStream, PLEventMessage,
} from '@common/services';
import { PLClientIEPGoalsService, PLIEPFlow, PLIEPContext } from '../pl-client-iep-goals.service';

@Component({
    selector: 'pl-client-iep-tab',
    templateUrl: './pl-client-iep-tab.component.html',
    styleUrls: ['./pl-client-iep-tab.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger(
            'enterAnimation', [
                transition(':enter', [
                    style({ height: '100%', opacity: 0 }),
                    animate('600ms', style({ height: '100%', opacity: 1 })),
                ]),
            ],
        ),
    ],
})

export class PLClientIEPTabComponent implements OnInit, OnDestroy {
    public _state: PLComponentStateInterface;
    private classname = 'PLClientIEPTabComponent';
    private iepGlobalStream: PLMessageStream;
    private checkChangesTimeout: any;

    constructor(
        public util: PLUtilService,
        public service: PLClientIEPGoalsService,
        private messageBus: PLEventMessageBus,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this._state = this.util.initComponent({
            name: this.classname,
            initObservables: [this.util.getCurrentClientInitObservable2()],
            fn: (state, done) => {
                this.service.loadIEPs(state, (res: any) => {
                    state.model.data.ieps = res.clientIeps;
                    const hashFragment = state.model.data.hashFragment = this.util.getHashFragment();
                    if (hashFragment) {
                        this._setIepFromHashFragment(hashFragment);
                    }
                    const convertFutureIep = this._shouldConvertFutureIep(state);
                    if (convertFutureIep) {
                        this._checkAndConvertFutureIep(state, () => {
                            done();
                        });
                    } else {
                        done();
                    }
                    const fn = () => {
                        this.checkChangesTimeout = setTimeout(() => {
                            this.cdr.markForCheck();
                            fn();
                        }, 150);
                    };
                    fn();
                });
                this._registerStreams(state);
            },
        });
    }

    ngOnDestroy(): void {
        if (this.iepGlobalStream) {
            this.iepGlobalStream.send({ context: 'reset' });
        }
        this.util.destroyComponent(this._state);
        if (this.checkChangesTimeout) {
            clearTimeout(this.checkChangesTimeout);
        }
    }

    // --------------------------
    // public methods
    // --------------------------
    onClickAddIep(state: PLComponentStateInterface) {
        if (this.canAddIep()) {
            this.util.startFlow(PLIEPFlow.ADD_IEP, state);
            this.iepGlobalStream.send({ context: PLIEPContext.ADD_IEP, data: { start: 1 } });
        }
    }

    displayEmptyIep() {
        const hasActiveIep = this.service.getActiveIep(this._state);
        const hasFutureIep = this.service.getFutureIep(this._state);
        return !this.util.inFlow(PLIEPFlow.ADD_IEP, this._state) && !hasActiveIep && !hasFutureIep;
    }

    displayIepPage() {
        return !this.util.inFlow(PLIEPFlow.END_IEP, this._state);
    }

    displayGoalStatusPage() {
        const tokens = this.util.getHashFragmentTokens();
        return 'goal-status' === (tokens && tokens.length && tokens[tokens.length - 1]);
    }

    displayExitStatusPage() {
        const tokens = this.util.getHashFragmentTokens();
        return 'exit-status' === (tokens && tokens.length && tokens[tokens.length - 1]);
    }

    canAddIep() {
        return this.service.canAddIep(this._state) && !this._state.editIep;
    }

    displayActiveIep() {
        return this.service.getActiveIep(this._state);
    }

    displayFutureIep() {
        return this.service.getFutureIep(this._state);
    }

    displayCompletedIep() {
        return this.service.getMostRecentCompletedIep(this._state);
    }

    isEditMode(iep: any) {
        const editIep = this._state.model.editIep;
        return editIep && iep.id === editIep.id;
    }

    isReadOnly() {
        return !this._state.currentUser.xProvider;
    }

    hasNoIEPs() {
        return this._state.model.data.ieps.length === 0;
    }

    // --------------------------
    // private methods
    // --------------------------
    private _registerStreams(state: PLComponentStateInterface) {
        this.iepGlobalStream = this.messageBus.initStream(PLEventStream.IEP_GLOBAL_STREAM, state);
        this.iepGlobalStream.onReceive(PLIEPContext.ADD_IEP_SAVED, () => {
            this._reloadIeps(state, (res: any) => {
                this.util.endFlow(PLIEPFlow.ADD_IEP, state);
            });
        });
        this.iepGlobalStream.onReceive(PLIEPContext.ADD_IEP_CANCELED, () => {
            this.util.endFlow(PLIEPFlow.ADD_IEP, state);
        });
        this.iepGlobalStream.onReceive(PLIEPContext.EDIT_IEP, (message: PLEventMessage) => {
            // START ---
            if (message.data.start) {
                this.util.startFlow(PLIEPFlow.EDIT_IEP, state);
            }
            // END ---
            if (message.data.end) {
                this._reloadIeps(state, (res: any) => {
                    this.util.endFlow(PLIEPFlow.EDIT_IEP, state);
                });
            }
        });
        this.iepGlobalStream.onReceive(PLIEPContext.RELOAD_IEPS, () => {
            this._checkAndConvertFutureIep(state);
        });
        this.iepGlobalStream.onReceive(PLIEPContext.GET_IEPS_THEN_FN, (message: PLEventMessage) => {
            !message.fn && this.util.debugLog(`programming error. expected message.fn`, message, null);
            this.service.loadIEPs(state, message.fn);
        });
        this.iepGlobalStream.onReceive(PLIEPContext.ENTER_IEP_GOAL_STATUS, (message: PLEventMessage) => {
            const hashFragment = message.data.hashFragment;
            this._setIepFromHashFragment(hashFragment);
        });
        this.iepGlobalStream.onReceive(PLIEPContext.ENTER_IEP_EXIT_STATUS, (message: PLEventMessage) => {
            const hashFragment = message.data.hashFragment;
            this._setIepFromHashFragment(hashFragment);
        });
        this.iepGlobalStream.onReceive(PLIEPContext.END_IEP_CANCELED, () => {
            this.util.removeHashFragment();
            this.util.endFlow(PLIEPFlow.END_IEP, this._state);
        });
        this.iepGlobalStream.onReceive(PLIEPContext.END_IEP_DONE, (message: PLEventMessage) => {
            this._endIep(message.data.iep, state);
        });
        this.iepGlobalStream.onReceive(PLIEPContext.DELETE_IEP, (message: PLEventMessage) => {
            this._reloadIeps(state);
        });
    }

    private _shouldConvertFutureIep(state: PLComponentStateInterface) {
        const futureIep = this.service.getFutureIep(state);
        const activeIep = this.service.getActiveIep(state);
        return futureIep && !activeIep && !this.service.isIepStartDateFuture(futureIep);
    }

    private _checkAndConvertFutureIep(state: PLComponentStateInterface, fn?: Function) {
        const isInitialized = !!state.initialized;
        isInitialized && (state.initialized = false);
        this._reloadIeps(state, () => {
            if (this._shouldConvertFutureIep(state)) {
                const futureIep = this.service.getFutureIep(state);
                this.service.updateIepStatus(futureIep, PLClientIEPGoalsService.IEP_STATUS_ACTIVE, state, () => {
                    futureIep.status = PLClientIEPGoalsService.IEP_STATUS_ACTIVE;
                    this.util.debugLog('converted future iep to active', '', state);
                    this._reloadIeps(state, () => {
                        fn && fn();
                        isInitialized && (state.initialized = true);
                    });
                });
            } else {
                fn && fn();
                isInitialized && (state.initialized = true);
            }
        });
    }

    private _reloadIeps(state: PLComponentStateInterface, fn?: Function) {
        this.service.loadIEPs(state, (res: any) => {
            state.model.data.ieps = res.clientIeps;
            this.iepGlobalStream.send({ context: PLIEPContext.IEPS_RELOADED, data: { ieps: res.clientIeps } });
            fn && fn(res);
        });
    }

    // End IEP
    private _endIep(iep: any, state: PLComponentStateInterface) {
        // check BE iep state to ensure local state is not stale.
        const activeIep = this.service.getActiveIep(state);
        this.service.getIEPs$({
            clientId: this._state.client.uuid
        }, state).subscribe(res => {
            const iep = res.clientIeps.find((item: any) => item.id === activeIep.id);
            const otherNonEmptySA = this.service.getAllOtherOpenServiceAreas(iep, this._state.currentUser);
            this.util.debugLog(`checking iep/sa state before ending iep. Other non-empty open SA (${otherNonEmptySA})`, res, state)
            // cannot end iep
            if (otherNonEmptySA && otherNonEmptySA.length) {
                this.service.loadIEPs(state, () => {
                    this.util.removeHashFragment();
                    this.util.endFlow(PLIEPFlow.END_IEP, state);
                });
                this.util.debugLog('iep not ended. other non-empty open SA exist', otherNonEmptySA, state);
            }
            // end iep
            else {
                this.util.debugLog('ending iep...', iep, state);
                this.service.endIep(iep.id, state, (res: any) => {
                    this._checkAndConvertFutureIep(state, () => {
                        this.util.removeHashFragment();
                        this.util.endFlow(PLIEPFlow.END_IEP, state);
                    });
                });
            }
        });
    }

    // format: /iep/<iepId>/goal-status OR /iep/<iepId>/exit-status
    private _setIepFromHashFragment(hashFragment: string) {
        const tokens = this.util.getHashFragmentTokens(hashFragment);
        if (tokens && tokens.length > 2) {
            const iepId = tokens[2]; // <iepId>
            this._state.model.endIep = this._state.model.data.ieps.find((iep: any) => iep.id === iepId);
            hashFragment && this.util.setHashFragment(hashFragment);
            if (!this.util.inFlow(PLIEPFlow.END_IEP, this._state)) {
                this.util.startFlow(PLIEPFlow.END_IEP, this._state);
            }
        } else {
            if (this.util.inFlow(PLIEPFlow.END_IEP, this._state)) {
                this.util.endFlow(PLIEPFlow.END_IEP, this._state);
            }
        }
    }
}
