import { Component } from '@angular/core';

@Component({
    selector: 'buttons',
    templateUrl: './buttons.component.html',
    styleUrls: ['./buttons.component.less'],
})
export class ButtonsComponent {
    click(evt: any) {
        console.log('click');
    }
}
