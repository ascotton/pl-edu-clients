import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
// RxJs
import { of } from 'rxjs';
import { first, switchMap, map } from 'rxjs/operators';
// Models
import { PLProviderService } from '@modules/providers/pl-provider.service';
// Resolvers
import { CurrentUserResolver } from './current-user.resolver';
import { User } from '@modules/user/user.model';

@Injectable()
export class ProviderResolver implements Resolve<any> {

    constructor(private service: PLProviderService, private userResolver: CurrentUserResolver) { }

    resolve(route: ActivatedRouteSnapshot) {
        const { provider: providerUuid } = route.params;
        return this.userResolver.resolve().pipe(
            switchMap((user: User) => {
                if (providerUuid && user.uuid !== providerUuid) {
                    return this.service.getProvider(providerUuid).pipe(
                        map(({ provider }) => ({
                            provider,
                            currentUser: user,
                        })),
                    );
                }
                return of({
                    currentUser: user,
                });
            }),
            first(),
        );
    }
}
