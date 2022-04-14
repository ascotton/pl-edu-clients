import { Pipe, PipeTransform } from '@angular/core';

/**
 * For formatting the timing with the format Xh Ym.
 *   e.g. 13:42:30 would be 13hr 42m
 */
@Pipe({
    name: 'plTiming',
})
export class PLTimingPipe implements PipeTransform {
    transform(val: string | number): string {
        try {
            let value = val;
            let hours; let minutes;

            if (typeof value !== 'string') value = value.toString(); // if number change it to string.
            const indexOfDot = value.indexOf('.');

            if (indexOfDot >= 0 && indexOfDot < 8) {
                hours = Math.floor(+value) > 0 ? `${Math.floor(+value)}h ` : '';
                minutes = ((+value % 1) * 60) > 0 ? `${Math.floor((+value % 1) * 60)}m` : '';
            } else {
                const splittedValue = value.split(':');
                hours = +splittedValue[0] > 0 ? `${+splittedValue[0]}h ` : '';
                minutes = +splittedValue[1] > 0 ? `${+splittedValue[1]}m` : '';
            }

            return (hours + minutes) === '' ? '0m' : hours + minutes;
        } catch (error) {
            return '0m';
        }
    }
}
