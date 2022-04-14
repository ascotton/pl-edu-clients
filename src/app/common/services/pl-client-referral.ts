import { Option } from '../interfaces';
import { CLINICAL_PRODUCT_TYPE } from '../../common/constants/index';

const CLINICAL_PRODUCT = CLINICAL_PRODUCT_TYPE;

// A portion of the referral and service objects that pertains
// to scheduling and the amount of time required for a referral/service.
export interface ClinicalTalkFrequency {
    duration: number;
    frequency: number;
    grouping: string;
    interval: string;
}

// Currently service objects don't have a grouping property, so
// we can consider them to be _like_ clinical talk frequency.
interface ClinicalTalkFrequencyLike {
    duration: number;
    frequency: number;
    grouping?: string;
    interval: string;
}

export const toClinicalTalkFrequency = (
    { duration, frequency, interval, ...source }: ClinicalTalkFrequencyLike,
): ClinicalTalkFrequency => {
    return {
        duration,
        frequency,
        interval,
        grouping: source.grouping || null,
    };
};

/*
    isUpdatedClinicalTalkFrequency - compare previously-confirmed clinical talk
    frequency fields with a new set of fields. Returns true if there are existing
    talk frequencies, and the new frequency field set has no match with those
    existing values (hence, it's a new set of fields that needs to be confirmed.)
*/
export const isUpdatedClinicalTalkFrequency = (
    existing: ClinicalTalkFrequency[],
    newTalkFrequency: ClinicalTalkFrequency,
): boolean => {
    return (existing || []).length > 0 && !existing.some((f) => {
        return f.duration === newTalkFrequency.duration &&
            f.frequency === newTalkFrequency.frequency &&
            f.interval === newTalkFrequency.interval &&
            (f.grouping === newTalkFrequency.grouping || newTalkFrequency.grouping === null);
    });
};

const grouping = {
    unspecified: 'unspecified',
    individual: 'individual_only',
    group: 'group_only',
    either: 'individual_or_group',
};

const groupingLabels = {
    [grouping.unspecified]: '',
    [grouping.individual]: 'Individual only',
    [grouping.group]: 'Group only',
    [grouping.either]: 'Individual or group',
};

// special case for bulk upload spreadsheet
const groupingSpreadsheetOptions: Option[] = [
    { value: grouping.individual, label: 'Individual' },
    { value: grouping.group, label: 'Group' },
    { value: grouping.either, label: 'Either' },
];

export const referralGroupingOptions: Option[] = Object.keys(groupingLabels).map(key => ({
    value: key,
    label: groupingLabels[key],
}));

export const referralGroupingCheckboxOptions: Option[] = [
    { value: grouping.individual, label: 'Individual' },
    { value: grouping.group, label: 'Group' },
];

export const referralGroupingSpreadsheetValues: string[] = groupingSpreadsheetOptions.map(o => o.label);

export const referralGroupingSpreadsheetLabelToValue = (label: string = ''): string => {
    return <string> groupingSpreadsheetOptions.find(o => o.label.toLowerCase() === label.toLowerCase()).value;
};

export const referralGroupingToCheckboxValues = (value: string = grouping.unspecified): string[] => {
    switch (value) {
            case grouping.individual:
            case grouping.group:
                return [value];
            case grouping.either:
                return [grouping.individual, grouping.group];
    }

    return [];
};

export const referralGroupingFromCheckboxOptionValues = (checkedValues: string[] = []): string => {
    const length = checkedValues ? checkedValues.length : 0;

    switch (length) {
            case 1:
                return checkedValues[0];
            case 2:
                return grouping.either;
    }

    return grouping.unspecified;
};

export const referralGradeOptions: Option[] = [
    'Before Pre-K',
    'Pre-K',
    'Kindergarten',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
    'Adult',
].map(g => ({ label: g, value: g }));

export const referralIntervalOptions: Option[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' },
    { value: 'per_semester', label: 'Per Semester' },
    { value: 'every_2_weeks', label: 'Every 2 weeks' },
    { value: 'every_3_weeks', label: 'Every 3 weeks' },
    { value: 'every_4_weeks', label: 'Every 4 weeks' },
    { value: 'every_5_weeks', label: 'Every 5 weeks' },
    { value: 'every_6_weeks', label: 'Every 6 weeks' },
    { value: 'every_7_weeks', label: 'Every 7 weeks' },
    { value: 'every_8_weeks', label: 'Every 8 weeks' },
    { value: 'every_9_weeks', label: 'Every 9 weeks' },
    { value: 'every_10_weeks', label: 'Every 10 weeks' },
    { value: 'every_11_weeks', label: 'Every 11 weeks' },
];

export const referralProductTypeMap = {
    groupbmh_bi: CLINICAL_PRODUCT.NAME.BIG_UPPER_CASE,
    groupbmh_ti: CLINICAL_PRODUCT.NAME.TG,
    consultation: CLINICAL_PRODUCT.NAME.TE,
    direct_service: CLINICAL_PRODUCT.NAME.TE,
    evaluation_with_assessments: CLINICAL_PRODUCT.NAME.EVAL,
    records_review: CLINICAL_PRODUCT.NAME.EVAL,
    screening: CLINICAL_PRODUCT.NAME.EVAL,
    supervision: CLINICAL_PRODUCT.NAME.SV,
};
