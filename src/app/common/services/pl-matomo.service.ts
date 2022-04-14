import { Inject, Injectable, OnDestroy, Renderer2, RendererFactory2 } from '@angular/core';
import { MatomoInjector, MatomoTracker } from 'ngx-matomo';
// RxJs
import { takeUntil, delay } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { environment } from '@root/src/environments/environment';
import { PLUserNavigationService } from './facade';

@Injectable()
export class PLMatomoService implements OnDestroy {

    private siteId: number;
    private renderer: Renderer2;
    private destroyed$ = new Subject<boolean>();
    private user$ = this.facade.getCurrentUser();
    private navEnd$ = this.facade.getNavigationEnd();

    constructor(
        @Inject(DOCUMENT) private document: Document,
        rendererFactory: RendererFactory2,
        private facade: PLUserNavigationService,
        private matomoInjector: MatomoInjector,
        private matomoTracker: MatomoTracker) {
        this.siteId = environment.matomo_site;
        // If siteId not present do not load matomo
        if(!this.siteId) {
            return;
        }
        this.user$.pipe(
            takeUntil(this.destroyed$),
        ).subscribe(({ username }) =>
            this.matomoTracker.setUserId(username));
        this.renderer = rendererFactory.createRenderer(null, null);
        this.matomoInjector.init('//matomo.presencelearning.com/', this.siteId);
        this.matomoTracker.setCookieDomain('*.presencelearning.com');
        this.matomoTracker.enableLinkTracking(true);
    }

    init() {
        if(!this.siteId) {
            return;
        }
        // Listen to all click events to build a "DOM Tree" so we can have "backward" analitycs
        this.renderer.listen(this.document, 'click', (evt) =>
            this.matomoTracker.trackEvent('click', this.createTree(<Element>evt.target)));
        combineLatest([this.user$, this.navEnd$])
            .pipe(
                delay(0),
                takeUntil(this.destroyed$),
            ).subscribe(([user, navEnd]) => {
                this.matomoTracker.setCustomUrl(window.location.href);
                this.matomoTracker.setDocumentTitle(`${this.document.domain}/${this.document.title}`);
                this.matomoTracker.trackPageView();
            });
    }

    ngOnDestroy() {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    /**
     * Builds an string of all parent nodes
     * @param node base element
     */
    private createTree(node: Element): string {
        const _path = [];
        do {
            _path.push(this.createElementQuery(node));
            node = <Element>node.parentNode;
        } while (node && node.tagName !== 'BODY' && node.nodeName !== '#document');
        return _path.reverse().join(' ');
    }

    /**
     * Creates the querySelector for the node
     * @param node base element
     */
    private createElementQuery(node: Element): string {
        let id = '';
        let classList = '';
        if (node.id) {
            id = `#${node.id}`;
        }
        if (node.classList && node.classList.length) {
            const _list: string[] = [];
            node.classList
                .forEach(c => {
                    // Exclude any ng class maybe we can have a class whitelist
                    if (!c.startsWith('ng-')) {
                        _list.push(`.${c}`)
                    }
                });
            classList = _list.join('');
        }
        return `${node.tagName.toLowerCase()}${id}${classList}`;
    }

    customEvent(category: string, action: string, name?: string) {
        this.matomoTracker.trackEvent(category, action, name);
    }
}
