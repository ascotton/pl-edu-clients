import {
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
} from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { first } from 'rxjs/operators';

import { PLUtilService } from '@common/services';
import { PLMayService, PLAssumeLoginService } from '@root/index';
import { CurrentUserService } from '@modules/user/current-user.service';
import { User } from '@modules/user/user.model';
import { PLUserService, PLUserAccount } from '../pl-user.service';
import { PLUserAssignment } from '@common/services/user-assignments/pl-user-assignment';
import { environment } from '@environments/environment';

@Component({
    selector: 'pl-user-edit',
    templateUrl: './pl-user-edit.component.html',
    styleUrls: ['./pl-user-edit.component.less'],
    providers: [PLUtilService],
})
export class PLUserEditComponent implements OnInit, OnDestroy {
    @Input() userID: string = null;
    @Input() context: string;

    /**
     * Cancel event. Fired when the user cancels editing the user.
     *
     * @event PLUserEditComponent#cancel
     */
    @Output() readonly cancel = new EventEmitter<any>();

    updateErrors$ = new Subject<any>();

    mayAssumeUser = false;

    _state: any = {
        flags: {
            DEBUG: 0,
        },
        componentName: 'PLUserEditComponent',
    };

    user: PLUserAccount = null;
    userRole: string;
    assignments: PLUserAssignment[];

    isSavingUser = false;
    loading = false;
    private subscriptions: any = null;
    supportEmail: String = environment.support_email;

    constructor(
        public util: PLUtilService,
        private plAssumeLoginService: PLAssumeLoginService,
        private plMay: PLMayService,
        private plCurrentUserService: CurrentUserService,
        private plUserService: PLUserService,
    ) {
    }

    ngOnInit(): void {
        this.loading = true;

        this.util.initDebugFlags(this._state, (state: any) => {
            state.context = this.context;

            // tslint:disable-next-line: deprecation
            this.subscriptions = forkJoin(
                this.plCurrentUserService.getCurrentUser().pipe(first()),
                this.plUserService.getUserOnce(this.userID),
            ).subscribe({
                next: ([currentUser, account]: [User, { user: PLUserAccount, assignments: PLUserAssignment[] }]) => {
                    this.user = account.user;
                    this.assignments = account.assignments;
                    this.userRole = this.assignments.length > 0 ? this.assignments[0].roleCode : '';
                    this.mayAssumeUser = this.user && this.user.isActive && this.plMay.assumeLogin(currentUser);

                    this.loading = false;
                },
                error: (error: any) => {
                    console.log('Exception when loading user form dependencies', error);
                    this.loading = false;
                },
            });
        });
    }

    ngOnDestroy(): void {
        if (this.subscriptions) {
            this.subscriptions.unsubscribe();
        }
    }

    assumeUser(email: string) {
        this.plAssumeLoginService.assume(email);
    }

    onCancel() {
        this.cancel.emit();
    }
}
