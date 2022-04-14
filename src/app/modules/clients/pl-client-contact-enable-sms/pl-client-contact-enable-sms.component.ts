import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PLHttpService, PLUrlsService } from '@root/index';

@Component({
    selector: 'pl-client-contact-enable-sms',
    templateUrl: './pl-client-contact-enable-sms.component.html',
    styleUrls: ['./pl-client-contact-enable-sms.component.less'],
})
export class PLClientContactEnableSMSComponent {
    loading = true;
    missingParams = false;

    constructor(
        private route: ActivatedRoute,
        private plHttp: PLHttpService,
        private plUrls: PLUrlsService,
    ) {
        this.route.queryParams.subscribe((params: any) => {
            const uuid = params['uuid'];
            const now = params['now'];

            // valid params?
            if (!uuid || !now) {
                this.loading = false;
                this.missingParams = true;
                return;
            }

            // call BE
            const url = `${this.plUrls.urls.contacts}${uuid}/enable_sms/`;
            this.plHttp.save(null, { now }, url)
                .subscribe((res: any) => {
                    this.loading = false;
                });
        });
    }
}
