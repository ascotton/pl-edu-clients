import { Pipe, PipeTransform } from '@angular/core';
import { Option } from '@common/interfaces';

/*
 * plOptions pipe. For displaying values that are mapped to labels (typically in
 * input fields), use this pipe to display the label for a corresponding value.
 *
 * Example:
 * <!-- inputOptions = [ { value: '1', label: 'One' }, { value: '2', label: 'Two' }]  -->
 * <!-- myNumber = 1 -->
 * {{ myNumber | plOptions : inputOptions }}  -> One
 */
@Pipe({
    name: 'plOptions',
})
export class PLOptionsPipe implements PipeTransform {
    transform(value: any, options: Option[] = []): string {
        const option = options.find(o => o.value === value);

        return option ? option.label : (value || '');
    }
}
