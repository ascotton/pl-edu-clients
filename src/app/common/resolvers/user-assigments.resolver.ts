import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
// RxJs
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
// Services or Resolvers
import { CurrentUserResolver } from './current-user.resolver';
// Models
import { Store } from '@ngrx/store';
import { PLUserAssignment } from '../services';
import { AppStore } from '../../appstore.model';
import { User } from '../../modules/user/user.model';

@Injectable()
export class UserAssigmentsResolver implements Resolve<PLUserAssignment[]> {

    constructor(
        private store$: Store<AppStore>,
        private userResolver: CurrentUserResolver,
    ) {}

    resolve(): Observable<PLUserAssignment[]> {
        // TODO: Is this an ngRx sotre canidate?
        return this.userResolver.resolve()
            .pipe(
                map((currentUser: User) => currentUser.xAssignments),
                first()
            );
    }
}
