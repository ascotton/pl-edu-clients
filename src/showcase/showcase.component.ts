import { Component } from '@angular/core';
import { environment } from '@environments/environment';

@Component({
    selector: 'app-showcase',
    templateUrl: './showcase.component.html',
    styleUrls: ['./showcase.component.less'],
})
export class ShowcaseComponent {
    currentUser: any = {};
    gitSha: string = '';
    pageLinks: any[] = [
        // { href: '/typography', label: 'Typography', icon: 'location' },
        // { href: '/config', label: 'Config', icon: 'location' },
        // { href: '/colors', label: 'Colors', icon: 'location' },
        // { href: '/buttons', label: 'Buttons', icon: 'location' },
        // { href: '/icons', label: 'Icons', icon: 'location' },
        { href: '/components/inputs', label: 'Inputs', icon: 'location' },
        // { href: '/tables', label: 'Tables', icon: 'location' },
        { href: '/components/table-framework', label: 'Table Framework', icon: 'location' },
        // { href: '/profile', label: 'Profile', icon: 'location' },
        { href: '/components/other', label: 'More', icon: 'location' },
    ];
    appLinks: any[] = [];
    supportLinks: any[] = [];
    userMenuLinks: any[] = [];
    logo: any = {};
    browserSupported: boolean = true;

    title = 'app works!';

    constructor() {
        this.gitSha = environment.git_sha ? environment.git_sha.slice(0, 4) : '';
    }
}
