import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

import { PLClientStudentDisplayService } from '@root/index';

@Component({
  selector: 'pl-client-delete',
  templateUrl: './pl-client-delete.component.html',
  styleUrls: ['./pl-client-delete.component.less'],
  inputs: ['client', 'onDelete', 'onCancel'],
})
export class PLClientDeleteComponent {
    client: any = {};
    onDelete: Function;
    onCancel: Function;

    currentUser: User;
    get modalHeaderText(): string {
        const clientStudentCapital = PLClientStudentDisplayService.get(this.currentUser, { capitalize: true });
        return `Delete ${clientStudentCapital}`;
    };

    constructor(private store: Store<AppStore>) {
        store.select('currentUser')
            .subscribe((user: any) => {
                this.currentUser = user;
            });
    }

    delete() {
        this.onDelete({});
    }

    cancel() {
        this.onCancel();
    }
}
