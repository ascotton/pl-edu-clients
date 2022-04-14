import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { environment } from '@environments/environment';
// NgRx Store
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { selectIsTechSupport } from '@common/store';
import {
    PLFetchLicenses,
    PLFetchPlatformUsers,
    selectPlatformUsers,
    selectPlatformUsersTotal,
    selectPlatformUsersLoding,
    PLDeactivatePlatformUser,
    PLSendSetPasswordEmail,
} from '../store';
// RxJs
import { BehaviorSubject, Subject, combineLatest, Observable } from 'rxjs';
import { takeUntil, tap, withLatestFrom, startWith, filter, map } from 'rxjs/operators';
// Services
import { PLDesignService } from '@common/services';
import { PLSchoolStaffService, PLTrainingUser, PLPlatformHelperService } from '../services';
import { PLPlatformUser } from '../models';
import { PLConfirmDialog2Component } from '@common/components';
import { MatDialog } from '@angular/material/dialog';

@Component({
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.less']
})
export class UserManagementComponent implements OnInit, OnDestroy {

    private destroyed$ = new Subject<boolean>();
    view: string;
    isActive$ = new BehaviorSubject(true);
    onQuery$: BehaviorSubject<{
        pageIndex: number;
        pageSize: number;
        sort: string;
        direction: string;
    }> = new BehaviorSubject(null);
    form: FormGroup;
    reset: boolean;
    columns: any = {
        last_name: 'Last Name',
        first_name: 'First Name',
        occupation: 'User Type',
    };
    selectedItem: { loading: boolean; data: PLTrainingUser };
    isTechSupport$ = this.store$.select(selectIsTechSupport).pipe(
        tap(isSS => this.columns = isSS ? {
            last_name: 'Last Name',
            first_name: 'First Name',
            occupation: 'User Type',
            status: 'Status',
            actions: '',
        } : {
            last_name: 'Last Name',
            first_name: 'First Name',
            occupation: 'User Type',
            actions: '',
        }),
    );
    users$ = this.store$.select(selectPlatformUsers);
    userTotal$ = this.store$.select(selectPlatformUsersTotal);
    loading$ = this.store$.select(selectPlatformUsersLoding);

    data: { loading: boolean; results: PLTrainingUser[]; count: number } = {
        loading: false,
        results: [],
        count: 0,
    };

    constructor(
        private store$: Store<AppStore>,
        private dialog: MatDialog,
        public plDesign: PLDesignService,
        private plSS: PLSchoolStaffService,
        private helper: PLPlatformHelperService,
        private fb: FormBuilder,
    ) { }

    ngOnInit() {
        // Build Search Form
        this.form = this.fb.group({
            lastName: [''],
            firstName: [''],
        }, { updateOn: 'submit' });

        const reFetch$ = this.helper.reFetch().pipe(
            tap(() => {
                this.reset = !this.reset;
                this.form.setValue({ lastName: '', firstName: '' });
            }));
        const search$ = this.form.valueChanges.pipe(
            startWith(this.form.value),
            withLatestFrom(this.onQuery$),
            tap(() => this.reset = !this.reset),
            filter(([ _, query ]) => query === null || query.pageIndex === 0),
            map(([ value ]) => value),
            takeUntil(this.destroyed$),
        );

        combineLatest([reFetch$, this.onQuery$, search$, this.isActive$]).pipe(
            withLatestFrom(reFetch$, this.onQuery$),
            takeUntil(this.destroyed$),
        ).subscribe(([[_, ___, search, isActive], __, query]) => {
            let ordering = '';
            if (search.firstName || search.lastName) {
                this.view = 'filter';
            } else {
                this.view = this.isActive$.value ? 'active' : 'deactivated';
            }
            if (query && query.sort) {
                ordering = query.sort;
                if (['last_name', 'first_name'].includes(ordering)) {
                    ordering = `user__${ordering}`;
                }
                ordering = `${query.direction === 'desc' ? '-' : ''}${ordering}`;
            }
            this.store$.dispatch(PLFetchLicenses({ }));
            this.store$.dispatch(PLFetchPlatformUsers({
                options: {
                    ordering,
                    search: { ...this.form.value, isActive },
                    page: query ? query.pageIndex + 1 : 1,
                    limit: query ? query.pageSize : this.plDesign.settings.paginator.size,
                },
            }));
        });
    }

    ngOnDestroy() {
        this.onQuery$.complete();
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    clearFilters() {
        this.form.reset();
    }

    onExpand(item: PLTrainingUser) {
        this.selectedItem = !item ?
            { loading: false, data: item } :
            { ...this.selectedItem, data: { ...item } };
    }

    onAction(event: { action: string; user: PLTrainingUser }) {
        const { action, user } = event;
        switch (action) {
            case 'activate':
                this.openConfirm(`Deactivate Confirmation`,
                    `<strong>Are you sure you want to deactivate: ${user.first_name} ${user.last_name}?</strong><br/>
                    This user will lose access to the platform. However, if you choose to reactivate this user at a later time, their settings and queues will be restored.`,
                    'Proceed', 'Cancel')
                .subscribe((res) => {
                    if (res === 'yes') {
                        this.store$.dispatch(PLDeactivatePlatformUser({ uuid: user.uuid }));
                    }
                });
                break;
            case 'resend':
                this.openConfirm(`Confirm email address`,
                    `A new set password email will be sent to:<br/>
                    <strong>${user.email}</strong><br/>
                    If this email is incorrect, please contact 
                    <a target="_blank" href="mailto:${environment.support_email}">Technical Support</a> 
                    to correct the email address.`,
                    'Send Email', 'Cancel')
                .subscribe((res) => {
                    if (res === 'yes') {
                        this.store$.dispatch(PLSendSetPasswordEmail({ uuid: user.uuid }));
                    }
                });
                break;
        }
    }

    private openConfirm<T>(title: string, message: string, yes = 'YES', no = 'NO'): Observable<any> {
        return this.dialog.open(PLConfirmDialog2Component, {
            data: {
                title,
                message,
                options: [
                    {
                        label: no,
                    },
                    {
                        label: yes,
                        value: 'yes',
                        color: 'accent',
                        type: 'raised',
                    },
                ],
            },
            maxWidth: 500,
        }).afterClosed();
    }
}
