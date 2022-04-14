import { Component, OnDestroy, OnInit } from '@angular/core';
import { User } from '@modules/user/user.model';
import { finalize } from 'rxjs/operators';

import { Option } from '@common/interfaces';

import { PLUtilService, PLComponentStateInterface } from '@common/services';

import { PLUserAssignment } from '@common/services/user-assignments/pl-user-assignment';
import { PLUserService, PLUserAccount } from '../pl-user.service';

interface UserViewModel {
    account: PLUserAccount;
    assignments: PLUserAssignment[];
    isActiveModel: string; // 'true' | 'false';
    isUpdatingActiveStatus: boolean;
    roles: string[];
}

@Component({
    selector: 'pl-users',
    templateUrl: './pl-users.component.html',
    styleUrls: ['./pl-users.component.less'],
})
export class PLUsersComponent implements OnInit, OnDestroy {
    _state: PLComponentStateInterface;
    private classname = 'PLUsersComponent';

    userFormUserId: string | null = null;
    isUserFormVisible = false;

    currentUser: User = {};
    users: UserViewModel[] = [];

    total: number;
    loading = false;

    filterOptsActive: Option[] = [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
    ];

    filterSelectOpts: any[] = [
        { value: 'full_name', label: 'Name', defaultVisible: true },
        { value: 'email__icontains', label: 'Email', defaultVisible: true },
        { value: 'username__icontains', label: 'Username', defaultVisible: true },
        { value: 'is_active', label: 'Active', defaultVisible: true, selectOpts: this.filterOptsActive },
        {
            value: 'group__in',
            label: 'Role',
            defaultVisible: true,
            selectOptsMulti: [
                { value: 'CustomerAdmin', label: 'CustomerAdmin' },
                { value: 'CustomerBasic', label: 'CustomerBasic' },
                { value: 'Provider', label: 'Provider' },
                { value: 'LeadClinician', label: 'LeadClinician' },
            ],
        },
    ];
    private readonly groupsToShow = ['CustomerAdmin', 'CustomerBasic', 'Provider', 'LeadClinician'];
    private readonly rolesToShow = {
        'customer-admin': 'CustomerAdmin',
        'customer-basic': 'CustomerBasic',
        provider: 'Provider',
        lead: 'LeadClinician',
    };

    selectOptsActive: Option[] = [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
    ];

    private subscriptions: any = null;
    // Preserve the most recent table query parameters so we can re-query them
    // after a user has been updated or created.
    private tableQueryCache: any = {};

    constructor(
        public util: PLUtilService,
        private plUserService: PLUserService,
    ) {
    }

    ngOnInit() {
        this._state = this.util.initComponent({
            name: this.classname,
            fn: (state, done) => {
                this.currentUser = state.currentUser;
                done();
            },
        });
    }

    ngOnDestroy(): void {
        if (this.subscriptions) {
            this.subscriptions.unsubscribe();
        }
    }

    onQuery(query: any): void {
        this.tableQueryCache = query;

        this.query(query);
    }

    private query(query: any): void {
        this.loading = true;

        const params = {
            ...query,
            group__in: query.group__in || this.groupsToShow.join(','),
        };

        this.plUserService
            .getUsersOnce(params)
            .pipe(finalize(() => (this.loading = false)))
            // tslint:disable-next-line: ter-arrow-parens
            .subscribe(results => {
                this.users = results.users.map(({ user, assignments }) => ({
                    assignments,
                    account: user,
                    isActiveModel: user.isActive.toString(),
                    isUpdatingActiveStatus: false,
                    roles: [...new Set(assignments.map(a => a.roleCode))],
                }));
                this.total = results.totalCount;
            });
    }

    visibleRoles(roles: string[]): string {
        const roleCodes = Object.keys(this.rolesToShow);

        return roles
            .filter(r => roleCodes.includes(r))
            .map(r => this.rolesToShow[r])
            .join(', ');
    }

    selectUser(user: UserViewModel): void {
        this.userFormUserId = user.account.id;
        this.isUserFormVisible = true;
    }

    onCancel() {
        this.userFormUserId = null;
        this.isUserFormVisible = false;
    }
}
