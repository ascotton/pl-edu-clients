import { Pipe, PipeTransform } from '@angular/core';

/*
    Converts a string that includes 10 numerical digits (or 11, when starting
    with a 1), with an optional extension, into a formatted US phone number.

    Will ignore placement of common phone number separators.

    Returns original string if contains characters other than
    numerical digits or common separators.
*/
@Pipe({
    name: 'plPhone',
})
export class PLPhonePipe implements PipeTransform {
    // US digits: 10 digit number with optional leading country code.
    // Simple. Doesn't validate rules like no area codes starting with 0 or 1.
    private readonly US_DIGITS = /^(1?)([\d]{10})([ ,ext.]+[0-9]*)?$/;
    private readonly SEPARATORS = /[- .()+]/g;

    transform(rawValue: string): string {
        const value = rawValue || '';
        const digits = (value || '').replace(this.SEPARATORS, '');

        const usDigitsMatch = digits.match(this.US_DIGITS);

        if (usDigitsMatch) {
            const hasCountryCode = usDigitsMatch[1];
            const tenDigits = usDigitsMatch[2];

            let extra = usDigitsMatch[3];
            if (extra) {
                extra = extra.substring(0, 1) === ',' ? ', ' + extra.substring(1) : ' ' + extra;
            } else {
                extra = '';
            }

            const area = tenDigits.substr(0, 3);
            const office = tenDigits.substr(3, 3);
            const station = tenDigits.substr(6, 4);

            return `${(hasCountryCode ? '+1 ' : '')}(${area}) ${office}-${station}${extra}`;
        }

        return value;
    }
}
