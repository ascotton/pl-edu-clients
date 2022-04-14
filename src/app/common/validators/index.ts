
import { Directive, Input, OnInit } from '@angular/core';
import {
    ValidationErrors,
    AbstractControl,
    ValidatorFn,
    Validator,
    FormControl,
    NG_VALIDATORS,
} from '@angular/forms';
import { Option } from '../interfaces';

export function plValidOptionValidator(options: Option[]) {
    return (control: AbstractControl): ValidationErrors | null => {
        const { value } = control;
        if (value && !options.find(o => o.value === value)) {
            return { invalidOption: true };
        }
        return null;
    };
}

@Directive({
    selector: '[validOption][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: ValidOptionValidatorDirective,
            multi: true,
        },
    ],
})
export class ValidOptionValidatorDirective implements Validator, OnInit {
    validator: ValidatorFn;
    @Input() validOption: Option[];

    constructor() { }

    ngOnInit() {
        this.validator = plValidOptionValidator(this.validOption);
    }

    validate(c: FormControl): ValidationErrors | null {
        if (!this.validator) {
            this.validator = plValidOptionValidator(this.validOption);
        }
        return this.validator(c);
    }
}
