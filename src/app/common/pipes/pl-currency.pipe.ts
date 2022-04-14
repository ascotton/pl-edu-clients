import { Pipe, PipeTransform } from '@angular/core';
import { PLFormatterService } from '@root/index';

/*
*/
@Pipe({
    name: 'plCurrency',
})
export class PLCurrencyPipe implements PipeTransform {

    constructor(private plFormatter: PLFormatterService) {}

    transform(amount: number): string {
        if (!amount) {
            return '';
        }
        let value = this.numberToString(amount, 2);
        // Remove any non digit characters EXCEPT a dot.
        value = value.replace(/[^\d\.]/g, '');
        let { base: dollars, decimal: cents } = this.splitPeriod(value);
        dollars = this.plFormatter.commify(dollars);
        return `$${dollars}.${cents}`;
    }

    private numberToString(dollars: any, decimals = 0) {
        const amount = typeof(dollars) === 'string' ? parseFloat(dollars) : dollars;
        return amount.toFixed(decimals);
    }

    private splitPeriod(amount: any) {
        let base = typeof(amount) !== 'string' ? amount.toString() : amount;
        let decimal = '00';
        const posPeriod = base.indexOf('.');
        if (posPeriod > -1) {
            decimal = base.slice((posPeriod + 1), base.length);
            base = base.slice(0, posPeriod);
        }
        return {
            base,
            decimal,
        };
    }
}
