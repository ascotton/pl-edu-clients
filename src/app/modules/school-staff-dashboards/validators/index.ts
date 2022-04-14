import {
    ValidationErrors,
    AbstractControl,
    ValidatorFn,
} from '@angular/forms';
import { PLLicenseType } from '../models';

export function plLicenseTypeValidator(licenseTypes: PLLicenseType[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const { value } = control;
        const license = licenseTypes.find(lt => lt.uuid === value);
        if (value) {
            if (!license) {
                return { plLicense: `Selected license type is invalid` };
            }
            const { total_quantity, quantity_remaining } = license;
            const available = quantity_remaining - 1;
            if (available < 0) {
                return {
                    plLicense: `You have assigned all of your purchased Licenses of this type. Please select another type to proceed`,
                };
            }
        }
        return null;
    };
}

export function plAdminLicenseValidator(licenseTypes: PLLicenseType[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const { value } = control;
        const [adminLicense] = licenseTypes.filter(lt => lt.is_admin &&
            !lt.license_name.toLowerCase().includes('champion'));
        if (value) {
            if (!adminLicense) {
                return { plAdminLicense: `There are no Administrative licenes` };
            }
            const { quantity_remaining, total_quantity } = adminLicense;
            const available = quantity_remaining - 1;
            if (available < 0) {
                return {
                    plAdminLicense: `You have already assigned admin access to ${total_quantity} users.`,
                };
            }
        }
        return null;
    };
}
