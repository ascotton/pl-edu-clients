import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
// RxJs
import { Observable } from 'rxjs';
import { first, filter } from 'rxjs/operators';
// NgRx
import { AppStore } from '@root/src/app/appstore.model';
import { Store } from '@ngrx/store';
// Models
import { User } from '../../modules/user/user.model';
import { selectCurrentUser } from '../store';

@Injectable()
export class CurrentUserResolver implements Resolve<User> {

    constructor(private store$: Store<AppStore>) {}

    resolve(): Observable<User> {
        return this.store$.select(selectCurrentUser).pipe(
            filter(user => !!user && !!user.uuid),
            first(),
        );
    }
}
