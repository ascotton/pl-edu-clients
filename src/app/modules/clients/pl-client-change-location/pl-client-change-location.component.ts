import { Component, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import {
    PLHttpService,
    PLToastService,
    PLApiContactTypesService,
    PLApiLanguagesService,
    PLLinkService,
    PLGraphQLService,
} from '@root/index';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLLocationsService } from '@common/services/';
import { Option } from '@common/interfaces';

@Component({
    selector: 'pl-client-change-location',
    templateUrl: './pl-client-change-location.component.html',
    styleUrls: ['./pl-client-change-location.component.less'],
})
export class PLClientChangeLocationComponent {
    currentUser: User;

    client: any = {};
    location: any = {};
    clientLocation = '';
    clientOrganization = '';
    clientLocationID = '';
    clientLocationState = '';
    clientLoaded = false;

    headerText = 'Change Location';
    statusMessage: string;

    changeReason: string = 'TRANSFER';
    changeReasonOptions: any[] = [
        { value: 'TRANSFER', label: 'Transfer' },
        { value: 'CORRECTION', label: 'Correction' },
    ];

    locationsSubscription: Subscription;
    loadingLocations: boolean = true;
    locationOpts: Option[] = [];
    selectedLocationID: string = null;

    organizationOpts: Option[] = [];
    selectedOrganizationID: string = null;

    suggestedLocationID: string = null;

    editLocation = true;
    reviewLocation = false;

    newClientLocationName = '';
    newClientLocationID = '';
    newClientOrganization = '';
    newClientLocationState = '';

    hasOpenEvaluations = false;
    hasReferrals = false;
    hasUnsignedAppointments = false;

    submitting = false;
    submitted = false;

    firstLocationResult = true;

    private subscriptions: any = {};

    constructor(
        private plHttp: PLHttpService,
        private store: Store<AppStore>,
        private plLink: PLLinkService,
        private plGraphQL: PLGraphQLService,
        private locationsService: PLLocationsService,
        private plToast: PLToastService,
        private route: ActivatedRoute,
    ) {
        this.subscriptions.user = store.select('currentUser')
            .subscribe((user) => {
                this.currentUser = user;
            });
        this.subscriptions.client = store.select('currentClientUser')
            .subscribe((clientUser: any) => {
                this.setClientData(clientUser.client);
                this.clientLoaded = true;
                this.checkForWarnings();
                this.checkForSuggestedLocation();
            });

        if (!this.locationsService.loadingLocations) {
            this.locationsService.beginFetch();
        }

        this.locationsSubscription = this.locationsService.getLocationsData().subscribe((result: any) => {
            if (result.locationOpts.length === 0 && this.firstLocationResult) {
                this.firstLocationResult = false;
                return;
            } else {
                this.firstLocationResult = false;
                this.updateValuesFromLocationService();
            }
        });
    }

    updateValuesFromLocationService() {
        this.loadingLocations = this.locationsService.loadingLocations;
        if (!this.loadingLocations) {
            this.locationOpts = this.locationsService.getLocationOptions();
            this.organizationOpts = this.locationsService.getOrganizationOptions();
            if (this.suggestedLocationID) {
                this.selectedLocationID = this.suggestedLocationID;
                this.locationSelected();
            }
        }
    }

    ngOnInit() {
        this.route.data.subscribe((data:any) => {
            if (data.title) {
                this.headerText = data.title;
            }
            if (data.statusMessage) {
                this.statusMessage = data.statusMessage;
            }
            if (data.reason) {
                this.changeReason = data.reason;
            }
        })
    }

    ngOnDestroy() {
        // prevent memory leak when component destroyed
        this.locationsSubscription.unsubscribe();
        this.subscriptions.client.unsubscribe();
        this.subscriptions.user.unsubscribe();
    }

    checkForSuggestedLocation() {
        this.route.params.subscribe((params: any) => {
            if (params.locId) {
                if (!this.loadingLocations) {
                    this.selectedLocationID = params.locId;
                    this.locationSelected();
                } else {
                    this.suggestedLocationID = params.locId;
                }
            }
        });
    }

    checkForWarnings() {
        this.checkForActiveEvaluations();
        this.checkForReferrals();
    }

    checkForActiveEvaluations() {
        const params = {
            id: this.client.id,
        };
        this.plGraphQL
            .query(
                `query checkForActiveEvaluations($id: ID!){
                  clientServices(clientId: $id) {
                    edges {
                      node {
                        ... on Evaluation {
                          id
                          status
                        }
                        ... on DirectService {
                          id
                        }
                      }
                    }
                  }
                }`,
                params,
                {},
            )
            .subscribe((res: any) => {
                for (const service of res.clientServices) {
                    if (service.status === 'IN_PROCESS') {
                        this.hasOpenEvaluations = true;
                        break;
                    }
                }
            });
    }

    checkForReferrals() {
        const params = {
            id: this.client.id,
        };
        this.plGraphQL
            .query(
                `query checkForReferrals($id: String){
                    referrals(clientId: $id) {
                        edges {
                          node {
                            id
                          }
                        }
                      }
                    }`,
                params,
                {},
            )
            .subscribe((res: any) => {
                this.hasReferrals = res.referrals.length;
            });
    }

    setClientData(client: any) {
        this.client = Object.assign({}, client);
        this.clientLocation = client.locations[0].name;
        this.clientLocationID = client.locations[0].id;
        this.clientOrganization = client.locations[0].parent.name;
        this.clientLocationState = client.locations[0].state;
    }

    locationSelected() {
        const location: any = this.locationsService.getLocationForID(this.selectedLocationID);
        this.newClientLocationName = location.name;
        this.newClientLocationID = location.id;
        this.newClientOrganization = this.locationsService.getOrganizationNameForID(location.parentId);
        this.selectedOrganizationID = location.parentId;
        this.newClientLocationState = location.state;
    }

    clearLocation() {
        this.selectedLocationID = null;
    }

    // when an organization is selected, filter the list of locations to those that have this org as their parent
    organizationSelected(event: any) {
        this.locationOpts = this.locationsService.getLocationOptionsForParentOrg(event.model);
        this.selectedLocationID = null;
    }
    clearOrganization() {
        this.selectedOrganizationID = null;
        this.selectedLocationID = null;
        this.locationOpts = this.locationsService.getLocationOptionsForParentOrg(null);
    }

    goBack = () => {
        this.plLink.goBack();
    }

    review() {
        this.editLocation = false;
        this.reviewLocation = true;
    }

    edit() {
        this.editLocation = true;
        this.reviewLocation = false;
    }

    submit() {
        this.submitting = true;
        const variables: any = {
            locationChange: {
                id: this.client.id,
                fromLocationId: this.clientLocationID,
                toLocationId: this.newClientLocationID,
                reason: this.changeReason,
            },
        };
        this.plGraphQL
            .mutate(
                `mutation changeLocation($locationChange: ClientTransferInput!) {
                    transferClient(input: {clientTransfer: $locationChange}) {
                        errors {
                            code
                            field
                            message
                        }
                        status
                        client {
                            id
                            locations {
                                edges {
                                    node {
                                        id
                                        name
                                        parent {
                                            id
                                            name
                                        }
                                    }
                                }
                            }
                            state
                        }
                    }
                }`,
                variables,
                {},
            )
            .subscribe(
                (res: any) => {
                    this.submitting = false;
                    if (res.transferClient.errors) {
                        this.plToast.show('error', res.transferClient.errors);
                    } else {
                        this.submitted = true;
                        this.plToast.show('success', 'Success! You have changed the location.', 2000, true);
                    }
                    this.goBack();
                },
                (err: any) => {
                    this.submitting = false;
                }
            );
    }
}
