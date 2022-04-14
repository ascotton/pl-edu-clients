import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';

import { PLLodashService, PLGQLProvidersService } from '@root/index';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { CurrentUserService } from '@modules/user/current-user.service';

@Injectable()
export class PLGetProviderService {
    private currentUser: User = null;
    private userProvider: any = null;
    private providerUserUuid: string = '';
    private loaded: any = {
        currentUser: false,
        routeParams: false,
    };
    private routeParams: any = {};

    constructor(private route: ActivatedRoute, private store: Store<AppStore>,
     private plCurrentUser: CurrentUserService, private plLodash: PLLodashService,
     private plGQLProviders: PLGQLProvidersService) {

    }

    get(routeParamKey: string = 'provider') {
        return new Observable((observer: any) => {

            const checkAllLoadedLocal = () => {
                if (this.plLodash.allTrue(this.loaded)) {
                    const providerUserId = this.routeParams[routeParamKey] || '';
                    const userProviderId = this.userProvider ? this.userProvider.user : '';
                    this.providerUserUuid = providerUserId ?
                     providerUserId : userProviderId;
                    // TODO - currently can not go from provider user to profile profile so can only do this
                    // if already have the provider id (not the provider USER id).
                    if (this.providerUserUuid && this.userProvider && this.userProvider.uuid) {
                        this.getProviderById(this.userProvider.uuid)
                            .subscribe((res: any) => {
                                observer.next({ providerUserId: this.providerUserUuid, provider: res.providerProfile });
                            });
                    }
                }
            };

            this.store.select('currentUser')
                .subscribe((user: any) => {
                    this.currentUser = user;
                    if (user && user.uuid) {
                        this.userProvider = this.plCurrentUser.getProvider(user);
                    }
                    this.loaded.currentUser = true;
                    checkAllLoadedLocal();
                });
            this.route.queryParams
                .subscribe((routeParams: any) => {
                    this.routeParams = routeParams;
                    this.loaded.routeParams = true;
                    checkAllLoadedLocal();
                });
        });
    }

    getProviderById(providerId: string) {
        return this.plGQLProviders.getById(providerId);
    }
}
