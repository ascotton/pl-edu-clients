import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';

import { PLUrlsService } from '@root/index';

import { User } from '@modules/user/user.model';

import { PLProviderProfile } from '@common/interfaces';
import {
    PLProviderProfileService,
    PLProvidersListService,
} from '@common/services';
import { PLLocationService } from '../pl-location.service';

type ProvidersResults = {
    providers: PLProviderProfile[],
    totalCount: number,
};

@Component({
    selector: 'pl-location-providers',
    templateUrl: './pl-location-providers.component.html',
    styleUrls: ['./pl-location-providers.component.less'],
})
export class PLLocationProvidersComponent implements OnInit, OnDestroy {
    readonly filterSelectOpts: any[] = [
        { value: 'lastName_Icontains', label: 'Last Name', defaultVisible: true },
        { value: 'firstName_Icontains', label: 'First Name', defaultVisible: true },
    ];

    mayViewRoom: boolean = false;
    loading = false;
    location: any = null;
    providers: PLProviderProfile[] = [];
    urls: any = {};
    // Query params subject emits table onQuery event parameters from filters, pagination, etc.
    queryParams$: Subject<any> = new Subject<any>();
    total: number = 0;
    user: User;

    private subscriptions: any = {
        locationAndUser: null,
        providers: null,
    };

    constructor(
        private router: Router,
        private plLocation: PLLocationService,
        private plProviderProfileService: PLProviderProfileService,
        private plProvidersListService: PLProvidersListService,
        private plUrls: PLUrlsService, 
    ) {}

    ngOnInit() {
        this.subscriptions.locationAndUser = this.plLocation.getFromRoute().subscribe((data: any) => {
            this.user = data.currentUser;
            this.checkPrivileges();
            this.location = data.location;
        });

        // Emits a single location object.
        const location$ = this.plLocation.getFromRoute().pipe(
            first(),
            map((data: any) => data.location),
        );

        // getProviders emits query results for the table whenever there are new query params
        this.subscriptions.providers = this.getProviders(location$, this.queryParams$)
        .subscribe(results => this.onQueryResults(results));

        this.setUrls();
    }

    setUrls() {
        this.urls.room = this.plUrls.urls.roomFE;
    }

    ngOnDestroy(): void {
        this.subscriptions.locationAndUser.unsubscribe();
        this.subscriptions.providers.unsubscribe();
    }

    checkPrivileges() {
        if (this.user && this.user.uuid) {
            this.mayViewRoom = this.user.xEnabledUiFlags &&
            this.user.xEnabledUiFlags.includes('room-view-room-url');
        }
    }

    clickRow(provider: any): void {
        this.router.navigate(['/provider', provider.user.id]);
    }

    listProviderTypes(provider: any): string {
        var finalTypes = [];
        var types = provider.providerTypes;
        for(var i = 0; i < types.length; i++) {
            finalTypes.push(types[i]['longName']);
        }
        return finalTypes.join(', ');
    }

    onQuery({ query }: { query: any }): void {
        this.loading = true;

        query.offset =  (query.page - 1) * query.first;

        this.queryParams$.next(query);
    }

    private onQueryResults(results: ProvidersResults): void {
        this.providers = results.providers;
        this.total = results.totalCount;
        this.loading = false;
    }

    scheduleUrl(provider: any): string {
        return this.plProvidersListService.scheduleUrl(provider.user.id);
    }

    isPhoneColumnVisible(): boolean {
        return this.plProvidersListService.isPhoneColumnVisible(this.user);
    }

    isScheduleColumnVisible(): boolean {
        return this.plProvidersListService.isScheduleColumnVisible(this.user);
    }

    mayViewScheduleFor(provider: any): boolean {
        return this.plProvidersListService.mayViewScheduleFor(provider);
    }

    /*
        Returns an observable of providers, combining latest location and query parameters.
    */
    private getProviders(location$: Observable<any>, params$: Observable<any>): Observable<ProvidersResults> {
        // In this case we use combine latest to continually emit as new query params are issued by the table
        // component. Switch map will unsubscribe to prior getByLocation observables with each new location/param
        // set.
        return combineLatest(params$, location$).pipe(
            switchMap((latestArgs: any[]) => {
                const params = latestArgs[0];
                const location = latestArgs[1];
                const locationId = location.id;

                const fetchParams = Object.assign({}, params, { locationId });

                return this.plProviderProfileService.getProviderProfiles(fetchParams);
            }),
        );
    }
}
