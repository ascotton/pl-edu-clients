import { Component, Input } from '@angular/core';

@Component({
    selector: 'pl-help-support',
    templateUrl: './pl-help-support.component.html',
    styleUrls: ['./pl-help-support.component.less'],
})
export class PLHelpSupportComponent {
    @Input() contact = {
        email: 'sarah.smith@presencelearning.com',
        name: 'Sarah Smith',
    };
    @Input() support = {
        email: 'asksupport@presencelearning.com',
        phone: '1-844-415-4592',
    };
    @Input() links: any[] = [];

    constructor() {
    }

    ngOnChanges(changes: any) {
    }
}
