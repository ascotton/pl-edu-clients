import { Component, Input } from '@angular/core';

@Component({
    selector: 'pl-meetings-list',
    templateUrl: './pl-meetings-list.component.html',
})
export class PLMeetingsListComponent {
    @Input() title = '';
    @Input() subtitle = '';
    @Input() items: any;
    @Input() onSelect: Function;

    selectedValue: any;

    onClickSelect() {
        this.onSelect(this.selectedValue);
    }
}
