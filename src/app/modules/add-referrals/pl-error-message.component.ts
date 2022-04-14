import {Component} from '@angular/core';

@Component({
    selector: 'pl-error-message',
    template:  `<div class="error-message">
                    <pl-icon [svg]="'close'" [height]="14" [width]="14"></pl-icon>
                    <span class="error-message-text">{{message}}</span>
                </div>`,
    styleUrls: ['./pl-error-message.component.less'],
    inputs: ['message'],
})
export class PLErrorMessageComponent {
    message = '';
}
