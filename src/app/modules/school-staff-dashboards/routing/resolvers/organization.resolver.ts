import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
// ngRx
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { PLFetchOrganization, selectOrganization, PLATFORM_ADMIN_STORE } from '../../store';
// rxJs
import { Observable, of } from 'rxjs';
import { first, filter, tap, map } from 'rxjs/operators';

@Injectable()
export class OrganizationLoadedResolver implements Resolve<boolean> {

    constructor(private store$: Store<AppStore>) { }

    resolve(route: ActivatedRouteSnapshot): Observable<boolean> {
        let orgId: string;
        const { org: queryParam } = route.queryParams;
        const storage = sessionStorage.getItem(PLATFORM_ADMIN_STORE.organization);
        if (queryParam) {
            orgId = queryParam;
        } else if (storage) {
            orgId = storage;
        }
        if (!orgId) {
            return of(true);
        }
        return this.store$.select(selectOrganization(orgId)).pipe(
            tap((organization) => {
                if (!organization) {
                    this.store$.dispatch(PLFetchOrganization({ id: orgId }));
                }
            }),
            map(organization => !!organization),
            filter(loaded => loaded),
            first(),
        );
    }

}
