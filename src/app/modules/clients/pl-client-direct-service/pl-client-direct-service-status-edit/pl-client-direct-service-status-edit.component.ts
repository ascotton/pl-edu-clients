import { Component, Input, ChangeDetectorRef} from '@angular/core';
import { FormGroup  } from '@angular/forms';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLClientStudentDisplayService } from '@root/index';

import { PLStatusDisplayService } from '@common/services/';
import { SvgInlineNgPluginService } from '@root/src/build/svg-inline-ng-plugin.service';

import { PL_CLIENT_SERVICE_STATUS, PL_CLIENT_SERVICE_COMPLETED_REASON, PL_CLIENT_SERVICE_CANCELLED_REASON } from '@common/enums';
import { Option, PLDirectServiceInterface } from '@common/interfaces';


// For the UI, status displayed differs a little from the status in PL_CLIENT_SERVICE_STATUS
enum StatusAlias {
    IN_PROCESS = 'resume',
    COMPLETED = 'complete',
    CANCELLED = 'discontinue',
}

interface ModelFormat {
    status?: PL_CLIENT_SERVICE_STATUS;
    reason?: string;
    notes?: string;
}

@Component({
    selector: 'pl-client-direct-service-status-edit',
    templateUrl: './pl-client-direct-service-status-edit.component.html',
    styleUrls: ['./pl-client-direct-service-status-edit.component.less'],
})
export class PLClientDirectServiceStatusEditComponent {

    @Input() onSubmit: Function;
    @Input() onCancel: Function;
    @Input() originalStatus: any;
    @Input() statusDot: string;

    model: ModelFormat = {};
    directServiceFormGroup: FormGroup = new FormGroup({});

    statusAlias: string;
    currentUser: User;

    submitting = false;
    statusDescription = '';
    validateClientStatus = false;

    statusOptions: Option[];
    alarmClockSVG: string;

    readonly cancelledReasonOptions: Option[] = [
        { value: PL_CLIENT_SERVICE_CANCELLED_REASON.STUDENT_REMOVED_BY_SCHOOL, label: 'School removed student from PL caseload' },
        { value: PL_CLIENT_SERVICE_CANCELLED_REASON.STUDENT_MOVED_OUT, label: 'Student moved out of district' },
        { value: PL_CLIENT_SERVICE_CANCELLED_REASON.OTHER, label: 'Other' },
    ];

    readonly completedReasonOptions: Option[] = [
        { value: PL_CLIENT_SERVICE_COMPLETED_REASON.STUDENT_EXITED, label: 'Student exited from service' },
        { value: PL_CLIENT_SERVICE_COMPLETED_REASON.END_OF_YEAR, label: 'End of year' },
        { value: PL_CLIENT_SERVICE_COMPLETED_REASON.OTHER, label: 'Other' },
    ];

    get modalHeaderText(): string {
        const clientStudentCapital = PLClientStudentDisplayService.get(this.currentUser, { capitalize: true });
        return `Change ${clientStudentCapital} Status`;
    };

    constructor(private plStatusDisplayService: PLStatusDisplayService,
        private svgInlineNgPluginService: SvgInlineNgPluginService,
        private store: Store<AppStore>,
        private cdref: ChangeDetectorRef) {
        store.select('currentUser')
            .subscribe((user: any) => {
                this.currentUser = user;
            });
        this.alarmClockSVG = svgInlineNgPluginService.svgs['alarm-clock'].html;
        this.alarmClockSVG = this.alarmClockSVG.replace('<svg ', '<svg height="11" width="11" ');
    }

    ngOnInit() {
        this.model.status = this.originalStatus.value;
        this.statusDescription =
            this.plStatusDisplayService.getDescriptionForStatus(`DirectService_${this.model.status.toUpperCase()}`);
        const originalLabel = this.originalStatus.label;
        const statusShape =
            this.plStatusDisplayService.getShapeForStatus(`DirectService_${this.model.status.toUpperCase()}`);
        if (statusShape === 'clock') {
            this.originalStatus.label = `<span style="fill:#4c4f52" class="margin-r">${this.alarmClockSVG}</span>`;
        } else {
            this.originalStatus.label = `<span class="${statusShape} margin-r"></span>`;
        }
        this.originalStatus.label += `<span class="bold">${originalLabel}<span>`;

        this.statusOptions = [this.originalStatus];
        if (this.model.status !== PL_CLIENT_SERVICE_STATUS.COMPLETED) {
            this.statusOptions.push({
                value: PL_CLIENT_SERVICE_STATUS.COMPLETED,
                label: this.plStatusDisplayService.getLabelForStatus('DirectService_COMPLETED')
            });
        }
        if (this.model.status !== PL_CLIENT_SERVICE_STATUS.CANCELLED) {
            this.statusOptions.push({
                value: PL_CLIENT_SERVICE_STATUS.CANCELLED,
                label: this.plStatusDisplayService.getLabelForStatus('DirectService_CANCELLED')
            });
        }
        if (this.model.status === PL_CLIENT_SERVICE_STATUS.COMPLETED || this.model.status === PL_CLIENT_SERVICE_STATUS.CANCELLED) {
            this.statusOptions.push({
                value: PL_CLIENT_SERVICE_STATUS.IN_PROCESS,
                label: this.plStatusDisplayService.getLabelForStatus('DirectService_IN_PROCESS')
            });
        }
    }

    ngAfterContentChecked() {
        this.cdref.detectChanges();
    }

    cancel() {
        this.onCancel();
    }

    submit() {
        this.submitting = true;
        var data = this.prepareData();
        this.onSubmit(data);
    }

    onStatusChoiceChange(event: any) {
        this.statusDescription = this.plStatusDisplayService.getDescriptionForStatus(
            `DirectService_${this.model.status.toUpperCase()}`
        );
        this.resetReasonAndNotes();
        this.setStatusAlias();
    }

    onNotesChange(event: any) {
        if(!this.model.notes.trim().length) {
            this.model.notes = '';
        }
    }

    onToggleValidationStatus() {
        this.validateClientStatus = !this.validateClientStatus;
    }

    isStatusCompleted(): boolean {
        return this.model.status === PL_CLIENT_SERVICE_STATUS.COMPLETED;
    }

    isStatusCancelled(): boolean {
        return this.model.status === PL_CLIENT_SERVICE_STATUS.CANCELLED;
    }

    isSameStatus(): boolean {
        return this.model.status === this.originalStatus.value;
    }

    shouldShowReason(): boolean {
        return !this.isSameStatus() && (this.isStatusCompleted() || this.isStatusCancelled());
    }

    isReasonOther(): boolean {
       return this.model.reason === PL_CLIENT_SERVICE_COMPLETED_REASON.OTHER || this.model.reason == PL_CLIENT_SERVICE_CANCELLED_REASON.OTHER;
    }

    private prepareData(): PLDirectServiceInterface {
        const temp: any = {};

        if (this.isStatusCompleted() && !this.isReasonOther()) {
            temp.completedReason = this.model.reason;
        }
        if (this.isStatusCompleted() && this.isReasonOther()) {
            temp.completedReason = this.model.reason;
            temp.completedOtherReason = this.model.notes.trim();
        }
        if (this.isStatusCancelled() && !this.isReasonOther()) {
            temp.cancelledReason = this.model.reason;
        }
        if (this.isStatusCancelled() && this.isReasonOther()) {
            temp.cancelledReason = this.model.reason;
            temp.cancelledOtherReason = this.model.notes.trim();
        }

        const directService = {
            status: this.model.status,
            completedReason: null,
            completedOtherReason: null,
            cancelledReason: null,
            cancelledOtherReason: null,
            ...temp,
        } as PLDirectServiceInterface;

        return directService;
    }

    private setStatusAlias() {
        switch (this.model.status) {
            case PL_CLIENT_SERVICE_STATUS.COMPLETED:
                this.statusAlias = StatusAlias.COMPLETED;
                break;

            case PL_CLIENT_SERVICE_STATUS.CANCELLED:
                this.statusAlias = StatusAlias.CANCELLED;
                break;

            case PL_CLIENT_SERVICE_STATUS.IN_PROCESS:
                this.statusAlias = StatusAlias.IN_PROCESS;
                break;
        }
    }

    private resetReasonAndNotes() {
        this.model.reason = undefined;
        this.model.notes = undefined;
    }

}
