import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';

import {
    PLHttpService,
    PLUrlsService,
    PLToastService,
} from '@root/index';

import { eversign } from 'src/assets/eversign';

@Component({
    selector: 'pl-provider-preagreement-w2',
    templateUrl: './pl-provider-preagreement-w2.component.html',
    styleUrls: ['./pl-provider-preagreement-w2.component.less'],
})
export class PLProviderPreagreementW2Component {
    mode = 'new';
    loading = true;
    isAgreed = false;
    private url = '';
    private frameHeight = '0px';
    private iFrame: any = null;

    constructor(
        private route: ActivatedRoute,
        private plHttp: PLHttpService,
        private plUrls: PLUrlsService,
        private plToast: PLToastService,
        private router: Router,
    ) {
    }

    ngOnInit() {
        this.route.queryParams
            .subscribe((routeParams: any) => {
                if (routeParams.mode) {
                    this.mode = routeParams.mode;
                }
            });

        this.route.params.pipe(first()).subscribe((params: any) => {
            const id = params['id'];

            this.url = `${this.plUrls.urls.preagreementW2s}${id}/`;

            this.plHttp.get('', {}, this.url).pipe(first())
                .subscribe((res: any) => {
                    this.loading = false;

                    // 200 with no data means "already agreed"
                    if (res === null) {
                        this.handleComplete(this);
                    } else {
                        this.setFrameHeight();

                        setTimeout(() => {
                            // tslint:disable-next-line: no-this-assignment
                            const that = this;

                            this.iFrame = eversign.open({
                                url: res.document_url,
                                containerID: 'eversign-container',
                                width: '100%',
                                height: this.frameHeight,
                                events: {
                                    signed () {
                                        const data: any = {
                                            uuid: '-', // need this to get PATCH instead of PUT...
                                            agree: true,
                                        };
                                        that.loading = true;
                                        that.plHttp.save('', data, that.url).pipe(first())
                                            .subscribe(() => {
                                                that.handleComplete(that);
                                            });
                                    },
                                },
                            });
                        }, 1000);
                    }
                });
        });
    }

    @HostListener('window:resize', ['$event']) onResize() {
        this.setFrameHeight();
    }

    private setFrameHeight() {
        const headlineHeight = 75;
        const lowerAreaHeight = 75;
        this.frameHeight = (window.innerHeight - headlineHeight - lowerAreaHeight) + 'px';

        if (this.iFrame) this.iFrame.height = this.frameHeight;
    }

    private handleComplete(obj: any) {
        if (obj.mode === 'renewal') {
            obj.plToast.show(
                'success',
                'Thanks for completing your agreement!',
                3000,
                true,
            );
            obj.router.navigate(['/']);
            return;
        }
        obj.isAgreed = true;
        obj.loading = false;
    }
}
