import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';
import { User } from './user.model';

import { PLAbstractUserIDService } from '@root/index';

@Injectable()
export class CurrentUserUserIDService implements PLAbstractUserIDService {
    constructor(private store: Store<AppStore>) {}

    userID(): Observable<string> {
        return this.store.select('currentUser').pipe(
            map((user: User) => (user && user.uuid) || ''),
        );
    }
}
