import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppStore } from '@app/appstore.model';
import { PLStatusHelpComponent } from '@common/components/';
import {
    PLComponentStateInterface,
    PLEventMessage,
    PLEventMessageBus,
    PLEventStream,
    PLMessageStream,
    PLStatusDisplayService,
    PLUtilService
} from '@common/services/';
import { CurrentUserService } from '@modules/user/current-user.service';
import { User } from '@modules/user/user.model';
import { Store } from '@ngrx/store';
import {
    PLApiClientsService,
    PLConfirmDialogService,
    PLGQLQueriesService,
    PLGraphQLService,
    PLHttpService,
    PLLinkService,
    PLModalService,
    PLToastService,
    PLUrlsService
} from '@root/index';
import { filter } from 'rxjs/operators';
import { PLClientIEPGoalsService, PLIEPContext } from '../pl-client-iep-goals/pl-client-iep-goals.service';
import { PLClientService } from '../pl-client.service';
import { PLClientDeleteComponent } from './pl-client-delete/pl-client-delete.component';

@Component({
    selector: 'pl-client-profile-header',
    templateUrl: './pl-client-profile-header.component.html',
    styleUrls: ['./pl-client-profile-header.component.less'],
    inputs: ['client'],
})
export class PLClientProfileHeaderComponent implements OnInit, OnDestroy {
    _state: PLComponentStateInterface;
    private classname = 'PLClientProfileHeaderComponent';
    private iepGlobalStream: PLMessageStream;

    client: any = {};
    userProviderID: string;

    currentUser: User;

    mayRemoveFromCaseload: boolean = false;
    mayAddToCaseload: boolean = false;
    mayEditClient: boolean = false;
    private clientByUserSet: boolean = false;
    private removingClient: boolean = false;
    private addingClient: boolean = false;
    private selectOptsClientStatus: any[] = [];
    backLink: string = '';
    private subscriptions: any = {};

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private plHttp: PLHttpService,
        private store: Store<AppStore>,
        private plToast: PLToastService,
        private plUrls: PLUrlsService,
        private plApiClients: PLApiClientsService,
        private plCurrentUser: CurrentUserService,
        private plClient: PLClientService,
        private plLink: PLLinkService,
        private plGraphQL: PLGraphQLService,
        private plGQLQueries: PLGQLQueriesService,
        private plModal: PLModalService,
        private plStatusDisplayService: PLStatusDisplayService,
        private util: PLUtilService,
        private iepService: PLClientIEPGoalsService,
        private messageBus: PLEventMessageBus,
        private plConfirm: PLConfirmDialogService,
    ) {
    }

    ngOnInit() {
            this._state = this.util.initComponent({
                name: this.classname,
                initObservables: [this.util.getCurrentClientInitObservable2()],
                fn: (state, done) => {
                    this.iepService.getIEPs$({
                        clientId: state.client.uuid,
                    }, state).subscribe(res => {
                        state.model.data.ieps = res.clientIeps;
                        this._updateProfileDueDates(state);
                        this._registerStreams(state);
                        done();
                    });
                },
            });

        this.subscriptions.client = this.store.select('currentClientUser').pipe(
                filter((clientUser: any) => clientUser && clientUser.client),
            ).subscribe((clientUser: any) => {
                if (clientUser.client.name) {
                    this.client = clientUser.client;
                    this.client.statusDisplay =
                        this.plStatusDisplayService.getLabelForStatus('Client_' + this.client.status);
                }
                this.mayRemoveFromCaseload = clientUser.mayRemoveFromCaseload;
                this.mayAddToCaseload = clientUser.mayAddToCaseload;
                this.mayEditClient = clientUser.mayEditClient;
                this.clientByUserSet = true;
                this.selectOptsClientStatus = this.plApiClients.formStatusSelectOptsGQL();
            });
        this.subscriptions.back = this.store.select('backLink')
            .subscribe((previousState: any) => {
                this.backLink = previousState.title;
            });
        this.subscriptions.user = this.store.select('currentUser')
            .subscribe((user: any) => {
                this.currentUser = user;
                if (user && user.uuid) {
                    let provider = this.userProviderID = this.plCurrentUser.getProvider(user);
                    if (provider) {
                        this.userProviderID = provider.user;
                    }
                }
            });
    }

    ngOnDestroy() {
        if (this.iepGlobalStream) {
            this.iepGlobalStream.send({ context: 'reset' });
        }
        this.subscriptions.client.unsubscribe();
        this.subscriptions.user.unsubscribe();
        this.subscriptions.back.unsubscribe();
    }

    removeFromCaseload() {
        this.plConfirm.show({
            header: 'Confirm Remove',
            content: `<span style="padding-bottom:12px;">Are you sure you want to remove this student from your caseload?</span>`,
            primaryLabel: 'Confirm',
            secondaryLabel: 'Cancel',
            primaryCallback: () => {
                this.removingClient = true;
                const url = `${this.plUrls.urls.clients}${this.client.id}/providers/`;
                this.plHttp
                    .delete('', { uuid: this.client.id }, url)
                    .subscribe((res: any) => {
                        this.removingClient = false;
                        this.plToast.show('success', `${this.client.firstName} ${this.client.lastName} removed from caseload.`, -1, true);
                        // Re check privileges.
                        // this.mayRemoveFromCaseload = false;
                        // this.getClient();
                        this.store.dispatch({ type: 'REMOTE_UPDATE_CLIENTS_LIST' });
                        this.router.navigate(['/client/list/caseload-clients']);
                    }, (err: any) => {
                        this.removingClient = false;
                    });
            },
            secondaryCallback: () => {},
        });
    }

    addToCaseload(): void {
        this.addingClient = true;
        const url = `${this.plUrls.urls.clients}${this.client.id}/providers/`;
        this.plHttp.put('', { uuid: this.client.id, provider: this.userProviderID }, url)
                .subscribe((res: any) => {
                    this.addingClient = false;
                    this.plToast.show('success', `${this.client.firstName} ${this.client.lastName} added to caseload.`, -1, true);
                    this.store.dispatch({ type: 'REMOTE_UPDATE_CLIENTS_LIST'});

                    this.router.navigate(['/client/list/caseload-clients']);
                }, (err: any) => {
                    this.addingClient = false;
                });
    }

    onChangeClientStatus() {
        const variables = {
            client: {
                id: this.client.id,
                status: this.client.status,
            },
        };
        const moreParams = {
            refetchQueries: this.plGQLQueries.queryGroups.referralsAndServices,
        };
        this.plGraphQL.mutate(`mutation clientProfileHeaderUpdateClient($client: UpdateClientInputData) {
            updateClient(input: {client: $client}) {
                errors {
                    code
                    field
                    message
                }
                status
                client {
                    id
                    status
                }
            }
        }`, variables, {}, moreParams).subscribe(() => {
        });
    }

    onClose() {
        this.router.navigate(['/clients']);
        //this.plLink.goBack();
    }

    showDeleteConfirm() {
        let modalRef: any;
        const params: any = {
            client: Object.assign({}, this.client),
            onDelete: () => {
                const variables: any = {
                    deleteClientInput: {
                        id: this.client.id,
                    },
                };
                const moreParams: any = {
                    refetchQueries: this.plGQLQueries.queryGroups.referralsAndServices,
                };
                this.plGraphQL.mutate(`mutation clientProfileDeleteClient($deleteClientInput: DeleteClientInput!) {
                    deleteClient(input: $deleteClientInput) {
                        errors {
                            code
                            field
                            message
                        }
                    }
                }`, variables, {}, moreParams).subscribe((res: any) => {
                    modalRef._component.destroy();
                    this.router.navigate(['/clients']);
                });
            },
            onCancel: () => {
                modalRef._component.destroy();
            },
        };
        this.plModal.create(PLClientDeleteComponent, params)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }

    displayLearnMore() {
        let modalRef: any;
        const statusNames: any[] = ['Client_ONBOARDING', 'Client_IN_SERVICE', 'Client_NOT_IN_SERVICE'];
        const params = {
            statusNames,
            onCancel: () => {
                modalRef._component.destroy();
            },
            modalHeaderText: `Learn more about Student Statuses`,
            introductionText: `Below are the definitions for Student Statuses. These statuses are derived from the
                student’s Direct Services and Evaluations statuses. These are automatically updated and do not require
                any manual change by a Clinician.`,
            definitionHeaderText: `Student Statuses`,
        };
        this.plModal.create(PLStatusHelpComponent, params)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }

    // --------------------------
    // private methods
    // --------------------------

    private _updateProfileDueDates(state: PLComponentStateInterface) {
        const activeIep = this.iepService.getActiveIep(state);
        if (activeIep && this.iepService.isTypeIep(activeIep)) {
            state.model.annualIepDueDate = this.util.getDateNormalized(activeIep.nextAnnualIepDate).dateStringDisplayCompact;
            state.model.triennialEvaluationDueDate = this.util.getDateNormalized(activeIep.nextEvaluationDate).dateStringDisplayCompact;
        } else {
            state.model.annualIepDueDate = '';
            state.model.triennialEvaluationDueDate = '';
        }
    }

    private _registerStreams(state: PLComponentStateInterface) {
        this.iepGlobalStream = this.messageBus.initStream(PLEventStream.IEP_GLOBAL_STREAM, state);
        this.iepGlobalStream.onReceive(PLIEPContext.IEPS_RELOADED, (message: PLEventMessage) => {
            state.model.data.ieps = message.data.ieps;
            this._updateProfileDueDates(state);
        });
        this.iepGlobalStream.onReceive(PLIEPContext.DELETE_IEP, (message: PLEventMessage) => {
            state.model.data.ieps = [];
            this._updateProfileDueDates(state);
        })
    }
};
