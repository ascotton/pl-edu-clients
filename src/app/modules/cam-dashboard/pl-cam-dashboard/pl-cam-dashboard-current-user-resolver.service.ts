import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

import { CurrentUserService } from '@modules/user/current-user.service';
import { User } from '@modules/user/user.model';

@Injectable({
    providedIn: 'root',
})
export class PLCamDashboardCurrentUserResolverService implements Resolve<User> {
    constructor(private currentUserService: CurrentUserService) {}

    resolve(): Observable<User> {
        return this.currentUserService.getCurrentUser().pipe(first());
    }
}
