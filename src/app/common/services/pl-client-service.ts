import { Option } from '../interfaces';
import { referralIntervalOptions } from './pl-client-referral';

/*
 * Mapping for pluralization pipe
 *
 * https://angular.io/api/common/I18nPluralPipe
 */
export const serviceDurationPluralizationMapping = {
    '=0': '0 minutes',
    '=1': '1 minute',
    other: '# minutes',
};

/*
 * Historically service interval values have been stored in upper case, even
 * though the enum in api-workplace uses lower case values.
 */
export const serviceIntervalOptions: Option[] = referralIntervalOptions.map(({ label, value }) => ({
    label,
    value: (<string> value).toUpperCase(),
}));

export const serviceEvalStageOptions: Option[] = [
    {
        value: 'Scheduling contact made',
        label: 'Scheduling contact made',
    },
    {
        value: 'Testing scheduled',
        label: 'Testing scheduled',
    },
    {
        value: 'Testing in progress',
        label: 'Testing in progress',
    },
    {
        value: 'Testing completed',
        label: 'Testing completed',
    },
    {
        value: 'Writing report',
        label: 'Writing report',
    },
    {
        value: 'Final results meeting schedule',
        label: 'Final results meeting scheduled',
    },
];
