import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PLMenuItem } from '../../models';

@Component({
    selector: 'pl-menu-list',
    templateUrl: './pl-menu-list.component.html',
    styleUrls: ['./pl-menu-list.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLMenuListComponent {
    @Input() items: PLMenuItem[];
    @Output() readonly itemClicked: EventEmitter<PLMenuItem> = new EventEmitter<PLMenuItem>();
}
