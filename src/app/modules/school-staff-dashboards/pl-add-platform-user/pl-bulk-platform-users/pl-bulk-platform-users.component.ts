import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    OnChanges,
    SimpleChanges,
} from '@angular/core';

import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { selectSelectedOrganization } from '../../store';
import { map } from 'rxjs/operators';

import { MatHorizontalStepper } from '@angular/material/stepper';
import { StepperSelectionEvent, STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { PLBulkUploadService } from '../../services';

@Component({
    selector: 'pl-bulk-platform-users',
    templateUrl: './pl-bulk-platform-users.component.html',
    styleUrls: ['./pl-bulk-platform-users.component.less'],
    providers: [{
        provide: STEPPER_GLOBAL_OPTIONS,
        useValue: { displayDefaultIndicatorType: false },
    }],
})
export class PLBulkPlatformUserComponent implements OnInit, OnChanges {

    downloaded: boolean;
    hasData: boolean;
    @Input() progress: { total: number; completed: number; inProgress: boolean; };
    @Input() currentStep = 'download';
    @Output() readonly currentStepChange: EventEmitter<string> = new EventEmitter();
    @Output() readonly changed: EventEmitter<{ data: string[][], header: string[] }> = new EventEmitter();
    @ViewChild(MatHorizontalStepper, { static: true }) stepper: MatHorizontalStepper;

    downloadTemplate$ = this.store$.select(selectSelectedOrganization)
        .pipe(
            map(org => `/c/assets/${org.isGroupOrganization ?
                'Bulk Activation Spreadsheet' : 
                'District Bulk Activation Spreadsheet'
                }.xlsx`)
        );

    constructor(
        private store$: Store<AppStore>,
        private plBulk: PLBulkUploadService) { }

    ngOnInit() {
        this.currentStepChange.emit(this.currentStep);
    }

    ngOnChanges(changes: SimpleChanges) {
        const { currentStep } = changes;
        if (currentStep && !currentStep.firstChange) {
            this.changeStep(this.currentStep);
        }
    }

    moveStep(event: StepperSelectionEvent) {
        this.currentStep = event.selectedStep.state;
        this.currentStepChange.emit(this.currentStep);
    }

    changeStep(stepName: string) {
        this.stepper.selectedIndex = this.stepper.steps.toArray()
                .findIndex(s => s.state === stepName);
    }

    onFileChange(event: any) {
        this.plBulk.checkFile(event, { sheet: 1 })
            .subscribe(({ data, header, error }) => {
                this.hasData = !error;
                if (!error) {
                    this.changed.emit({ data, header });
                    setTimeout(() => this.next(), 200);
                }
            });
    }

    downloadExisting() {
        // TODO: Add API to download CSV
        this.download();
    }

    download() {
        this.downloaded = true;
        this.next();
    }

    previous() {
        this.stepper.previous();
    }

    next() {
        this.stepper.next();
    }
}
