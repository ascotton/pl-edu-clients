import {
    Injectable,
    Renderer2,
    Inject,
    RendererFactory2,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PLUserNavigationService } from './facade';

@Injectable({ providedIn: 'root' })
export class PLUserGuidingService {

    private loadedIds: string[] = [];
    private renderer: Renderer2;

    constructor(
        rendererFactory: RendererFactory2,
        public facade: PLUserNavigationService,
        @Inject(DOCUMENT) private _document: Document) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }
    
    runScript(text: string, inBody = true) {
        this.createScript({ text }, inBody);
    }

    createScript(properties: { text?: string, src?: string; async?: boolean }, inBody = true) {
        const script =  this.renderer.createElement('script');
        if (properties.text) {
            script.text = properties.text;
        } else {
            script.src = properties.src;
            if (properties.async) {
                script.async = true;
            }
        }
        this.renderer.appendChild(inBody ? this._document.body : this._document.head, script);
    }

    addUserGuiding(s: string) {
        if(this.loadedIds.includes(s)) {
            return;
        }
        const g = window;
        const d = 'userGuiding';
        const e = 'userGuidingLayer';
        const ugl = g[e] || [];
        this.createScript({ src: `https://static.userguiding.com/media/user-guiding-${s}-embedded.js`, async: true });
        if(g[d]) {
            return;
        }
        const ug: any = g[d] = { q:[] };
        ug.c = function(n: any) { 
            return function() {
                return ug.q.push([n, arguments]);
            }
        };
        ['previewGuide', 'finishPreview', 'track', 'identify', 'triggerNps', 'hideChecklist', 'launchChecklist']
            .forEach(m => ug[m]=ug.c(m));
        this.loadedIds.push(s);
        ug.identify(this.facade.currentUser.username);
    }
}