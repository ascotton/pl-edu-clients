import { Injectable, OnInit } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { PLGraphQLService } from '@root/index';

@Injectable()
export class PLClientMergeService implements OnInit {
    selectedClient1: any = null;
    selectedClient2: any = null;
    mergeComplete = false;
    resultClient: any = null;

    // model for input-checkbox in the table; to remember selections if you navigate through table pages
    selectedClients: any = {};
    clientsSelected = 0;
    currentStep = 0;

    locationChangeRequired = false;
    referralChangeRequired = false;

    primary: string = null;

    updateValues: any = {};
    updateValuesFormatted: any = {};

    private navigateRequested = new Subject<number>();
    private navigateConfirmed = new Subject<number>();

    navigateRequested$ = this.navigateRequested.asObservable();
    navigateConfirmed$ = this.navigateConfirmed.asObservable();

    lastSelectQuery: any;

    constructor(private plGraphQL: PLGraphQLService) {
    }

    requestNavigate(stepIndex: number) {
        this.navigateRequested.next(stepIndex);
    }
    confirmNavigate(stepIndex: number) {
        this.navigateConfirmed.next(stepIndex);
    }

    ngOnInit() {
    }

    resetData() {
        this.selectedClient1 = null;
        this.selectedClient2 = null;
        this.mergeComplete = false;
        this.resultClient = null;

        this.selectedClients = {};
        this.clientsSelected = 0;

        this.locationChangeRequired = false;
        this.referralChangeRequired = false;

        this.primary = null;

        this.updateValues = {};
        this.updateValuesFormatted = {};

        this.currentStep = 0;
    }

    // remember selected clients (max 2); forget selected client if clicked again or 'X' is clicked
    toggleClientSelection(client: any) {
        if (this.selectedClient1 && client.id === this.selectedClient1.id) {
            this.selectedClients[client.id] = false; // uncheck select box if the 'X' was clicked
            this.selectedClient1 = null;
        } else if (this.selectedClient2 && client.id === this.selectedClient2.id) {
            this.selectedClients[client.id] = false;
            this.selectedClient2 = null;
        } else {
            if (this.selectedClient1 === null) {
                this.selectedClient1 = client;
            } else if (this.selectedClient2 === null) {
                this.selectedClient2 = client;
            }
        }
        this.clientsSelected = (this.selectedClient1 && this.selectedClient2) ?
            2 : (this.selectedClient1 || this.selectedClient2) ? 1 : 0;
    }

    performMerge() {
        return new Observable((observer: any) => {
            this.mergeClients().subscribe((result:any) => {
                this.updateClientData().subscribe(
                    (res: any) => {
                        this.resultClient = res.updateClient.client;
                        observer.next(res);
                    },
                    (err: any) => {
                        console.log('performMerge error: ', err);
                        observer.next(err);
                    },
                );
            });
        });
    }

    mergeClients() {
        return new Observable((observer: any) => {
            const variables = {
                fromClientId: this.primary === this.selectedClient1.id ?
                    this.selectedClient2.id : this.selectedClient1.id,
                toClientId: this.primary,
            };
            this.plGraphQL.mutate(
                `mutation mc($fromClientId: ID!, $toClientId: ID!) {
                    mergeClient(input: {clientMerge: {fromClientId: $fromClientId, toClientId: $toClientId}}) {
                        status
                        errors {
                            code
                            message
                            field
                        }
                    }
                }`,
                variables, { }).subscribe(
                    (result: any) => {
                        observer.next(result);
                    },
                    (err: any) => {
                        console.error('mergeClient error: ', err);
                        observer.error({ err });
                    }
                );
        });
    }

    updateClientData() {
        return new Observable((observer: any) => {
            this.updateValues.id = this.primary;
            const variables: any = {
                client: this.updateValues,
            };
            this.plGraphQL.mutate(
                `mutation clientMergeUpdateClient($client: UpdateClientInputData) {
                    updateClient(input: {client: $client}) {
                        errors {
                            code
                            field
                            message
                        }
                        status
                        client {
                            id
                            firstName
                            lastName
                            externalId
                        }
                    }
                }`,
                variables,
                {}).subscribe(
                    (res: any) => {
                        observer.next(res);
                    },
                    (err: any) => {
                        console.log('merge client update client data error: ', err);
                        observer.next(err);
                    },
                );
        });
    }
}
