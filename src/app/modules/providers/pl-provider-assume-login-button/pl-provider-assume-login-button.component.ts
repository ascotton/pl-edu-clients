import { Component } from '@angular/core';

import { PLAssumeLoginService } from '@root/index';

@Component({
    selector: 'pl-provider-assume-login-button',
    templateUrl: './pl-provider-assume-login-button.component.html',
    inputs: ['label', 'email']
})

export class PLProviderAssumeLoginButtonComponent {
    email: string;
    label: string;

    constructor(private assumeLoginService: PLAssumeLoginService) {}

    onClick() {
        this.assumeLoginService.assume(this.email);
    }
}
