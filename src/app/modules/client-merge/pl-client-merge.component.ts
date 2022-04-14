import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';

import { PLClientMergeService } from './pl-client-merge.service';
import { CanComponentDeactivate } from '@common/can-deactivate-guard.service';
import { PLConfirmDialogService, PLTableFrameworkUrlService, PLModalService } from '@root/index';

import { PLMergeTipsComponent } from './pl-merge-tips/pl-merge-tips.component';
import { PLUtilService, PLComponentStateInterface } from '@common/services';
import { PLClientIEPGoalsService } from '../clients/pl-client-iep-goals/pl-client-iep-goals.service';

@Component({
    selector: 'pl-client-merge',
    templateUrl: './pl-client-merge.component.html',
    styleUrls: ['./pl-client-merge.component.less'],
})
export class PLClientMergeComponent implements OnInit, OnDestroy, CanComponentDeactivate {
    public _state: PLComponentStateInterface;
    private classname = 'PLCompareClientsComponent';
    steps: any[] = [];
    readonly hrefBase = `/client-merge/`;
    navSubscription: any;
    merging = false;
    paramsSub: any;

    constructor(
        public util: PLUtilService,
        private iepService: PLClientIEPGoalsService,
        private router: Router,
        public clientMergeService: PLClientMergeService,
        private plConfirm: PLConfirmDialogService,
        private plModal: PLModalService,
        private plTableFrameworkUrl: PLTableFrameworkUrlService
    ) { }

    ngOnInit() {
        this._state = this.util.initComponent({
            name: this.classname,
            fn: (state, done) => {
                this.setSteps();
                this.navSubscription = this.clientMergeService.navigateConfirmed$
                .subscribe(
                    (stepIndex: number) => {
                        this.clientMergeService.currentStep = stepIndex;
                        this.router.navigate([this.steps[stepIndex].href],
                            { queryParams: this.steps[stepIndex].hrefQueryParams },
                        );
                    });

                this.selectedClientsCheck();
                this.updateCurrentStep();
                done();
            }
        });
    }
    ngOnDestroy() {
        // prevent memory leak when component destroyed
        this.navSubscription.unsubscribe();
        this.util.destroyComponent(this._state);
    }

    private selectedClientsCheck() { // don't allow going to URL of a later step if 2 clients are not selected
        if ((this.clientMergeService.selectedClient1 === null || this.clientMergeService.selectedClient2 === null) &&
            !this.router.routerState.snapshot.url.includes('select-clients')) {
            this.router.navigate([this.steps[0].href],
                                 { queryParams: this.steps[0].hrefQueryParams },
            );
        }
    }

    private updateCurrentStep() {
        if (this.router.routerState.snapshot.url.includes('select-clients')) {
            this.clientMergeService.currentStep = 0;
        } else if (this.router.routerState.snapshot.url.includes('compare-clients')) {
            this.clientMergeService.currentStep = 1;
        } else if (this.router.routerState.snapshot.url.includes('confirm')) {
            this.clientMergeService.currentStep = 2;
        }
    }

    showTips() {
        let modalRef: any;
        this.plModal.create(PLMergeTipsComponent)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }

    setSteps() { // URLs for pl-steps component
        const hrefParams = {};
        this.steps = [
            {
                key: 'select-clients', label: 'Search', href: `${this.hrefBase}select-clients`,
                hrefQueryParams: hrefParams,
            },
            {
                key: 'compare-clients', label: 'Compare', href: `${this.hrefBase}compare-clients`,
                hrefQueryParams: hrefParams,
            },
            {
                key: 'confirm', label: 'Confirm', href: `${this.hrefBase}confirm`,
                hrefQueryParams: hrefParams,
            },
        ];
    }

    // prevent user from accidentally clicking away if they haven't completed the merge
    canDeactivate(currentRoute: ActivatedRouteSnapshot,
                  currentState: RouterStateSnapshot,
                  nextState: RouterStateSnapshot) {
        if (this.clientMergeService.mergeComplete) {
            this.clientMergeService.resetData();
            return true;
        }
        if (this.shouldBlockMerge()) {
            this.clientMergeService.resetData();
            return true;
        }

        let header = '';
        let content = '';
        let primaryLabel = '';
        let secondaryLabel = '';
        let resetData = false;
        if (this.clientMergeService.locationChangeRequired && nextState.url.includes('change-location')) {
            header = 'Location Change';
            content = `
                <div style="padding-bottom:12px;">To change this client’s location we’ll need to take you to a
                different page.</div>
                <div>Don’t worry, we’ll bring you back when we’re done.</div>`,
            primaryLabel = 'OK';
            secondaryLabel = 'Cancel';
        } else if (this.clientMergeService.referralChangeRequired && nextState.url.includes('services')) {
            header = 'Edit Referrals';
            content = `
                <div style="padding-bottom:12px;">You will be sent to the Services view for this client.</div>
                <div>When you finish making modifications you will be returned to Client Merge.</div>`,
            primaryLabel = 'OK';
            secondaryLabel = 'Cancel';
        } else {
            header = 'Cancel Client Merge';
            resetData = true;
            content = `<div style="padding-bottom:12px;">Are you sure you want to close this window?</div>
                        <div>Clients will not be merged.</div>`,
            primaryLabel = 'Yes';
            secondaryLabel = 'No';
        }
        return new Observable<boolean>((observer: any) => {
            this.plConfirm.show({
                header, content, primaryLabel, secondaryLabel,
                primaryCallback: () => {
                    if (resetData) {
                        this.clientMergeService.resetData();
                    }
                    observer.next(true);
                },
                secondaryCallback: () => {
                    observer.next(false);
                },
                closeCallback: () => {
                    observer.next(false);
                },
            });
        });
    }

    goHome = () => {
        if (this.shouldBlockMerge()) {
            this.router.navigate(['/clients']);
        } else {
            this.router.navigate(['/']);
        }
    }

    stepsCancel() {
        this.goHome();
    }

    stepsPrev(event: any) {
        this.router.navigate([this.steps[event.prevIndex].href],
                             { queryParams: this.steps[event.prevIndex].hrefQueryParams });
        this.clientMergeService.currentStep = event.prevIndex;
    }

    stepsFinish(event: any) {
        this.merging = true;
        this.clientMergeService.performMerge().subscribe((result:any) => {
            setTimeout(() => {
                this.merging = false;
                this.router.navigate([`${this.hrefBase}complete`]);
            });
        });
    }

    stepsNext(event:any) {
        const clientId1 = this.clientMergeService.selectedClient1.id;
        const clientId2 = this.clientMergeService.selectedClient2.id;
        if (clientId1 && clientId2) {
            this.checkClientIeps(clientId1, clientId2, () => {
                if (this.shouldBlockMerge()) {
                    this.util.debugLog(`blocking merge`, '', this._state);
                } else {
                    this.clientMergeService.requestNavigate(event.nextIndex);
                }
            });
        } else {
            this.clientMergeService.requestNavigate(event.nextIndex);
        }
    }

    checkClientIeps(clientId1: string, clientId2: string, fn: Function) {
        const clientIepObservables = this.getClientIeps(clientId1, clientId2);
        forkJoin(clientIepObservables).pipe(first()).subscribe((res: any) => {
            const ieps1 = res[0];
            const ieps2 = res[1];
            this._state.clientIeps = this._state.clientIeps || [];
            this._state.clientIeps.push(ieps1.clientIeps);
            this._state.clientIeps.push(ieps2.clientIeps);

            this._handleClientIepState(this._state);
            fn();
        });
    }

    getClientIeps(clientId1: string, clientId2: string): Array<any> {
        const clientIds = [clientId1, clientId2];
        const observables: Array<any> = [];
        clientIds.forEach((item: any) => {
            const id = item;
            observables.push(
                this.iepService.getIEPs$({
                    clientId: id,
                }, null)
            );
        });
        return observables;
    }


    hasActiveIep(client: number) {
        return this._state.clientIepState[client][PLClientIEPGoalsService.IEP_STATUS_ACTIVE];
    }

    hasFutureIep(client: number) {
        return this._state.clientIepState[client][PLClientIEPGoalsService.IEP_STATUS_FUTURE];
    }

    //------------------------------
    // Check for unmergeable state
    //------------------------------
    bothClientsHaveActiveIep() {
        return this._state.blockMerge && this._state.blockMerge[BlockMergeCodes.BOTH_CLIENTS_ACTIVE_IEP];
    }

    bothClientsHaveFutureIep() {
        return this._state.blockMerge &&  this._state.blockMerge[BlockMergeCodes.BOTH_CLIENTS_FUTURE_IEP];
    }

    // one client's future IEP start < the other client's active IEP start
    futureIepBeforeActiveIep() {
        return this._state.blockMerge && this._state.blockMerge[BlockMergeCodes.FUTURE_IEP_BEFORE_OTHER_CLIENT_ACTIVE_IEP];
    }

    shouldBlockMerge() {
        const clientId1 = this.clientMergeService.selectedClient1 && this.clientMergeService.selectedClient1.id;
        const clientId2 = this.clientMergeService.selectedClient2 && this.clientMergeService.selectedClient2.id;
        return (clientId1 && clientId2) && (
            this.bothClientsHaveActiveIep()
            || this.bothClientsHaveFutureIep()
            || this.futureIepBeforeActiveIep());
    }

    // --------------------------
    // private methods
    // --------------------------
    private _handleClientIepState(state: PLComponentStateInterface) {
        state.clientIepState = state.clientIeps.map((item: any) => {
            const statusMap = {};
            item.forEach((iep: any) => {
                statusMap[iep.status] = iep;
            });
            return statusMap;
        });

        this._state.blockMerge = this._state.blockMerge || {};
        // check if both clients have an ACTIVE IEP
        if (this.hasActiveIep(MergeClient.CLIENT_1) && this.hasActiveIep(MergeClient.CLIENT_2)) {
            this._state.blockMerge[BlockMergeCodes.BOTH_CLIENTS_ACTIVE_IEP] = 1;
        }
        // check if both clients have a FUTURE IEP
        if (this.hasFutureIep(MergeClient.CLIENT_1) && this.hasFutureIep(MergeClient.CLIENT_2)) {
            this._state.blockMerge[BlockMergeCodes.BOTH_CLIENTS_FUTURE_IEP] = 1;
        }
        // check if one client has a future iep start date < other client's active start date
        const activeC1 = this.hasActiveIep(MergeClient.CLIENT_1);
        const activeC2 = this.hasActiveIep(MergeClient.CLIENT_2);
        const futureC1 = this.hasFutureIep(MergeClient.CLIENT_1);
        const futureC2 = this.hasFutureIep(MergeClient.CLIENT_2);

        if (futureC1 && activeC2 && futureC1.startDate < activeC2.startDate) {
            this._state.blockMerge[BlockMergeCodes.FUTURE_IEP_BEFORE_OTHER_CLIENT_ACTIVE_IEP] = 1;
        }

        if (futureC2 && activeC1 && futureC2.startDate < activeC1.startDate) {
            this._state.blockMerge[BlockMergeCodes.FUTURE_IEP_BEFORE_OTHER_CLIENT_ACTIVE_IEP] = 1;
        }

        this.util.debugLog('client iep state', state.clientIepState, state);
    }
}

enum MergeClient {
    CLIENT_1 = 0,
    CLIENT_2 = 1,
}

enum BlockMergeCodes {
    BOTH_CLIENTS_ACTIVE_IEP = 'both_clients_have_active_iep',
    BOTH_CLIENTS_FUTURE_IEP = 'both_clients_have_future_iep',
    FUTURE_IEP_BEFORE_OTHER_CLIENT_ACTIVE_IEP = 'future_iep_before_active_iep',
}
