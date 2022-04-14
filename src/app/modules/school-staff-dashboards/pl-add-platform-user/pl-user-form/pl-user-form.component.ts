import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, NgForm } from '@angular/forms';
import { Option } from '@common/interfaces';
import {
    PLPlatformUser,
    PLLicenseType,
} from '../../models';
// Services
import { PLDesignService } from '@common/services';
import {
    PLPlatformUsersService,
} from '../../services';
// Validators
import { plValidOptionValidator } from '@common/validators';
import { plLicenseTypeValidator, plAdminLicenseValidator } from '../../validators';

@Component({
    selector: 'pl-user-form',
    templateUrl: './pl-user-form.component.html',
    styleUrls: ['./pl-user-form.component.less'],
})
export class PLUserFormComponent implements OnInit, OnChanges {

    @ViewChild('formDirective', { static: true }) private formDirective: NgForm;

    @Input() value: PLPlatformUser;
    @Input() loading: boolean;
    @Input() ocupations: Option[] = [];
    @Input() licenseTypes: PLLicenseType[];
    @Input() contact: any;
    @Input() reset: any;
    @Output() readonly saveTrigger: EventEmitter<PLPlatformUser> = new EventEmitter();
    form: FormGroup;
    validOcupations: Option[] = [];
    selectedLicense: PLLicenseType;

    constructor(
        public plDesign: PLDesignService,
        private plPlatformUser: PLPlatformUsersService,
        private fb: FormBuilder) { }

    ngOnInit() {
        this.buildForm();
    }

    ngOnChanges(changes: SimpleChanges) {
        const { value, reset, loading, licenseTypes } = changes;
        if (value && !value.firstChange) {
            this.form.setValue(this.value);
        }
        if ((licenseTypes && !licenseTypes.firstChange)) {
            this.updateValidators();
        }
        if (reset && !reset.firstChange) {
            this.formDirective.resetForm({
                lastName: '',
                firstName: '',
                email: '',
                licenseType: '',
                occupation: '',
                adminAccess: false,
            });
            // Nice to Have: Focus first field
        }
        if (loading && !loading.firstChange && this.form) {
            if (this.loading) {
                this.form.disable();
            } else {
                this.form.enable();
                this.onLicenseChanged(this.form.value.licenseType);
            }
        }
    }

    buildForm() {
        // TODO: Check if user can grant adminAccess
        this.form = this.fb.group({
            lastName: ['', [
                Validators.required,
                Validators.maxLength(64),
                Validators.pattern('^[A-Za-z.,\'’‘\\- ]+$'),
            ]],
            firstName: ['', [
                Validators.required,
                Validators.maxLength(64),
                Validators.pattern('^[A-Za-z.,\'’‘\\- ]+$'),
            ]],
            email: ['', [Validators.required, Validators.email]],
            licenseType: ['', this.getLicenseValidators()],
            occupation: this.fb.control({
                value: '',
                disabled: true,
                validators: this.getOcupationValidators(),
            }),
            adminAccess: [false, [
                plAdminLicenseValidator(this.licenseTypes),
            ]],
        });
    }

    updateValidators(): void {
        if (!this.form) {
            return;
        }
        const licenseTypeCtrl = this.form.get('licenseType');
        const adminAccessCtrl = this.form.get('adminAccess');
        licenseTypeCtrl.setValidators(
            this.getLicenseValidators());
        adminAccessCtrl.setValidators(
            plAdminLicenseValidator(this.licenseTypes));
    }

    getLicenseValidators(): ValidatorFn[] {
        return [
            Validators.required,
            plLicenseTypeValidator(this.licenseTypes),
        ];
    }

    getOcupationValidators(): ValidatorFn[] {
        if (this.validOcupations.length) {
            return [
                Validators.required,
                plValidOptionValidator(this.validOcupations),
            ];
        }
        return [];
    }

    submit() {
        if (this.form.valid && !this.loading) {
            this.saveTrigger.emit(this.form.getRawValue());
        }
    }

    onLicenseChanged(value: string) {
        this.selectedLicense = this.licenseTypes.find(lt => lt.uuid === value);
        const userTypeCtrl = this.form.get('occupation');
        let userTypes: Option[] = [];
        if (this.selectedLicense) {
            userTypes = this.plPlatformUser.getUserTypes(this.selectedLicense, this.ocupations);
            userTypeCtrl.enable();
            const adminAccessCtrl = this.form.get('adminAccess');
            if (this.selectedLicense.is_admin) {
                adminAccessCtrl.setValue(false);
                adminAccessCtrl.disable();
            } else if (adminAccessCtrl.disabled) {
                adminAccessCtrl.enable();
            }
        } else {
            userTypeCtrl.disable();
        }
        this.validOcupations = userTypes;
        userTypeCtrl.setValidators(this.getOcupationValidators());
        userTypeCtrl.updateValueAndValidity();
    }
}
