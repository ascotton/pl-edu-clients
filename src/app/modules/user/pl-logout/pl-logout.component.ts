import { Component } from '@angular/core';
import {Observable} from "rxjs";
import {User} from '../user.model';
import {CurrentUserService} from '../current-user.service';

@Component({
    selector: 'pl-logout',
    templateUrl: './pl-logout.component.html',
    styleUrls: ['./pl-logout.component.less']
})
export class plLogoutComponent {
    currentUser: Observable<User>;

    constructor(private currentUserService: CurrentUserService) {
        // http://stackoverflow.com/questions/36803389/angular2-async-pipe-not-does-not-fill-object-data-into-template
        // this.currentUser = currentUserService.user;
        // currentUserService.user.subscribe((data) => {
        //     if (data) {
        //         this.currentUser = data;
        //     }
        // });
        currentUserService.logout();
    }
};
