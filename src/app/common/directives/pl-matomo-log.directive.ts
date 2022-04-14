import {
    OnDestroy,
    Directive,
    ElementRef,
    Input,
    Renderer2,
    AfterContentInit,
} from '@angular/core';
import { Subject } from 'rxjs';
import { MatomoTracker } from 'ngx-matomo';

@Directive({
    selector: '[plMatomo]',
})
export class PLMatomoDirective implements OnDestroy, AfterContentInit {

    @Input() plMatomo: string;
    @Input() eventName: string;

    protected destroyed$ = new Subject<boolean>();

    constructor(
        private el: ElementRef,
        private renderer: Renderer2,
        private matomoTracker: MatomoTracker) {
    }

    private listenEvent() {
        this.renderer.listen(this.el.nativeElement, this.eventName,
            () => this.matomoTracker.trackEvent(this.plMatomo, this.eventName));
    }

    ngAfterContentInit() {
        if (this.eventName) {
            this.listenEvent();
        }
    }

    ngOnDestroy() {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }
}
