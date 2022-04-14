import { Component, HostListener } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';

import {
    PLHttpService,
    PLUrlsService,
} from '@root/index';

@Component({
    selector: 'pl-provider-preagreement',
    templateUrl: './pl-provider-preagreement.component.html',
    styleUrls: ['./pl-provider-preagreement.component.less'],
})
export class PLProviderPreagreementComponent {
    loading = true;
    isAgreed = false;
    url = '';
    firstName = '';
    lastName = '';
    rateDisplay = 0;
    rateDisplay2 = 0;
    rateDisplay3 = 0;
    documentUrl: '';
    documentUrlSafe: any;
    frameHeight = '0px';
    formVals = {
        agree: false,
        firstName: '',
        lastName: '',
    };
    message = '';
    formValid = false;

    constructor(
        private route: ActivatedRoute,
        private plHttp: PLHttpService,
        private plUrls: PLUrlsService,
        private sanitizer: DomSanitizer,
    ) {
    }

    ngOnInit() {
        this.route.params.pipe(first()).subscribe((params: any) => {
            const id = params['id'];

            this.url = `${this.plUrls.urls.preagreements}${id}/`;

            this.plHttp.get('', {}, this.url).pipe(first())
                .subscribe((res: any) => {
                    this.loading = false;

                    // 200 with no data means "already agreed"
                    if (res === null) {
                        this.isAgreed = true;
                    } else {
                        this.isAgreed = !!res.agreed_on;
                        this.rateDisplay = res.base_rate.toFixed(2);
                        this.rateDisplay2 = res.tier1_rate.toFixed(2);
                        this.rateDisplay3 = res.tier2_rate.toFixed(2);
                        this.firstName = res.first_name;
                        this.lastName = res.last_name;
                        this.documentUrl = res.document_url;
                        this.setFrameHeight();

                        // special needs for mobile/iOS
                        // https://stackoverflow.com/questions/15854537/make-embedded-pdf-scrollable-in-ipad

                        let documentUrlViewer: string = this.documentUrl;

                        if (window.innerWidth < 768) {
                            this.frameHeight = ((window.innerHeight / 2) - 32) + 'px';
                            if (this.documentUrl.endsWith('.pdf')) {
                                documentUrlViewer = PDF_VIEWER + encodeURIComponent(this.documentUrl);
                            }
                        }

                        const zoom = (window.innerWidth < 1024) ? '#view=FitH' : '#zoom=100';
                        this.documentUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(documentUrlViewer + zoom);
                    }
                });
        });
    }

    @HostListener('window:resize', ['$event']) onResize() {
        this.setFrameHeight();
    }

    private setFrameHeight() {
        const headlineHeight = 75;
        const lowerAreaHeight = 300;
        const height = Math.max(250, window.innerHeight - headlineHeight - lowerAreaHeight);

        this.frameHeight = height + 'px';
    }

    checkFormValid() {
        // Add timeout to allow checkbox value to update.
        setTimeout(() => {
            // Name must exactly match what we have.
            if (this.formVals.agree && this.formVals.firstName === this.firstName &&
                this.formVals.lastName === this.lastName) {
                this.formValid = true;
                this.message = '';
            } else {
                this.formValid = false;
                this.message = `Please enter <b>${this.firstName}</b> for first name and ` +
                    `<b>${this.lastName}</b> for last name.`;
            }
        }, 1);
    }

    onSave(evt: any) {
        const data: any = {
            uuid: '-', // need this to get PATCH instead of PUT...
            agree: true,
        };

        this.loading = true;

        this.plHttp.save('', data, this.url).pipe(first())
            .subscribe((res: any) => {
                this.isAgreed = true;
                this.loading = false;
            });
    }
}

const PDF_VIEWER = 'https://docs.google.com/gview?embedded=true&url=';
