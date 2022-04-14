import { Component } from '@angular/core';

import { PLUrlsService } from '@root/index';

@Component({
    selector: 'pl-form-assembly-page',
    templateUrl: './pl-form-assembly-page.component.html',
    styleUrls: ['./pl-form-assembly-page.component.less'],
})
export class PLFormAssemblyPageComponent {

    page = '';

    constructor(
        private plUrls: PLUrlsService,
    ) {}

    ngOnInit() {
        // let targetOrigin = this.plUrls.urls.eduClientsFE;
        // // Remove any path after slash.
        // const indexSlash = targetOrigin.lastIndexOf('/');
        // targetOrigin = targetOrigin.slice(0, indexSlash);
        let targetOrigin = '*';

        let page = '';
        const locationPath = window.location.href;
        const posQuestionMark = locationPath.indexOf('?');
        if (posQuestionMark > -1) {
            let queryParamsString = locationPath.slice((posQuestionMark + 1), locationPath.length);
            let queryItems = queryParamsString.split('&');
            let queryParams: any = {};
            queryItems.forEach((queryItem) => {
                let keyValue = queryItem.split('=');
                queryParams[keyValue[0]] = keyValue[1];
            });
            if (queryParams.page) {
                page = queryParams.page;
            }
        }

        console.log(targetOrigin, 'posting message', page);
        // const targetOrigin = 'http://localhost:3010';
        parent.postMessage({ formSubmitted: 1, page }, targetOrigin);
        if (page === 'paymentInfo' || page === 'practiceDetails') {
            this.page = page;
        }
    }
}
