import { Component, Input, Output,  EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { FormGroup } from '@angular/forms';
import { PLAddReferralsGraphQLService } from '../pl-add-referrals-graphql.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'pl-referral-duplicate',
    templateUrl: './pl-referral-duplicate.component.html',
    styleUrls: ['./pl-referral-duplicate.component.less', '../pl-add-referrals.component.less']
})
export class PLReferralDuplicateComponent implements OnDestroy, OnInit {

    @Input() clientOriginal: any = {};
    @Input() originalIndex: number = -1;
    @Input() clientsDuplicates: any[] = [];
    @Input() referralOriginal: any = {};
    @Output() useExisting: EventEmitter <any> = new EventEmitter();
    @Output() useUpdate: EventEmitter <any> = new EventEmitter();

    currentUser: User;
    destroyed$ = new Subject<boolean>();
    clientDuplicateMessages = {
        same_id_no_transfer: 'A student with the same ID already exists. Use existing student or modify the ID for the student you are adding.',
        same_id_dob_no_transfer: 'A student with the same DOB and ID already exists. Use the existing student or modify the ID for the student you are adding.',
        same_id_fn_no_transfer: 'A student with the same First Name and ID already exists. Use the existing student or modify the ID for the student you are adding.',
        same_id_ln_no_transfer: 'A student with the same Last Name and ID already exists. Use the existing student or modify the ID for the student you are adding.',
        same_id_fn_ln_no_transfer: 'A student with the same First and Last Name and ID already exists. Use the existing student or modify the ID for the student you are adding.',
        same_id_ln_dob_no_transfer: 'A student with the same Last Name, ID and DOB already exists. Use the existing student or modify the ID for the student you are adding.',
        same_id_fn_dob_no_transfer: 'A student with the same First Name, ID and DOB already exists. Use the existing student or modify the ID for the student you are adding.',
        same_id_transfer: 'A student with the same ID already exists at a different location. Use the existing student or modify the ID for the student you are adding. If you select the existing student they will be transferred to the new location.',
        same_id_dob_transfer: 'A student with the same ID and DOB already exists at a different location. Use the existing student or modify the ID for the student you are adding. If you select the existing student they will be transferred to the new location.',
        same_id_fn_transfer: 'A student with the same First Name and ID already exists at a different location. Use the existing student or modify the ID for the student you are adding. If you select the existing student they will be transferred to the new location.',
        same_id_ln_transfer: 'A student with the same Last Name and ID already exists at a different location. Use the existing student or modify the ID for the student you are adding. If you select the existing student they will be transferred to the new location.',
        same_id_fn_ln_transfer: 'A student with the same First and Last Name and ID already exists at a different location. Use the existing student or modify the ID for the student you are adding. If you select the existing student they will be transferred to the new location.',
        same_id_ln_dob_transfer: 'A student with the same Last Name, ID and DOB already exists at a different location. Use the existing student or modify the ID for the student you are adding. If you select the existing student they will be transferred to the new location.',
        same_id_fn_dob_transfer: 'A student with the same First Name, ID and DOB already exists at a different location. Use the existing student or modify the ID for the student you are adding. If you select the existing student they will be transferred to the new location.',
        same_fn_ln_dob_no_transfer: 'A student with the same First and Last Name and DOB already exists. Use the existing student or create a new student if this is not a duplicate.',
        same_fn_ln_no_transfer: 'A student with the same First and Last Name already exists. Use the existing student or create a new student if this is not a duplicate.',
        same_fn_ln_dob_transfer: 'A student with the same First and Last Name and DOB already exists at a different location. Use the existing student or create a new student if this is not a duplicate. If you select the existing student they will be transferred to the new location.',
        same_fn_ln_transfer: 'A student with the same First and Last Name already exists at a different location. Use the existing student or create a new student if this is not a duplicate. If you select the existing student they will be transferred to the new location.',
    };
    errorMessageIdInUse = 'This ID is already in use';
    errorMessageIdRequired = 'ID is required';
    useExistingButtonText = 'Use Existing';
    isExternalIdInUse = false;
    clientOriginalId = '';
    formGroup: FormGroup = new FormGroup({});
    loading = false;

    TOAST_TIMEOUT = 5000;

    constructor(
        private store: Store<AppStore>,
        private graphQLService: PLAddReferralsGraphQLService,
        private toastr: ToastrService,
    ) {
        store.select('currentUser').pipe(takeUntil(this.destroyed$))
            .subscribe((user: any) => {
                this.currentUser = user;
            });
    }

    ngOnInit() {
        this.clientOriginalId = this.clientOriginal.externalId;
        this.useExistingButtonText =
            this.clientOriginal.location === this.clientsDuplicates[this.originalIndex].locations[0].name ?
            'Use Existing' : 'Use Existing and Transfer';
    }

    ngOnDestroy() {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    selectExisting(existing: any) {
        this.useExisting.emit({ existing: { ...existing }, originalIndex: this.originalIndex });
    }

    selectUpdate() {
        this.useUpdate.emit({ update: this.clientOriginal, originalIndex: this.originalIndex });
    }

    isClientIdInDupes(id: string) {
        return this.clientsDuplicates.map(c => c.externalId).includes(id);
    }

    async checkClient() {
        if (!this.loading) {
            try {
                this.loading = true;
                const client = { ...this.clientOriginal, externalId: this.clientOriginalId };
                const referral = { ...this.referralOriginal };
                delete client.location;
                const { createReferrals } = await this.graphQLService.uploadData([{ client, referral }], true, 1);
                const isDuplicate = createReferrals.results.length &&
                    createReferrals.results[0].error &&
                    createReferrals.results[0].error.code === 'duplicate_referral';
                const isExternalIdInUse = createReferrals.results.length &&
                    createReferrals.results[0].error &&
                    createReferrals.results[0].error.code === 'possible_duplicate_client' &&
                        createReferrals.results[0].error.clients[0].externalId === this.clientOriginalId;
                if (isDuplicate || isExternalIdInUse) {
                    this.isExternalIdInUse = true;
                } else {
                    this.isExternalIdInUse = false;
                    this.clientOriginal = client;
                    this.selectUpdate();
                }
            } catch (error) {
                this.toastr.error(`Unexpected Problem`, '❌ FAILED', {
                    positionClass: 'toast-bottom-right',
                    timeOut: this.TOAST_TIMEOUT,
                });
            }
            this.loading = false;
        }
    }

    getClientDuplicateMessage(original: any, duplicate: any) {
        if (
            original.externalId === duplicate.externalId &&
            original.location === duplicate.locations[0].name
        ) {
            return this.getMessageSameIdNoTransfer(original, duplicate);
        }

        if (
            original.externalId === duplicate.externalId &&
            original.location !== duplicate.locations[0].name
        ) {
            return this.getMessageSameIdTransfer(original, duplicate);
        }

        if (
            original.externalId !== duplicate.externalId &&
            original.location === duplicate.locations[0].name
        ) {
            return this.getMessageDifferentIdNoTransfer(original, duplicate);
        }

        if (
            original.externalId !== duplicate.externalId &&
            original.location !== duplicate.locations[0].name
        ) {
            return this.getMessageDifferentIdTransfer(original, duplicate);
        }
    }

    getMessageDifferentIdTransfer(original: any, duplicate: any): string {
        if (
            original.firstName === duplicate.firstName &&
            original.lastName === duplicate.lastName &&
            original.birthday === duplicate.birthday
        ) {
            return this.clientDuplicateMessages.same_fn_ln_dob_transfer;
        }

        if (
            original.firstName === duplicate.firstName &&
            original.lastName === duplicate.lastName
        ) {
            return this.clientDuplicateMessages.same_fn_ln_transfer;
        }
    }

    getMessageDifferentIdNoTransfer(original: any, duplicate: any): string {
        if (
            original.firstName === duplicate.firstName &&
            original.lastName === duplicate.lastName &&
            original.birthday === duplicate.birthday
        ) {
            return this.clientDuplicateMessages.same_fn_ln_dob_no_transfer;
        }

        if (
            original.firstName === duplicate.firstName &&
            original.lastName === duplicate.lastName
        ) {
            return this.clientDuplicateMessages.same_fn_ln_no_transfer;
        }
    }

    getMessageSameIdTransfer(original: any, duplicate: any): string {
        if (
            original.firstName === duplicate.firstName &&
            original.birthday === duplicate.birthday
        ) {
            return this.clientDuplicateMessages.same_id_fn_dob_transfer;
        }

        if (
            original.lastName === duplicate.lastName &&
            original.birthday === duplicate.birthday
        ) {
            return this.clientDuplicateMessages.same_id_ln_dob_transfer;
        }

        if (
            original.lastName === duplicate.lastName &&
            original.firstName === duplicate.firstName
        ) {
            return this.clientDuplicateMessages.same_id_fn_ln_transfer;
        }

        if (
            original.lastName === duplicate.lastName
        ) {
            return this.clientDuplicateMessages.same_id_ln_no_transfer;
        }

        if (
            original.firstName === duplicate.firstName
        ) {
            return this.clientDuplicateMessages.same_id_fn_transfer;
        }

        if (
            original.birthday === duplicate.birthday
        ) {
            return this.clientDuplicateMessages.same_id_dob_transfer;
        }

        return this.clientDuplicateMessages.same_id_transfer;
    }

    getMessageSameIdNoTransfer(original: any, duplicate: any): string {
        if (
            original.firstName === duplicate.firstName &&
            original.birthday === duplicate.birthday
        ) {
            return this.clientDuplicateMessages.same_id_fn_dob_no_transfer;
        }

        if (
            original.lastName === duplicate.lastName &&
            original.birthday === duplicate.birthday
        ) {
            return this.clientDuplicateMessages.same_id_ln_dob_no_transfer;
        }

        if (
            original.lastName === duplicate.lastName &&
            original.firstName === duplicate.firstName
        ) {
            return this.clientDuplicateMessages.same_id_fn_ln_no_transfer;
        }

        if (
            original.lastName === duplicate.lastName
        ) {
            return this.clientDuplicateMessages.same_id_ln_no_transfer;
        }

        if (
            original.firstName === duplicate.firstName
        ) {
            return this.clientDuplicateMessages.same_id_fn_no_transfer;
        }

        if (
            original.birthday === duplicate.birthday
        ) {
            return this.clientDuplicateMessages.same_id_dob_no_transfer;
        }

        return this.clientDuplicateMessages.same_id_no_transfer;
    }
}
