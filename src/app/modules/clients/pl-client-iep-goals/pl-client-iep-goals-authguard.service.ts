import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'
import { CurrentUserService } from '@modules/user/current-user.service';
import { PLMayService } from '@root/index';

@Injectable()
export class PLClientIepGoalsAuthGuardService implements CanActivate {

    constructor(
        private currentUserService: CurrentUserService,
        private plMay: PLMayService
    ) {
    }

    canActivate(): Observable<any> {
        return this.currentUserService.getCurrentUser().pipe(
            map((user: any) => this.plMay.isProvider(user) || this.plMay.isCustomerAdmin(user))
        );
    }
}