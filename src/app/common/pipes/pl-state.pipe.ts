import { PLApiUsStatesService } from '@root/index';

import { Pipe, PipeTransform } from '@angular/core';

/*
    Converts US state two-digit postal code into a full state name.

    E.g., CA => California.

    If the input string does not match a postal code, it will return the original.
*/
@Pipe({
    name: 'plState',
})
export class PLStatePipe implements PipeTransform {
    constructor(private stateService: PLApiUsStatesService) {}

    transform(statePostalCode: string): string {
        if (statePostalCode === null) {
            return '';
        }

        return this.stateService.getFromPostalCode(statePostalCode.trim()) || statePostalCode;
    }
}
