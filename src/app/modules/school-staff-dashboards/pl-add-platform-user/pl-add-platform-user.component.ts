import * as moment from 'moment';
import {
    Component,
    OnInit,
    OnDestroy,
    HostListener,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
// Ng Material
import { MatDialog } from '@angular/material/dialog';
// NgRx Store
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { AppStore } from '@app/appstore.model';
import {
    selectLicenses,
    selectOcupations,
    selectPlatformUserSaveProgress,
    selectPlatformUserSaveInProgress,
    PLAddSinglePlatformUser,
    PLFetchLicenses,
    PLPlatformUserSaveCompleted,
    PLAddMultiplePlatformUser,
    selectCSContact,
} from '../store';
// RxJs
import { Observable, of } from 'rxjs';
import { withLatestFrom, takeUntil, map } from 'rxjs/operators';

import { Option } from '@common/interfaces';
import { PLErrorNotification } from '@common/store';
import { PLConfirmDialog2Component, PLDestroyComponent } from '@common/components';
import { PLUploadSummaryComponent } from './pl-upload-summary/pl-upload-summary.component';
import {
    PLPlatformUser,
    PLLicenseType,
} from '../models';
import {
    PLPlatformUsersService,
    PLEditableColumn,
    PLEditableRow,
    PLBulkUploadService,
    PLEditableTableBuilder,
    PLTableRowError,
    PL_TABLE_ERROR_TYPE,
    PLPlatformHelperService,
    ReadOnlyFn,
} from '../services';
import { CanComponentDeactivate } from '@common/can-deactivate-guard.service';

@Component({
    selector: 'pl-add-platform-user',
    templateUrl: './pl-add-platform-user.component.html',
    styleUrls: ['./pl-add-platform-user.component.less'],
})
export class PLAddPlatformUserComponent
    extends PLDestroyComponent
    implements OnInit, OnDestroy, CanComponentDeactivate {

    bulkStep = 'download';
    view: 'single' | 'multiple' = 'single';
    multipleIcon = 'group_add';
    multipleTitle = 'Add Multiple Users';
    singleIcon = 'person_add';
    singleTitle = 'Add Single User';
    bulkColumns: PLEditableColumn[];
    // Helper Flags
    syWarning = false;
    resetForm: boolean; // TODO: What about this?

    progress$ = this.store$.select(selectPlatformUserSaveProgress);
    loading$ = this.store$.select(selectPlatformUserSaveInProgress);
    csContact$ = this.store$.select(selectCSContact);

    // Catalog Info
    licenseTypes: PLLicenseType[] = [];
    licensesBought: PLLicenseType[];
    userTypes: Option[] = [];
    backupData: string[][];
    workingData: string[][];
    headerData: string[];

    // Should these be merge?
    invalidRows: PLEditableRow<PLPlatformUser>[];
    usersToAdd: PLPlatformUser[];

    @HostListener('window:beforeunload', ['$event']) onBeforeUnload(event: any): void {
        this.canDeactivate().subscribe((canDesactivate) => {
            if (event && !canDesactivate) {
                event.preventDefault();
                event.returnValue = false;
            }
        });
    }

    constructor(
        private store$: Store<AppStore>,
        private actions$: Actions,
        private router: Router,
        private dialog: MatDialog,
        private tb: PLEditableTableBuilder,
        private bulk: PLBulkUploadService,
        private helper: PLPlatformHelperService,
        private platformUserService: PLPlatformUsersService) {
        super();
    }

    ngOnInit() {
        this.actions$.pipe(
            ofType(PLPlatformUserSaveCompleted),
            takeUntil(this.destroyed$),
        ).subscribe(({ errorMessage, multiple }) => {
            if (multiple) {
                if (!errorMessage.length && !this.invalidRows.length) {
                    this.router.navigate(['school-staff/user-management']);
                } else {
                    this.openMultipleErrorSummary(<PLPlatformUser[]>errorMessage);
                }
            } else if (!errorMessage) {
                this.resetForm = !this.resetForm;
                return;
            }
        });

        const reFetch$ = this.helper.reFetch();
        reFetch$
            .pipe(takeUntil(this.destroyed$))
            .subscribe(() => {
                this.store$.dispatch(PLFetchLicenses({}));
            });
        const licenses$ = this.store$.select(selectLicenses);
        const ocupations$ = this.store$.select(selectOcupations);
        ocupations$.pipe(
                withLatestFrom(licenses$, this.helper.SY$),
                takeUntil(this.destroyed$),
            ).subscribe(([ocupations, licenseTypes, SY]) => {
                this.syWarning = moment(SY.endDate).isBefore(moment.now());
                this.userTypes = ocupations;
                this.licenseTypes = licenseTypes;
                this.licensesBought = licenseTypes.filter(lt => lt.total_quantity);
                const isAdminReadonly: ReadOnlyFn<PLPlatformUser> = (row: PLPlatformUser) =>
                    row.occupation.includes('Administrator');
                this.bulkColumns = [
                    this.tb.createInputColumn('firstName', 'First Name', 'text',
                        {
                            validations: { duplicates: 1, required: 1 },
                            validators: [
                                Validators.maxLength(64),
                                Validators.pattern('^[A-Za-z.,\'’‘\\- ]+$'),
                            ],
                        }),
                    this.tb.createInputColumn('lastName', 'Last Name', 'text',
                        {
                            validations: { duplicates: 1, required: 1 },
                            validators: [
                                Validators.maxLength(64),
                                Validators.pattern('^[A-Za-z.,\'’‘\\- ]+$'),
                            ],
                        }),
                    this.tb.createInputColumn('email', 'Email', 'email',
                        { validations: { unique: 1, duplicates: 1, required: 1 } },
                        { width: 200 }),
                    this.tb.createSelectColumn(
                        'occupation',
                        'Occupation',
                        this.userTypes,
                        { validations: { required: 1 } },
                        { width: 150 }),
                    this.tb.createBoolenColumn('assessmentAccess', 'Assesment'),
                    this.tb.createBoolenColumn('adminAccess', 'Admin', {
                        readonly: isAdminReadonly,
                    }),
                    this.tb.createSelectColumn(
                        'licenseType',
                        'License Type',
                        this.licenseTypes.map(lt => ({ value: lt.uuid, label: lt.license_name })),
                        {
                            defaultValue: this.setLicenseType,
                            validations: { required: 1 },
                        }, { readonly: true }),
                ];
            });
    }

    canDeactivate(): Observable<boolean> {
        const warn = this.view === 'multiple' && this.bulkStep === 'review';
        if (!warn) {
            return of(true);
        }
        return this.openConfirm('Are you sure you want to leave this page?', `You will lose data if you navigate away from the current page.`)
            .pipe(map(res => res === 'yes'));
    }

    private getLicenseCount(users: PLPlatformUser[]): { [key: string]: number } {
        const adminLicense = this.getAdminLicense();
        const adminLicenses = this.licenseTypes
            .filter(l => l.is_admin)
            .map(l => l.uuid);
        const adminFlags = users.filter(user => user.adminAccess
            && !adminLicenses.includes(user.licenseType)).length;
        const dataLicenses = users.map(u => u.licenseType);
        const licensesCounts = dataLicenses.reduce((acc, value) => ({
            ...acc,
            [value]: (acc[value] || 0) + 1,
        }), {});
        if (adminFlags) {
            let adminCount = licensesCounts[adminLicense.uuid] || 0;
            adminCount = adminCount + adminFlags;
            licensesCounts[adminLicense.uuid] = adminCount;
        }
        return licensesCounts;
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

    setLicenseType = (item: PLPlatformUser): PLPlatformUser => {
        if (!!item.occupation) {
            const allowLicenses = this.platformUserService
                .getLicenses(item.occupation, this.licenseTypes);
            if (item.licenseType && !allowLicenses.find(l => l.uuid === item.licenseType)) {
                item.licenseType = '';
            }
            if (allowLicenses.length === 1) {
                item.licenseType = allowLicenses[0].uuid;
            } else {
                const license = allowLicenses.find(l => l.has_assessments === item.assessmentAccess);
                if (license) {
                    item.licenseType = license.uuid;
                }
            }
        }
        return item;
    }

    toggleView(): void {
        if (this.view ===  'multiple') {
            this.canDeactivate().subscribe((can) => {
                if (can) {
                    this.view = 'single';
                }
            });
        } else {
            this.view = 'multiple';
        }
    }

    filDataChanged(event: { data: string[][], header: string[] }) {
        this.workingData = event.data;
        this.headerData = event.header;
        this.backupData = this.workingData;
    }

    saveSingleUser(user: PLPlatformUser) {
        const license = this.licenseTypes.find(lt => lt.uuid === user.licenseType);
        let licenseName = license.license_name.trim();
        const includesPlusAssessments = licenseName.includes('Plus Assessments');
        if (includesPlusAssessments && license.has_assessments) {
            licenseName = licenseName.replace('Plus Assessments', '<strong>Plus Assessments</strong>');
        }
        const adminMsg = !license.is_admin && user.adminAccess ?
            `</br></br>You are also assigning administrative access to this user, giving this user access to license management and reporting.` : '';
        const message = `<div class="margin-b">
            You are assigning a Therapy Essentials License for ${licenseName}.</br>
            ${license.is_admin && license.license_name.toLocaleLowerCase().includes('champion') ?
                'This license type is designated for the primary administrator who will have BOTH admin access AND platform access.<br/>' : ''}
            Once activated, licenses cannot be re-assigned.
            You will have ${license.quantity_remaining - 1} remaining licenses.
            ${adminMsg}
        </div>
        <div class="margin-b">
            Do you wish to proceed?
        <div></div>`;
        const title = 'Add User Confirmation';
        this.openConfirm(title, message).subscribe((respond) => {
            if (respond === 'yes') {
                this.store$.dispatch(PLAddSinglePlatformUser({ user }));
            }
        });
    }

    setpChanged(step: string) {
        if (step === 'confirm') {
            if (!this.usersToAdd.length) {
                this.store$.dispatch(PLErrorNotification({
                    title: 'No valid data',
                    message: 'No users will be added',
                }));
                this.openMultipleErrorSummary([]);
                return;
            }
            const licensesCounts = this.getLicenseCount(this.usersToAdd);
            const licensesIds = Object.keys(licensesCounts);
            let message = '<strong>You are about to assign licenses for:</strong><br/>';
            licensesIds.forEach((id) => {
                const license = this.licenseTypes.find(l => l.uuid === id);
                if (!license) {
                    return;
                }
                message += `${licensesCounts[id]} ${license.license_name}<br/>`;
            });
            if (this.invalidRows.length) {
                message += `There are <strong>${this.invalidRows.length} users with errors</strong> who will not be activated.
                    Please download the summary of errors to be addressed for upload later.`;
            }
            this.openConfirm('Upload Summary', message, 'Activate', 'Back').subscribe((respond) => {
                if (respond === 'yes') {
                    this.store$.dispatch(PLAddMultiplePlatformUser({
                        users: this.usersToAdd,
                    }));
                } else {
                    // Updates data with latest changes for performance improvement
                    this.workingData = this.backupData;
                    this.bulkStep = 'review';
                    return;
                }
            });
        }
        this.bulkStep = step;
    }

    openMultipleErrorSummary(rows: PLPlatformUser[]) {
        const feErrorTemplate = this.invalidRows.map(row => ({
            ...row.value,
            errors: row.errors
                .filter(err => !!err.message)
                .map(err => err.message.replace(/,/g, '').replace(/\r?\n|\r/g, '').trim())
                .join(' | '),
        }));
        const beErrorTemplate = rows.map(row => ({
            ...row,
            errors: row['errors'] || 'Unknown error.',
        }));
        const csv = this.bulk.dataToCSV(
            [...feErrorTemplate, ...beErrorTemplate],
            [
                ...this.bulkColumns.filter(c => c.key !== 'licenseType'),
                this.tb.createReadOnlyColumn('errors', 'Errors'),
            ]);
        this.dialog.open(PLUploadSummaryComponent, {
            data: {
                csv,
                count: {
                    error: feErrorTemplate.length + beErrorTemplate.length,
                    success: this.usersToAdd.length - beErrorTemplate.length,
                },
            },
            maxWidth: 500,
        }).afterClosed().subscribe(() => {
            this.bulkStep = 'upload';
        });
    }

    dataValidator = (data: PLPlatformUser[]): PLTableRowError[] => {
        const licensesCounts = this.getLicenseCount(data);
        const licenseErrors: PLTableRowError[] = [];
        const adminLicense = this.getAdminLicense();
        const adminCount = data.filter(({ adminAccess }) => adminAccess).length;
        data.forEach(({ licenseType, assessmentAccess, adminAccess }, index) => {
            const license = this.licenseTypes.find(l => l.uuid === licenseType);
            if (!license) {
                licenseErrors.push({
                    index,
                    field: 'licenseType',
                    type: PL_TABLE_ERROR_TYPE.Other,
                    message: `Please select an ocupation or assessment so a license can be assigned.`,
                });
                return;
            }
            if (!license.total_quantity) {
                licenseErrors.push({
                    index,
                    // field: 'licenseType',
                    type: PL_TABLE_ERROR_TYPE.Other,
                    message: `No licenses bought for ${license.license_name}. Please delete row, and contact Customer Success if you wish to add this license.`,
                });
                return;
            }
            if (adminAccess) {
                if (!adminLicense) {
                    licenseErrors.push({
                        index,
                        field: 'adminAccess',
                        type: PL_TABLE_ERROR_TYPE.Other,
                        message: `There are no Administravite licenses`,
                    });
                } else {
                    const remainingAdmin = adminLicense.quantity_remaining - adminCount;
                    /*
                    if (remainingAdmin < 0) {
                        licenseErrors.push({
                            index,
                            field: 'adminAccess',
                            type: PL_TABLE_ERROR_TYPE.Other,
                            message: `You have only assign admin access to ${adminLicense.total_quantity} users.
                                You have ${adminLicense.quantity_remaining} left.  Please remove any excess.`,
                        });
                    }
                    */
                }
            }
            const count = licensesCounts[licenseType];
            const remaining = license.quantity_remaining - count;
            if (remaining < 0) {
                const exceed = count - license.quantity_remaining;
                licenseErrors.push({
                    index,
                    field: 'licenseType',
                    type: PL_TABLE_ERROR_TYPE.Other,
                    message: `You have ${license.quantity_remaining} ${license.license_name} licenses available. Please delete ${exceed} row${exceed > 1 ? 's' : ''} with this license and contact Customer Success if you wish to add this license.`,
                });
                return;
            }
            if (assessmentAccess && !license.has_assessments) {
                licenseErrors.push({
                    index,
                    field: 'assessmentAccess',
                    type: PL_TABLE_ERROR_TYPE.Other,
                    message: `This occupation does not have access to assessments`,
                });
                return;
            }
        });
        return licenseErrors;
    }

    private getAdminLicense(): PLLicenseType {
        const [adminLicense] = this.licenseTypes.filter(l => l.is_admin &&
            !l.license_name.toLowerCase().includes('champion'));
        return adminLicense;
    }
}
