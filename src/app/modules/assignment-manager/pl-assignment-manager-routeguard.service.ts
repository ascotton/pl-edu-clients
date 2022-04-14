import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrentUserService } from '@modules/user/current-user.service';

const PERM_MANAGE_PROPOSALS = 'manageProposals';
@Injectable()
export class PLAssignmentManagerRouteGuardService implements CanActivate {

    constructor(
        private currentUserService: CurrentUserService,
    ) {
    }

    canActivate(): Observable<any> {
        return this.currentUserService.getCurrentUser().pipe(
            map((user: any) => user.xGlobalPermissions[PERM_MANAGE_PROPOSALS]),
        );
    }
}
