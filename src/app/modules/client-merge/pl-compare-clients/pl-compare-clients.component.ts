import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { PLCompareClientsService } from './pl-compare-clients.service';
import { PLClientMergeService } from '../pl-client-merge.service';
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { first } from 'rxjs/operators';

import { PLToastService } from '@root/index';
import { PLClientIEPGoalsService } from '@modules/clients/pl-client-iep-goals/pl-client-iep-goals.service';
import { PLComponentStateInterface, PLUtilService, PLComponentInitObservable } from '@common/services';

export enum ClientMergeValidationError {
    location = 'location',
    referral = 'referral',
}

@Component({
    selector: 'pl-compare-clients',
    templateUrl: './pl-compare-clients.component.html',
    styleUrls: ['./pl-compare-clients.component.less'],
})

export class PLCompareClientsComponent implements OnInit, OnDestroy {
    public _state: PLComponentStateInterface;
    private classname = 'PLCompareClientsComponent';

    leftClient: any = {};
    rightClient: any = {};
    primary: string = '';

    defaultFields = ['name', 'birthday', 'externalId'];
    selections: any = {};
    allSelectionFields: string[] = [];

    compareForm: FormGroup = new FormGroup({});

    diffFields: any[] = [];
    loaded = false;

    displayError = false;
    errorMessage = 'Unable to merge these clients';
    error = ClientMergeValidationError;
    errorType = '';

    navSubscription: any;

    constructor(
        private util: PLUtilService,
        private iepService: PLClientIEPGoalsService,
        private model: PLCompareClientsService,
        private clientMergeService: PLClientMergeService,
        private plToast: PLToastService,
        private store: Store<AppStore>,
    ) { }

    addSelectionField(field: string) {
        this.allSelectionFields.push(field);
        this.selections[field] = '';
    }

    ngOnInit() {
        const clientId1 = this.clientMergeService.selectedClient1.id;
        const clientId2 = this.clientMergeService.selectedClient2.id;
        const initObsArray = this._getClientIepInitObservables(clientId1, clientId2);
        this._state = this.util.initComponent({
            name: this.classname,
            initObservables: initObsArray,
            fn: (state, done) => {
                this.defaultFields.forEach(field => this.addSelectionField(field));
                this.clientMergeService.navigateRequested$.pipe(first()).subscribe(
                    (stepIndex: number) => {
                        if (this.displayError) {
                            this.plToast.show('error', 'Please resolve validation error to continue');
                        } else {
                            this.clientMergeService.confirmNavigate(stepIndex);
                        }
                    },
                );
                state.clientIds = [clientId1, clientId2];
                const clientIepState = this._getClientIepState(state);
                this._handleClientIepState(clientIepState, state);
                if (this.shouldBlockMerge()) {
                    done();
                } else {
                    this.loadClients(() => {
                        done();
                    })
                }
            }
        });
    }

    ngOnDestroy() {
        // prevent memory leak when component destroyed
        this.util.destroyComponent(this._state);
    }

    loadClients(fn?: Function) {
        if (this.clientMergeService.selectedClient1 && this.clientMergeService.selectedClient2) {
            const id1 = this.clientMergeService.selectedClient1.id;
            const id2 = this.clientMergeService.selectedClient2.id;
            this.loaded = false;
            this.displayError = false;
            this.model.loadClients(id1, id2).subscribe((results: any) => {
                this.leftClient = results.leftClient;
                this.rightClient = results.rightClient;
                this.primary = results.primary;
                this.primarySelected();
                this.diffFields = results.diffFields;
                results.diffFields.forEach((field:string) => this.addSelectionField(field));
                this.loaded = true;
                this.validateClientMerge();
                fn && fn();
            });
        }
    }

    reloadClients() {
        this.store.dispatch({ type: 'REMOTE_UPDATE_CLIENTS_LIST' });
        this.loadClients();
    }

    validateClientMerge() {
        this.errorType = null;
        if (this.leftClient && this.rightClient) {
            let from: any;
            let to: any;
            if (this.primary === this.leftClient.id) {
                from = this.rightClient.id;
                to = this.leftClient.id;
            } else {
                to = this.rightClient.id;
                from = this.leftClient.id;
            }
            this.model.validateClientMerge(from, to).subscribe(
                (result: any) => {
                    this.displayError = false;
                },
                (error: any) => {
                    this.displayError = true;
                    this.clientMergeService.locationChangeRequired = false;
                    this.clientMergeService.referralChangeRequired = false;
                    if (error.errorCode === 'clients-different-location') {
                        this.errorType = ClientMergeValidationError.location;
                        this.errorMessage = `Locations must be the same to merge clients. Please select which client
                                             needs a location transfer by selecting change below.`;
                        this.clientMergeService.locationChangeRequired = true;
                    } else if (error.errorCode === 'duplicate-referrals') {
                        this.errorType = ClientMergeValidationError.referral;
                        this.errorMessage = `There are duplicate referrals. Please select which referral you would like
                                             to edit and remove below.`;
                        this.clientMergeService.referralChangeRequired = true;
                    } else if (error.errorCode === 'no-chain-client-merge') {
                        this.errorMessage = `You are attempting a chain merge please select the other primary to
                                             continue.`;
                    } else {
                        this.errorMessage = error.errorMessage;
                    }
                });
        }
    }

    primarySelected() {
        this.clientMergeService.primary = this.primary;
        this.selectAll(this.primary);
        this.validateClientMerge();
    }

    selectAll(id: string) {
        setTimeout(() => {
            this.allSelectionFields.forEach((field: string) => {
                this.selections[field] = id;
            });
            this.updateMergeValues();
        });
    }

    updateMergeValues() {
        this.clientMergeService.updateValues =
            this.model.getMergeValues(this.primary, this.allSelectionFields, this.selections, this.leftClient,
                                      this.rightClient);

        this.clientMergeService.updateValuesFormatted =
            this.model.getFormattedMergeValues(this.primary, this.allSelectionFields,  this.selections, this.leftClient,
                                               this.rightClient);
    }

    hasActiveIep(client: number) {
        return this._state.clientIepState[client][PLClientIEPGoalsService.IEP_STATUS_ACTIVE];
    }

    hasFutureIep(client: number) {
        return this._state.clientIepState[client][PLClientIEPGoalsService.IEP_STATUS_FUTURE];
    }

    bothClientsHaveActiveIep() {
        return this._state.blockMerge[BlockMergeCodes.BOTH_CLIENTS_ACTIVE_IEP];
    }

    bothClientsHaveFutureIep() {
        return this._state.blockMerge[BlockMergeCodes.BOTH_CLIENTS_FUTURE_IEP];
    }

    shouldBlockMerge() {
        return this.bothClientsHaveActiveIep() || this.bothClientsHaveFutureIep();
    }

    // --------------------------
    // private methods
    // --------------------------
    private _getClientIepInitObservables(clientId1: string, clientId2: string): Array<PLComponentInitObservable> {
        const initObsArray: Array<PLComponentInitObservable> = [];
        const clientIds = [clientId1, clientId2];
        clientIds.forEach((item: any) => {
            const id = item;
            initObsArray.push({
                name: `IEP client ${id}`,
                observable: this.iepService.getIEPs$({
                    clientId: id,
                }, null),
                isDataReady: (data: any, state: PLComponentStateInterface) => data,
                handler: (data: any, state: PLComponentStateInterface) => {
                    state.clientIeps = state.clientIeps || [];
                    state.clientIeps.push(data.clientIeps);
                }
            });
        });
        return initObsArray;
    }

    // returns a map clientIds, each having a map of available IEP status
    private _getClientIepState(state: PLComponentStateInterface) {
        state.clientIepState = state.clientIeps.map((item: any) => {
            const statusMap = {};
            item.forEach((iep: any) => {
                statusMap[iep.status] = 1;
            });
            return statusMap;
        });
        this.util.debugLog('client iep state', state.clientIepState, state);
        return state.clientIepState;
    }

    private _handleClientIepState(clientIepState: any, state: PLComponentStateInterface) {
        this._state.blockMerge = this._state.blockMerge || {};
        if (this.hasActiveIep(MergeClient.CLIENT_1) && this.hasActiveIep(MergeClient.CLIENT_2)) {
            this._state.blockMerge[BlockMergeCodes.BOTH_CLIENTS_ACTIVE_IEP] = 1;
        }
        if (this.hasFutureIep(MergeClient.CLIENT_1) && this.hasFutureIep(MergeClient.CLIENT_2)) {
            this._state.blockMerge[BlockMergeCodes.BOTH_CLIENTS_FUTURE_IEP] = 1;
        }
    }
}

enum MergeClient {
    CLIENT_1 = 0,
    CLIENT_2 = 1,
}

enum BlockMergeCodes {
    BOTH_CLIENTS_ACTIVE_IEP = 'both_clients_have_active_iep',
    BOTH_CLIENTS_FUTURE_IEP = 'both_clients_have_future_iep',
}
