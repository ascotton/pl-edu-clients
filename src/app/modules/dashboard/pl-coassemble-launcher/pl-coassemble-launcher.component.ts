import { Component } from '@angular/core';

import { first } from 'rxjs/operators';

import {
    PLHttpService,
    PLUrlsService,
} from '@root/index';

@Component({
    selector: 'pl-coassemble-launcher',
    templateUrl: './pl-coassemble-launcher.component.html',
})
export class PLCoassembleLauncherComponent {
    constructor(
        private plUrls: PLUrlsService,
        private plHttp: PLHttpService,
    ) {
    }

    ngOnInit() {
        const url = this.plUrls.urls.coassembleRegistration;

        const saveParams = {
            uuid: '-', // need this to get PATCH instead of PUT...
        };

        this.plHttp
            .save('', saveParams, url)
            .pipe(first())
            .subscribe((res: any) => {
                window.location.replace('https://presencelearning.coassemble.com/security/connect/custom');
            });
    }
}
