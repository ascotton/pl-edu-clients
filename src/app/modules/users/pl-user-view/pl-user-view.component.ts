import { Component, EventEmitter, Input, Output } from '@angular/core';

import { PLUserAccount } from '../pl-user.service';
import { PLUserAssignment } from '@common/services/user-assignments/pl-user-assignment';

@Component({
    selector: 'pl-user-view',
    templateUrl: './pl-user-view.component.html',
    styleUrls: ['./pl-user-view.component.less'],
})
export class PLUserViewComponent {
    @Input() user: PLUserAccount;
    @Input() assignments: PLUserAssignment[];

    @Output() readonly cancel = new EventEmitter<any>();

    onCancelClick(): void {
        this.cancel.emit();
    }
}
