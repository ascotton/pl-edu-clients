import { Component, Output, EventEmitter, SimpleChanges } from '@angular/core';

import { PLApiServicesService, PLMayService } from '@root/index';
import { PLServiceSaveService } from '../pl-service-save.service';

@Component({
    selector: 'pl-service-save-assign',
    templateUrl: './pl-service-save-assign.component.html',
    styleUrls: ['./pl-service-save-assign.component.less'],
    // inputs: ['serviceFormVals', 'isEdit', 'formCtrl', 'revalidate', 'currentUser'],
})
export class PLServiceSaveAssignComponent {
    // @Output() onChangeValid = new EventEmitter<any>();

    serviceFormVals: any;
    isEdit: boolean = false;
    formCtrl: any;
    revalidate: boolean = false;
    currentUser: any = {};

    ownerOpts: any[] = [];
    private maySelfRefer: boolean = false;

    constructor(private plMay: PLMayService, private plServices: PLApiServicesService,
     private plServiceSave: PLServiceSaveService) { }

    ngOnInit() {
        this.plServiceSave.getSharedData()
            .subscribe((data: any) => {
                this.serviceFormVals = data.serviceFormVals;
                this.isEdit = data.isEdit;
                this.formCtrl = data.serviceSaveAssignForm;
                this.revalidate = data.revalidateStep.assign;
                this.currentUser = data.currentUser;
                this.validate({});
            });
        this.init();
        this.validate({});
    }

    ngOnChanges(changes: any) {
        this.init();
        this.validate({});
    }

    init() {
        this.setMaySelfRefer();
    }

    validate(evt: any) {
        // if (this.onChangeValid) {
            // Need timeout for form valid state to update.
            setTimeout(() => {
                let valid = true;
                // this.onChangeValid.emit({ valid: valid, stepKey: 'assign' });
                this.plServiceSave.onChangeStepValid({ valid: valid, stepKey: 'assign' });
            }, 250);
        // }
    }

    setMaySelfRefer() {
        if (this.currentUser) {
            let adminMaySelfRefer = this.plMay.selfReferService(this.currentUser);

            // let maySelfRefer = this.plServices.maySelfRefer(this.serviceFormVals.service, this.currentUser.uuid);
            // Now have referrals so always can self refer (as long as a provider or lead, which all users should be).
            const isLead = this.plMay.isLead(this.currentUser);
            const isProvider = this.plMay.isProvider(this.currentUser);
            let maySelfRefer = (isLead || isProvider) ? true : false;
            if (maySelfRefer && !adminMaySelfRefer) {
                maySelfRefer = false;
            }
            this.maySelfRefer = maySelfRefer;
            this.formOwnerOpts();
            if (!this.maySelfRefer) {
                this.serviceFormVals.owner = '';
            } else if (this.currentUser.uuid) {
                this.serviceFormVals.owner = this.currentUser.uuid;
            }
        }
    }

    formOwnerOpts() {
        if (this.currentUser.uuid) {
            this.ownerOpts = [
                { value: this.currentUser.uuid, label: 'Assign to me', disabled: !this.maySelfRefer },
                { value: '', label: 'Refer to another clinician' },
            ];
        }
    }
};
