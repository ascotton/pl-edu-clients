import { Pipe, PipeTransform } from '@angular/core';

/*
    Converts 'true' or 'false' to 'Yes' or 'No'

    If the input string is empty nor null, it will return an empty string.
*/
@Pipe({
    name: 'plYesNoEmpty',
})
export class PLYesNoEmptyPipe implements PipeTransform {
    transform(value: any): string {
        switch (value) {
                case 'true':
                case true:
                    return 'Yes';
                case 'false':
                case false:
                    return 'No';
                default:
                    return '';
        }
    }
}
