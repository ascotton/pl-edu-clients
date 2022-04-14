import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

import { CurrentUserService } from './current-user.service';

@Injectable()
export class UserAuthGuardService implements CanActivate {
    constructor(private currentUserService: CurrentUserService) { }

    canActivate(): Observable<any> {
        // return true;
        // return this.currentUserService.checkAndLogin();
        // http://stackoverflow.com/questions/37948068/angular-2-routing-canactivate-work-with-observable
        // https://github.com/angular/angular/issues/9613#issuecomment-254704628
        this.currentUserService.checkAndLogin().subscribe();
        return this.currentUserService.isLoggedIn$.pipe(first());
    }
}
