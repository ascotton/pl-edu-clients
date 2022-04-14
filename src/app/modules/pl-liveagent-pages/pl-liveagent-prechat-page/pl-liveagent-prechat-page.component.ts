/**
This page renders at the URL we hardcode into Salesforce for liveagent.
To test this page in sandbox, go here: https://plearn--sandbox2.cs41.my.salesforce.com/57380000000GnQ2
In live, go here: https://plearn.my.salesforce.com/57380000000GnQ2
1. There is currently only ONE "pre-chat form URL" box in salesforce, so only one deploy can be tested
at a time. Set this URL to the absolute URL this page will render at (localhost is an option too).
2. Switch to the "Support Console" in Salesforce, click on Liveagent chat at the bottom and go "Online".
If there is no one online in Salesforce, the "liveagent.startChat()" will fail silently and do nothing.
3. Make sure the calling application (e.g. the therapy room) has it's liveagent config set to match the
environment (sandbox or live) you are trying to test. The `initArg2` is the key that differs and it must
match to the environment we are testing against.
*/

import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

import { PLHttpService } from '@root/index';

@Component({
    selector: 'pl-liveagent-prechat-page',
    templateUrl: './pl-liveagent-prechat-page.component.html',
    styleUrls: ['./pl-liveagent-prechat-page.component.less']
})
export class PLLiveagentPrechatPageComponent {
    firstName: string = '';
    lastName: string = '';
    email: string = '';

    constructor(private store: Store<AppStore>, private plHttp: PLHttpService) {}

    ngOnInit() {
        // https://stackoverflow.com/questions/43375532/expressionchangedafterithasbeencheckederror-explained
        setTimeout(() => {
            // how about putting this in the constructor instead of this lifecycle method?
            this.store.dispatch({
                type: 'UPDATE_APP',
                payload: { classContainer: 'no-nav' },
            });
        }, 0);

        this.getUser();
        // this.store.select('currentUser')
        //     .subscribe((user: any) => {
        //         if (user && user.uuid) {
        //             this.firstName = user.first_name;
        //             this.lastName = user.last_name;
        //             this.email = user.email;
        //         }
        //     });
    }

    getUser() {
        this.plHttp.get('status', { withCredentials: true }, '', { suppressError: true })
            .subscribe((res: any) => {
                if (res.user && res.user.uuid) {
                    let user = res.user;
                    this.firstName = user.first_name;
                    this.lastName = user.last_name;
                    this.email = user.email;
                }
            });
    }
};
