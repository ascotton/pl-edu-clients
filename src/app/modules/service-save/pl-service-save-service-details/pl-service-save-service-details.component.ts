import { Component, Output, EventEmitter, SimpleChanges } from '@angular/core';

import { PLApiAreasOfConcernService, PLApiAssessmentsService} from '@root/index';
import { PLServiceSaveService } from '../pl-service-save.service';

@Component({
    selector: 'pl-service-save-service-details',
    templateUrl: './pl-service-save-service-details.component.html',
    styleUrls: ['./pl-service-save-service-details.component.less'],
})
export class PLServiceSaveServiceDetailsComponent {
    // @Output() onChangeValid = new EventEmitter<any>();

    serviceFormVals: any;
    isEdit: boolean = false;
    formCtrl: any;
    revalidate: boolean = false;

    areasOfConcernOpts: any[] = [];
    assessmentsUsedOpts: any[] = [];

    constructor(private plAreasOfConcern: PLApiAreasOfConcernService,
     private plAssessments: PLApiAssessmentsService,
     // private plServiceTypes: PLApiServiceTypesService,
     private plServiceSave: PLServiceSaveService) { }

    ngOnInit() {
        this.plServiceSave.getSharedData()
            .subscribe((data: any) => {
                this.serviceFormVals = data.serviceFormVals;
                this.isEdit = data.isEdit;
                this.formCtrl = data.serviceSaveServiceDetailsForm;
                this.revalidate = data.revalidateStep.serviceDetails;
                this.loadData();
                this.validate({});
            });
        // this.validate({});
    }

    ngOnChanges(changes: any) {
        this.loadData();
        this.validate({});
    }

    validate(evt: any) {
        // if (this.onChangeValid) {
            // Need timeout for form valid state to update.
            setTimeout(() => {
                let valid = true;
                if (!this.serviceFormVals.areasOfConcernIds ||
                 !this.serviceFormVals.areasOfConcernIds.length) {
                    valid = false;
                }
                // this.onChangeValid.emit({ valid: valid, stepKey: 'service-details' });
                this.plServiceSave.onChangeStepValid({ valid: valid, stepKey: 'service-details' });
            }, 250);
        // }
    }

    loadData() {
        if (this.serviceFormVals.providerType) {
            this.getAreasOfConcern();
            this.getAssessments();
        }
    }

    getAreasOfConcern() {
        this.plAreasOfConcern.get({ service_type: this.serviceFormVals.serviceType })
            .subscribe((resAOC: any) => {
                // this.areasOfConcernOpts = this.filterBMHOpts(this.plAreasOfConcern.formOpts(resAOC));
                this.areasOfConcernOpts = this.plAreasOfConcern.formOpts(resAOC);
            });
    }

    getAssessments() {
        this.plAssessments.get({ service_types: this.serviceFormVals.serviceType })
            .subscribe((resAssessments: any) => {
                this.assessmentsUsedOpts = this.plAssessments.formOpts(resAssessments);
            });
    }
};
