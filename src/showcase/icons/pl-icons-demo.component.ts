import { Component } from '@angular/core';

import { SvgInlineNgPluginService } from '../../build/svg-inline-ng-plugin.service';

@Component({
    selector: 'pl-icons-demo',
    templateUrl: './pl-icons-demo.component.html',
    styleUrls: ['./pl-icons-demo.component.less'],
    providers: [SvgInlineNgPluginService],
})
export class PLIconsDemoComponent {
    icons: string[] = [];

    constructor(private svgInlineNgPluginService: SvgInlineNgPluginService) {}

    ngOnInit() {
        this.formIconsList();
    }

    formIconsList() {
        const icons: string[] = [];
        for (let icon in this.svgInlineNgPluginService.svgs) {
            icons.push(icon);
        }
        this.icons = icons;
    }
}
