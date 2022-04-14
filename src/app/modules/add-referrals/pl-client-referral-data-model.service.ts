import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Option } from '@common/interfaces';

import {
    referralGradeOptions,
    referralGroupingSpreadsheetValues,
    referralIntervalOptions,
} from '@common/services/pl-client-referral';
import { CLINICAL_PRODUCT_TYPE } from '../../common/constants/index';

export interface Referral {
    // proverType can be: slp, ot, mhp, sped, pa
    providerTypeCode: string;
    // 'direct_service', 'evaluation_with_assessments'
    productTypeCode: string;
    providerUsername?: string;
    schoolYearCode: string;
    notes: string;
    esy: boolean;
    grade: string;
    frequency: string;
    interval: string;
    duration: number;
    grouping: string;
    ignoreDuplicateWarning: boolean;
    isShortTerm?: boolean;
    languageId?: boolean;
    assessmentPlanSignedOn?: string;
    dueDate?: string;
    meetingDate?: string;
}

export interface Client {
    id?: string;
    firstName: string;
    lastName: string;
    birthday: string;
    locationIds: string[];
    externalId: string;
    englishLanguageLearnerStatus: string;
    primaryLanguageCode: string;
    secondaryLanguageCode: string;
}

export interface ClientReferral {
    client: Client;
    referral: Referral;
}

const toValues = (options: Option[]): string[] => options.map(({ value }) => value.toString());
const toLabels = (options: Option[]): string[] => options.map(({ label }) => label.toString());
const toLowerCase = (values: string[]): string[] => values.map(value => value.toLowerCase());

@Injectable()
export class PLClientReferralDataModelService {
    languageCodes: string[] = ['en', 'es', 'ar', 'zh-tw', 'zh-cn', 'fr', 'de', 'it', 'ko', 'ru', 'tl', 'vi'];
    languageCrosswalkTable: any = {
        english: 'en',
        spanish: 'es',
        arabic: 'ar',
        'chinese (cantonese)': 'zh-tw',
        cantonese: 'zh-tw',
        'chinese (mandarin)': 'zh-cn',
        chinese: 'zh-cn',
        mandarin: 'zh-cn',
        french: 'fr',
        german: 'de',
        italian: 'it',
        korean: 'ko',
        russian: 'ru',
        tagalog: 'tl',
        vietnamese: 'vi',
    };

    providerTypes: string[] = ['slp', 'ot', 'mhp', 'sped', 'pa'];
    providerTypesCrosswalkTable: any = {
        'speech-language pathologist': 'slp',
        'occupational therapist': 'ot',
        'mental health professional': 'mhp',
        'sped teacher': 'sped',
        'school psychologist': 'pa',
    };

    CLINICAL_PRODUCT = CLINICAL_PRODUCT_TYPE;
    productTypes: string[] = [
        this.CLINICAL_PRODUCT.CODE.DIR_SVC,
        this.CLINICAL_PRODUCT.CODE.EVAL,
        this.CLINICAL_PRODUCT.CODE.SV,
        this.CLINICAL_PRODUCT.NAME.BIG_LOWER_CASE,
        this.CLINICAL_PRODUCT.NAME.TG_LOWER_CASE,
    ];
    productTypesCrosswalkTable: any = {
        evaluation: 'evaluation_with_assessments',
        'direct therapy': 'direct_service',
    };

    ellStatuses: string[] = ['never_identified', 'currently_identified', 'previously_identified'];
    ellStatusesCrosswalkTable: any = {
        never: 'NEVER_IDENTIFIED',
        current: 'CURRENTLY_IDENTIFIED',
        previous: 'PREVIOUSLY_IDENTIFIED',
    };

    validateValues = {
        primaryLanguageCode: this.languageCodes,
        secondaryLanguageCode: this.languageCodes,
        englishLanguageLearnerStatus: this.ellStatuses,
        providerTypeCode: this.providerTypes,
        productTypeCode: this.productTypes,
        esy: ['yes', 'no'],
        shortTermLeave: ['yes', 'no'],
        grade: toLowerCase(toValues(referralGradeOptions)),
        interval: toLowerCase(toLabels(referralIntervalOptions)),
        grouping: toLowerCase(referralGroupingSpreadsheetValues),
    };

    crosswalkTables = {
        primaryLanguageCode: this.languageCrosswalkTable,
        secondaryLanguageCode: this.languageCrosswalkTable,
        englishLanguageLearnerStatus: this.ellStatusesCrosswalkTable,
        productTypeCode: this.productTypesCrosswalkTable,
        providerTypeCode: this.providerTypesCrosswalkTable,
    };

    // if the value is valid, empty, or not a string, returns the value
    // if the value is an invalid value:
    // - if crosswalk is false or no crosswalk exists for that fieldName, returns false
    // - if crosswalk is true, attempts to crosswalk:
    // -- if crosswalk succeeds, returns crosswalked value
    // -- if crowsswalk fails, returns false
    validateField(fieldName: string, value: string, crosswalk: boolean) {
        if (typeof value !== 'string') {
            return value;
        }

        const lowerCaseVal = value.toLowerCase().trim();
        const validValuesForField = this.validateValues[fieldName];
        const indexOfLowerCaseVal = validValuesForField.indexOf(lowerCaseVal);

        if (value.length === 0 || !validValuesForField || indexOfLowerCaseVal > -1) {
            let actualValue: any = value;

            if (fieldName === 'interval' && indexOfLowerCaseVal > -1) {
                actualValue = referralIntervalOptions[indexOfLowerCaseVal].value;
            }

            return actualValue;
        } else {
            if (crosswalk && this.crosswalkTables[fieldName]) {
                const crosswalked = this.crosswalkTables[fieldName][lowerCaseVal];

                if (crosswalked) {
                    return crosswalked;
                }
            }

            return false;
        }
    }

    // Microsoft Excel date formats are lowercase, which does not parse, so we uppercase here when parsing.
    // This will fail for times, only use on dates
    private validateDate(date: string, format: string) {
        if (date.length === 0) {
            return false;
        }
        // Microsft Excel format is '@' for plain Text
        if (!format || format.trim() === '@') {
            format = '';
        }
        const momentDate = moment(date, format.toUpperCase());
        // two digit years shouldn't be used, but if they are, moment assumes this century, and prepends a '20'.
        // so if the year is in the future, bump it back one century.
        if (momentDate.year() > moment().year()) {
            momentDate.year(momentDate.year() - 100);
        } else if (momentDate.year() < moment().year() - 100) {
            return false;
        }
        let formattedDate;
        try {
            formattedDate = momentDate.format('YYYY-MM-DD');
        } catch (err) {
            return false;
        }
        // moment does not necessarily throw an error when it fails to parse a
        // date. instead it returns 'Invalid Date'
        if (formattedDate === 'Invalid date') {
            return false;
        } else {
            return formattedDate;
        }
    }

    // data is any object containing Client and/or Referral fields. Any fields that we
    // have validation checks for will be validated. those that also have crosswalks
    // will be crosswalked if 'crosswalk' is true. this validation is *not* a requirements
    // check. it only does validation on validatable fields, which may or may not be required,
    // and not all required fields are validated.
    validateClientReferralData(data: any, crosswalk: boolean, format: any) {
        const invalidFields: string[] = [];
        const dateFields = ['birthday', 'assessmentPlanSignature', 'meetingDate', 'assessmentDueDate'];

        for (const field of Object.keys(this.validateValues)) {
            const valResult = this.validateField(field, data[field], crosswalk);
            if (valResult === false) {
                invalidFields.push(field);
            } else {
                data[field] = valResult;
            }
        }

        // Duration must be a positive whole number
        if (data.duration) {
            const pattern = /^\d+$/;
            const valResult = pattern.test(data.duration);

            if (!valResult) {
                invalidFields.push('duration');
            } else {
                data.duration = data.duration;
            }
        }

        dateFields.forEach(field => {
            if (data[field]) {
                const valResult = this.validateDate(data[field], format[field]);
                if (valResult === false) {
                    invalidFields.push(field);
                } else {
                    data[field] = valResult;
                }
            }
        });

        if (data.frequency) {
            const pattern = /^\d+$/;
            const valResult = pattern.test(data.frequency);
            if (!valResult) {
                invalidFields.push('frequency');
            } else {
                data['frequency'] = data.frequency;
            }
        }

        // Max length in characters
        const MAX_NOTES_LENGTH = 2000;

        if (data.notes) {
            data.notes = data.notes.slice(0, MAX_NOTES_LENGTH);
        }

        return { data, invalidFields };
    }
}
