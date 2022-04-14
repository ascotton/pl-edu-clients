import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { PLUtilService } from '@common/services';
import { Option } from '@common/interfaces';
import { first } from 'rxjs/operators';

import {
    PLAssignmentManagerService,
    PLAssignmentProposalItem,
    PLAssignmentStatusEnum,
    PLRejectedReasonsEnum,
    StatusUpdateResults,
    ProviderRejectedReasonsEnum,
} from './pl-assignment-manager.service';

@Component({
    selector: 'pl-reject-assignments-modal',
    templateUrl: './pl-reject-assignments-modal.component.html',
    styleUrls: ['./pl-reject-assignments-modal.component.less'],
})
export class PLRejectAssignmentModalComponent implements OnInit {
    @Input() camProposal: PLAssignmentProposalItem;
    @Input() providerAssignment: any;
    @Input() orgDemandList: any[];
    @Input() selectedRows: any;
    @Input() rejectedReasonsOpts: Option[];
    @Input() onCancel: Function;
    @Input() onSaveSuccess: Function;
    @Input() onSaveError: Function;
    rejectAssignmentsFormGroup: FormGroup = new FormGroup({});
    inFlight = false;

    model: {reason: string, notes: string} = {
        reason: undefined,
        notes: undefined,
    };

    headerText: string;
    rejectDeclineVerb: string;

    constructor(
        public util: PLUtilService,
        private service: PLAssignmentManagerService,
    ) { }

    ngOnInit() {
        this.headerText = this.providerAssignment ? 'Decline Proposal' : 'Reject Proposal';
        this.rejectDeclineVerb = this.providerAssignment ? 'declining' : 'rejecting';
    }

    onClickCancel() {
        this.onCancel();
    }

    onClickReject() {
        if (this.camProposal) {
            const notes = {
                pl_rejected_other_reason: (this.model.reason === PLRejectedReasonsEnum.OTHER) && this.model.notes,
            };
            const reason = {
                pl_rejected_reason: this.model.reason,
                ...(notes.pl_rejected_other_reason && notes),
            };
            const msg = 'reject cam proposal';
            this.inFlight = true;
            this.service.rejectSingleProposal(
                this.orgDemandList,
                this.selectedRows,
                this.camProposal,
                reason,
            )
            .pipe(first())
            .subscribe(
                (res: StatusUpdateResults) => {
                    this.inFlight = false;
                    this.util.log(`${msg} SUCCESS`, { res, STATE: this });
                    if (res.saved.length) {
                        this.onSaveSuccess(res.saved[0]);
                    } else {
                        this.onSaveError(res.failed[0]);
                    }

                },
                (err: any) => {
                    this.inFlight = false;
                    this.onSaveError(err);
                },
            );
        } else {
            const notes = {
                provider_declined_other_reason: (this.model.reason === ProviderRejectedReasonsEnum.OTHER)
                    && this.model.notes,
            };
            const reason = {
                provider_declined_reason: this.model.reason,
                ...(notes.provider_declined_other_reason && notes),
            };
            const msg = 'decline provider assignment';
            this.service.updateProposalStatus(
                this.providerAssignment.uuid,
                PLAssignmentStatusEnum.PROVIDER_REJECTED,
                reason,
            )
            .pipe(first())
            .subscribe(
                (res: any) => {
                    this.util.log(`${msg} SUCCESS`, { res, STATE: this });
                    this.onSaveSuccess(res);
                },
                (err: any) => {
                    this.util.errorLog(`${msg} ERROR`, { err, STATE: this });
                    this.onSaveError(err);
                },
            );
        }
    }

    getNotesChars() {
        return this.service.getCharsLength(this.model.notes);
    }

    isReasonOther() {
        return this.model.reason === PLRejectedReasonsEnum.OTHER;
    }
}

const TOAST_TIMEOUT = 5000;
