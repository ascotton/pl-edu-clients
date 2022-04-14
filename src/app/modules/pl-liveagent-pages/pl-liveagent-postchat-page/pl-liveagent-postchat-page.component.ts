import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';

@Component({
    selector: 'pl-liveagent-postchat-page',
    templateUrl: './pl-liveagent-postchat-page.component.html',
    styleUrls: ['./pl-liveagent-postchat-page.component.less']
})
export class PLLiveagentPostchatPageComponent {

    constructor(private store: Store<AppStore>) {}

    ngOnInit() {
        // https://stackoverflow.com/questions/43375532/expressionchangedafterithasbeencheckederror-explained
        setTimeout(() => {
            // how about putting this in the constructor instead of this lifecycle method?
            this.store.dispatch({
                type: 'UPDATE_APP',
                payload: { classContainer: 'no-nav' },
            });
        }, 0);
    }
};
