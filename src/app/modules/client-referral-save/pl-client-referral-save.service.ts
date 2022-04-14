import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { PLHttpService, PLMayService, PLLodashService, PLBrowserService, PLApiClientsService } from '@root/index';
import { AppStore } from '@app/appstore.model';
import { User } from '../user/user.model';
import { CurrentUserService } from '../user/current-user.service';

@Injectable()
export class PLClientReferralSaveService {
    client: any = {};

    clientUuid: string = '';
    referralUuid: string = '';
    private view: string = '';
    private currentUser: User = null;
    private userProvider: any = {};
    private clientReferralFormVals: any = {
        client: {},
        location: {},
    };
    private isEdit: boolean = false;
    private providerUserUuid: string = '';
    private loaded: any = {
        currentUser: false,
        routeParams: false,
        client: false,
    };
    private routeParams: any;

    private sharedDataObserver: any;

    constructor(private plHttp: PLHttpService, private route: ActivatedRoute,
     private location: Location, private router: Router,
     private store: Store<AppStore>, private plLodash: PLLodashService,
     private plMay: PLMayService,
     private plBrowser: PLBrowserService, private plCurrentUser: CurrentUserService,
     private plApiClients: PLApiClientsService) {
        this.reset();
    }

    getSharedData() {
        return new Observable((observer: any) => {
            this.sharedDataObserver = observer;
            this.updateSharedData();
        });
    }

    updateSharedData(data1: any = {}) {
        if (this.sharedDataObserver) {
            const dataDefault = {};
            const keys = ['clientReferralFormVals', 'isEdit',
             'client', 'currentUser'];
            keys.forEach((key: any) => {
                dataDefault[key] = this[key];
            });
            const data = Object.assign({}, dataDefault, data1);
            this.sharedDataObserver.next(data);
        }
    }

    reset() {
        this.client = {};

        this.clientUuid = '';
        this.referralUuid = '';
        this.view = '';
        this.currentUser = null;
        this.userProvider = {};
        this.clientReferralFormVals = {
            client: {},
        };
        this.isEdit = false;
        this.providerUserUuid = '';
        this.loaded = {
            currentUser: false,
            routeParams: false,
            client: false,
        };
        // this.routeParams;

        this.sharedDataObserver = null;
    }

    init() {
        this.reset();
        return new Observable((observer: any) => {
            const checkAllLoadedLocal = () => {
                if (this.plLodash.allTrue(this.loaded)) {
                    this.onAllLoaded();
                    observer.next({ client: this.client });
                    this.updateSharedData();
                }
            };
            this.router.events.subscribe((val: any) => {
                this.setView();
            });
            this.store.select('currentUser')
                .subscribe((user: any) => {
                    this.currentUser = user;
                    if (user && user.uuid) {
                        this.userProvider = this.plCurrentUser.getProvider(user);
                        this.loaded.currentUser = true;
                        checkAllLoadedLocal();
                    }
                });
            this.route.queryParams
                .subscribe((routeParams: any) => {
                    this.routeParams = routeParams;
                    this.clientUuid = routeParams['client'] || '';
                    // this.serviceUuid = routeParams['service'] || '';
                    // if (this.serviceUuid) {
                    //     this.isEdit = true;
                    // }
                    this.getClient()
                        .subscribe((client: any) => {
                            checkAllLoadedLocal();
                        });
                    this.setView();
                    this.loaded.routeParams = true;
                    checkAllLoadedLocal();
                });
        });
    }

    destroy() {
        this.reset();
    }

    onAllLoaded() {
        const userProviderId = this.userProvider ? this.userProvider.user : '';
        this.providerUserUuid = this.routeParams['provider'] ?
         this.routeParams['provider'] : userProviderId;
        // TODO
        // if (this.clientService && this.clientService.uuid) {
        //     this.serviceFormVals = Object.assign({}, this.serviceFormVals,
        //      this.clientServiceToInputs(this.clientService));
        // }
    }

    getClient() {
        return new Observable((observer: any) => {
            if (this.clientUuid) {
                this.plApiClients.get({ uuid: this.clientUuid })
                    .subscribe((res: any) => {
                        this.client = res[0];
                        // TODO
                        // const clientFields = ['annual_iep_due_date', 'previous_triennial_evaluation_date',
                        //  'triennial_evaluation_due_date', 'primary_language', 'secondary_language'];
                        // const clientObj = this.plLodash.pick(this.client, clientFields);
                        // this.serviceFormVals.client = Object.assign({},
                        //  this.serviceFormVals.client, clientObj);
                        this.loaded.client = true;
                        observer.next(this.client);
                    });
            } else {
                this.loaded.client = true;
                observer.next();
            }
        });
    }

    // TODO
    // clientServiceToInputs(clientService: any) {
    //     return clientServiceInput;
    // }

    setView() {
        const oldView = this.view;
        this.view = this.plBrowser.getSubRoute();
    }

    submitClientReferral() {
        return new Observable((observer: any) => {
            // TODO
            // this.plApiServiceSave.save({ evaluation, directService }, client, documents)
            //     .subscribe(() => {
            //         observer.next();
            //     }, (err: any) => {
            //         observer.error();
            //     });
        });
    }
}
