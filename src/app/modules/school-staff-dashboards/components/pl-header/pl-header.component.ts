import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { User } from '@modules/user/user.model';
import { PLUrlsService } from '@root/index';
import { PLMenuItem } from '../../models';

@Component({
    selector: 'pl-header',
    templateUrl: './pl-header.component.html',
    styleUrls: ['./pl-header.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLHeaderComponent {

    logo = {
        route: '/home',
        height: 25,
        width: 50,
        svg: 'logo-color-no-tm',
    };

    @Input() menuItems: PLMenuItem[];
    @Input() user: User;
    @Input() version: string;
    @Input() sideNav: MatSidenav;
    @Input() sideNavOpened: boolean;
    @Input() isHandset: boolean;

    constructor(public plUrls: PLUrlsService) { }

    supportChat() {
        const _timeout = window['setTimeout'];
        const liveagent = window['liveagent'];
        const plLiveAgent = window['plLiveAgent'];
        const buttonId = '57380000000GnQ2';
        if (plLiveAgent) {
            console.log(`[plLiveAgent]`, plLiveAgent);
        }
        if (liveagent && plLiveAgent && plLiveAgent.chatAvailable) {
            liveagent.startChat(plLiveAgent.buttonId);
        }
    }
}
