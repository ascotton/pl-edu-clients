import { Pipe, PipeTransform } from '@angular/core';

/**
 * PLTruncatePipe - Will truncate a string to a maximum number of characters,
 * and will insert an optional trailing suffix to trimmed strings, if supplied.
 */
@Pipe({
    name: 'plTruncate',
})
export class PLTruncatePipe implements PipeTransform {
    /**
     *  transform
     *  @param {string} input string to truncate; will return empty string if this is null
     *  @param {number} maxLength the length after which to truncate; defaults to 0 if
     *    the parameter is not supplied. It's meant to be a required param.
     *  @param {string} suffix (optional) string to append to truncated strings. If a string
     *    is truncated, the size of the returned string will be (maxLength + suffix.length)
     */
    transform(input: string, maxLength: number = 0, suffix: string = ''): string {
        const inputString = input || '';

        // Wrap in if() to conditionally add suffix
        if (inputString.length > maxLength) {
            return `${inputString.slice(0, maxLength)}${suffix}`;
        }

        return inputString;
    }
}
