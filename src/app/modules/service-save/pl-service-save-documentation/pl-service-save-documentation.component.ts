import { Component, OnInit, OnChanges } from '@angular/core';
import { CLINICAL_PRODUCT_TYPE } from '@root/src/app/common/constants';
import { serviceEvalStageOptions } from '@root/src/app/common/services/pl-client-service';

import { PLServiceSaveService } from '../pl-service-save.service';

@Component({
    selector: 'pl-service-save-documentation',
    templateUrl: './pl-service-save-documentation.component.html',
    styleUrls: ['./pl-service-save-documentation.component.less'],
})
export class PLServiceSaveDocumentationComponent implements OnInit, OnChanges {

    serviceFormVals: any;
    isEdit = false;
    formCtrl: any;
    revalidate = false;
    showDocs: any = {};

    permissionObtained: boolean;
    recordingObtainedOpts: any[] = [
        { value: true, label: 'Permission was granted to record this student' },
        { value: false, label: 'Permission was not granted to record this student' },
    ];
    serviceStageOpts = serviceEvalStageOptions;
    clinicalProductTypes = CLINICAL_PRODUCT_TYPE;

    constructor(private plServiceSave: PLServiceSaveService) { }

    ngOnInit() {
        this.plServiceSave.getSharedData()
            .subscribe((data: any) => {
                this.serviceFormVals = data.serviceFormVals;

                if (data.referral && data.referral.dueDate) {
                    this.serviceFormVals.dueDate = data.referral.dueDate.slice(0, 10);
                }

                this.isEdit = data.isEdit;
                this.formCtrl = data.serviceSaveDocumentationForm;
                this.revalidate = data.revalidateStep.documentation;
                this.showDocs = data.showDocs;

                this.validate();
            });
        this.validate();
    }

    ngOnChanges(changes: any) {
        this.validate();
    }

    validate() {
        // Need timeout for form valid state to update.
        setTimeout(() => {
            const valid = (this.showDocs.dueDate && !this.serviceFormVals.dueDate);

            this.plServiceSave.onChangeStepValid({ valid: !valid, stepKey: 'documentation' });
        }, 250);
    }

    onChangeDueDate() {
        this.validate();
    }

    onChangeMeetingDate() {
        this.validate();
    }

    isPA(): boolean {
        return this.serviceFormVals.providerType === 'pa' &&
            this.serviceFormVals.serviceCategory === 'evaluation_with_assessment';
    }
}
