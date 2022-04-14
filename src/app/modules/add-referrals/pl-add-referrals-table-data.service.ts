import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';

import { PLClientReferralDataModelService } from './pl-client-referral-data-model.service';
import { ImportedSheet } from './pl-upload-referrals/pl-file-import.service';
import { PLClientStudentDisplayService } from '@root/index';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

import { CLINICAL_PRODUCT_TYPE } from '../../common/constants/index';
import { REFERRAL_INPUTS_CONFIG } from './constants/referral-inputs-config';
import { PLEditableTableInputConfig } from '../../common/components/pl-editable-table/pl-editable-table.component';

interface Field {
    value: string;
    label: string;
    // Any symbols to prefix the label to indicate footnotes
    labelPrefixSymbol: string;
    preserveWhitespace: boolean;
    required: boolean;
    dupecheck: boolean;
    inputConfig?: PLEditableTableInputConfig;
}

const FIELD_DEFAULTS = {
    dupecheck: false,
    preserveWhitespace: false,
    required: false,
    labelPrefixSymbol: '',
};

@Injectable()
export class PLAddReferralsDataTableService {

    CLINICAL_PRODUCT = CLINICAL_PRODUCT_TYPE;

    constructor(private dataModelService: PLClientReferralDataModelService,
        private store: Store<AppStore>) {
        store.select('currentUser')
            .subscribe((user: any) => {
                this.currentUser = user;
                this.formProviderMatchingChoices();
            });
    }

    currentUser: User;

    importedFile: any = null;
    importedData: any[] = [];
    importedDataFormats: any[] = [];
    finalImportedData: any[] = [];
    mappedData: any[] = [];

    multiSheet = false;
    private sheets: ImportedSheet[] = [];
    private sheetIndex: any = {};
    sheetChoices: any[] = [];
    currentSheetName = '';

    duplicateRows: any[];
    incompleteRows: any[];
    invalidRows: any[];
    templateErrorRows: any[];

    readonly DUPLICATE_REASON: string = 'Duplicate within spreadsheet';
    readonly EXISTING_REASON: string = 'Duplicate with existing referral';
    readonly MISSING_REQUIRED_REASON: string = 'Missing required fields: ';
    readonly INVALID_REASON_STUB: string = 'Invalid data in fields: ';
    readonly MISMATCH_PROVIDER_REFERRAL: string = 'Mismatch between provider type and referral';

    targetFields: Field[] = [
        {
            ...FIELD_DEFAULTS,
            value: 'lastName',
            label: 'Last Name',
            required: true,
            inputConfig: REFERRAL_INPUTS_CONFIG['lastName'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'firstName',
            label: 'First Name',
            required: true,
            inputConfig: REFERRAL_INPUTS_CONFIG['firstName'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'externalId',
            label: 'Student ID',
            required: true,
            dupecheck: true,
            inputConfig: REFERRAL_INPUTS_CONFIG['externalId'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'birthday',
            label: 'Birth Date',
            required: true,
            inputConfig: REFERRAL_INPUTS_CONFIG['birthday'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'grade',
            label: 'Grade',
            inputConfig: REFERRAL_INPUTS_CONFIG['grade'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'providerTypeCode',
            label: 'Provider Type',
            required: true,
            dupecheck: true,
            inputConfig: REFERRAL_INPUTS_CONFIG['providerTypeCode'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'productTypeCode',
            label: 'Referral',
            required: true,
            dupecheck: true,
            inputConfig: REFERRAL_INPUTS_CONFIG['productTypeCode'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'duration',
            label: 'Duration',
            dupecheck: true,
            inputConfig: REFERRAL_INPUTS_CONFIG['duration'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'frequency',
            label: 'Frequency',
            dupecheck: true,
            inputConfig: REFERRAL_INPUTS_CONFIG['frequency'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'interval',
            label: 'Interval',
            dupecheck: true,
            inputConfig: REFERRAL_INPUTS_CONFIG['interval'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'grouping',
            label: 'Individual/Group',
            dupecheck: true,
            inputConfig: REFERRAL_INPUTS_CONFIG['grouping'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'primaryLanguageCode',
            label: 'Service Language',
            inputConfig: REFERRAL_INPUTS_CONFIG['primaryLanguageCode'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'shortTermLeave',
            label: 'Short Term Coverage',
            inputConfig: REFERRAL_INPUTS_CONFIG['shortTermLeave'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'esy',
            label: 'ESY',
            inputConfig: REFERRAL_INPUTS_CONFIG['esy'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'assessmentPlanSignature',
            label: 'Assessment Plan Signature Date',
            inputConfig: REFERRAL_INPUTS_CONFIG['assessmentPlanSignature'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'assessmentDueDate',
            label: 'Evaluation Due Date',
            inputConfig: REFERRAL_INPUTS_CONFIG['assessmentDueDate'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'meetingDate',
            label: 'Meeting Date',
            inputConfig: REFERRAL_INPUTS_CONFIG['meetingDate'],
        },
        {
            ...FIELD_DEFAULTS,
            value: 'notes',
            label: 'Notes',
            preserveWhitespace: true,
            labelPrefixSymbol: '†',
            inputConfig: REFERRAL_INPUTS_CONFIG['notes'],
        },
    ];

    evaluationDupeFields: any = ['firstName', 'lastName', 'externalId', 'birthday', 'providerTypeCode', 'productTypeCode'];

    templateInstructionRows = [
        'DIRECTIONS:',
        'Dark blue fields are required. Light Blue fields are strongly encouraged to be filled out in order to match providers and students more expeditiously.',
        `Each school in the same district will need it's own separate Excel file to create student referrals.   Please label the file with the school and district names.`,
    ];

    mappings: string[] = [];

    // -1 means no header
    headerRow = -1;
    endRow = 0;
    endCol = 0;

    providerMatching: any = {
        selection: 'do_not_use_previous',
        choices: [],
    };

    formProviderMatchingChoices() {
        this.providerMatching.choices = [
            {
                value: 'do_not_use_previous',
                label: 'Send to PresenceLearning for Matching.',
            },
        ];
    }

    setSheets(sheets: ImportedSheet[]) {
        this.sheets = sheets;
        if (sheets.length > 1) {
            this.handleMultiSheetBook(sheets);
        }
    }

    selectSheet(name: string) {
        return this.sheetIndex[name];
    }

    handleMultiSheetBook(sheets: ImportedSheet[]) {
        this.multiSheet = true;
        this.sheets = sheets;
        this.sheetIndex = {};
        this.sheetChoices = [];
        for (const sheet of sheets) {
            this.sheetIndex[sheet.name] = sheet;
            const nextChoice = {
                value: sheet.name,
                label: sheet.name,
            };
            this.sheetChoices.push(nextChoice);
        }
        this.currentSheetName = this.sheets[0].name;
    }

    reset() {
        this.importedFile = null;
        this.importedData = [];
        this.finalImportedData = [];
        this.headerRow = -1;
        this.multiSheet = false;
        this.sheets = [];
        this.sheetIndex = {};
        this.sheetChoices = [];
        this.mappings = [];
        this.duplicateRows = [];
        this.incompleteRows = [];
        this.invalidRows = [];
        this.templateErrorRows = [];
    }

    getFieldLabelForKey(key: string) {
        for (const field of this.targetFields) {
            if (field.value === key) {
                return field.label;
            }
        }
        return key;
    }

    getHeaderRowData() {
        return this.importedData[this.headerRow];
    }

    getImportedFileName = () => {
        const name = this.importedFile ? this.importedFile.name : '';
        return name;
    }

    // the number of rows in the imported spreadsheet that we will attempt to import
    getReferralAttemptCount = () => {
        let count = 0;
        for (let i = this.headerRow + 1; i < this.importedData.length; i++) {
            const row = this.importedData[i];
            if (!this.isEmptyRow(row)) {
                count++;
            }
        }
        return count;
    }

    isEmptyRow(row: string[]) {
        for (let i = 0; i < row.length; i++) {
            const cell = row[i];
            if (cell.trim().length) {
                return false;
            }
        }
        return true;
    }

    setData(data: any[][]) {
        this.mappings = data[0].map(_ => null);
        this.endRow = this.findEndRow(data);
        this.endCol = this.findEndCol(data);
        this.importedData = data;
        const autoHeader = this.findHeader();
        if (autoHeader >= 0) {
            this.headerRow = autoHeader;
            this.autoMap();
        }
    }

    setDataFormats(formats: any[][]) {
        this.importedDataFormats = formats;
    }

    // TODO - move to plLodashService
    intersection(a: any[], b: any[]) {
        const aSet: any = new Set(a);
        const bSet: any = new Set(b);
        const intersection: any = new Set([...aSet].filter(x => bSet.has(x)));
        return [...intersection];
    }

    findHeader() {
        const data = this.importedData;
        const requiredLabels = this.targetFields
            .filter((field) => {
                return field.required;
            })
            .map((field) => {
                return field.label;
            });
        for (let i = 0; i < data.length; i++) {
            const intersect = this.intersection(data[i], requiredLabels);
            // how many exact matches do we require to consider this the header row?
            const HEADER_THRESHOLD = 2;
            if (intersect.length >= HEADER_THRESHOLD) {
                return i;
            }
        }
        return -1;
    }

    findEndRow(data: string[][]) {
        let endRow = 0;
        for (let i = 0; i < data.length; i++) {
            const dataRow = data[i].join('').trim();
            if (dataRow !== '') {
                endRow = i;
            }
        }
        return endRow;
    }

    findEndCol(data: string[][]) {
        let endCol = 0;
        for (let i = 0; i < this.endRow + 1; i++) {
            const row = data[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j] !== '' && endCol < j) {
                    endCol = j;
                }
            }
        }
        return endCol;
    }

    autoMap() {
        const headerRowData = this.getHeaderRowData();
        if (!headerRowData) {
            return;
        }
        const newMappings = new Array(this.mappings.length);
        for (let i = 0; i < headerRowData.length; i++) {
            const header: string = headerRowData[i];
            const targetField = this.targetFields.find((field) => {
                return field.label.toLowerCase() === header.toLowerCase();
            });
            newMappings[i] = targetField ? targetField.value : null;
        }
        this.mappings = newMappings;
    }

    findUnmappedFields() {
        const unmappedFields = [];
        for (let i = 0; i < this.targetFields.length; i++) {
            const nextField = this.targetFields[i];
            if (nextField.required) {
                if (this.mappings.indexOf(nextField.value) === -1) {
                    unmappedFields.push(nextField.label);
                }
            }
        }
        return unmappedFields;
    }

    findUnmappedColumn() {
        const unmappedCols: any[] = [];
        this.importedData[0].forEach((col: any, index: number) => {
            if (this.columnHasData(index) && !this.mappings[index]) {
                unmappedCols.push(index);
            }
        });
        return unmappedCols;
    }

    columnHasData(col: number) {
        const data = this.importedData;
        const colData = data.map((row: any) => {
            return row[col];
        });
        return colData.some(d => d !== '');
    }

    isBlankRow(row: string[]) {
        for (let i = 0; i < row.length; i++) {
            if (row[i].trim().length > 0) {
                return false;
            }
        }
        return true;
    }

    getRequiredFieldKeys() {
        return this.targetFields
            .filter((field) => {
                return field.required;
            })
            .map((field) => {
                return field.value;
            });
    }

    // ensure that all required fields are non-empty strings
    // TODO - validate validatable fields
    testCompleteness(data: any[]) {
        const tested: any[] = [];
        const incompletes: any[] = [];
        const requiredFields = this.getRequiredFieldKeys();
        for (const row of data) {
            const missingFields = requiredFields.filter((field: string) => {
                return !row[field] || row[field].trim().length === 0;
            }).map((field: string) => this.getFieldLabelForKey(field));
            if (missingFields.length > 0) {
                row.missingFields = [...missingFields];
                const errorMessage = this.MISSING_REQUIRED_REASON + row.missingFields.join(', ');
                row.errorReason = row.errorReason ? `
                    ${row.errorReason} -
                    ${errorMessage}
                ` : errorMessage;
                incompletes.push(row);
            }
            tested.push(row);
        }
        this.incompleteRows = incompletes;
        return tested;
    }

    getDupeCheckFieldKeys(productType?: string) {
        if (productType === this.CLINICAL_PRODUCT.NAME.EVAL) {
            return this.evaluationDupeFields;
        }
        return this.targetFields
            .filter((field) => {
                return field.dupecheck;
            })
            .map((field) => {
                return field.value;
            });
    }

    private getPreserveWhitespaceFieldKeys(): string[] {
        return this.targetFields.filter(f => f.preserveWhitespace).map(f => f.value);
    }

    /**
     * If dupes are found, use the first, and move the subsequent ones to the errors array
     *   Before (DEV-1373) "Within a sheet upload, a referral is considered unique when Student ID, Provider Type, and
     *   Referral Type are different
     * Now according to PL-2323 we can have more than one referral related with the same provider
     * This function works along the dupecheck prop of the targetFields array from getDupeCheckFieldKeys
     */
    deDupeData(data: any[]) {
        const tested: any[] = [];
        const dupes: any[] = [];
        const dupeDictionary: any = {};

        for (const row of data) {
            const dupeFields = this.getDupeCheckFieldKeys(row['productTypeCode']);
            // generate a rowKey by taking the row value for each dupe check field, trimming whitespace, and joining
            // e.g. {id: 1234, first: john, last: brecht} becomes key: '1234-john-brecht'
            // Evaluation referals get its key generated shorter, since eval doesn't accept interval timing differences.
            const rowKey = dupeFields.map((field: string) => row[field] ? row[field].trim() : '').join('-');

            // test for uniqueness using a Dictionary. If the key is already in the Dictionary, the row is a dupe
            if (dupeDictionary[rowKey]) {
                const errorMessage = this.DUPLICATE_REASON;
                row.errorReason = row.errorReason ? `
                    ${row.errorReason} -
                    ${errorMessage}
                ` : errorMessage;
                dupes.push(row);
            } else {
                dupeDictionary[rowKey] = true;
            }
            tested.push(row);
        }

        this.duplicateRows = dupes;

        return tested;
    }

    validateData(data: any[], formats: any[]) {
        const tested: any[] = [];
        const invalidData: any[] = [];
        for (let i = 0; i < data.length; i++) {
            const rowFormat = formats[i];
            const rowData = data[i];
            const valResult = this.dataModelService.validateClientReferralData(rowData, true, rowFormat);
            const validatedRow = Object.assign({}, rowData, valResult.data);
            const isSupervisionProduct = valResult.data.productTypeCode === this.CLINICAL_PRODUCT.NAME.SV;
            let isBmhProduct = false;
            if (valResult.data.productTypeCode) {
                isBmhProduct = (
                    valResult.data.productTypeCode.toUpperCase() === this.CLINICAL_PRODUCT.NAME.BIG_UPPER_CASE ||
                    valResult.data.productTypeCode.toUpperCase() === this.CLINICAL_PRODUCT.NAME.TG_UPPER_CASE
                );
            }
            let isProductReferralMismatch = false;

            validatedRow.invalidFields = [];

            for (const field of valResult.invalidFields) {
                validatedRow.invalidFields.push(this.getFieldLabelForKey(field));
            }

            if (isSupervisionProduct || isBmhProduct) {
                // Supervision product can only be bound to SL or OT provider
                // BMH product can only be bound to PA or MHP
                const providerTypeCode = valResult.data.providerTypeCode;
                const isSupervisionProviderType = providerTypeCode === 'slp' || providerTypeCode === 'ot';
                const isBmhProviderType = providerTypeCode === 'pa' || providerTypeCode === 'mhp';

                const validCombination = (
                    (isSupervisionProduct && isSupervisionProviderType) ||
                    (isBmhProduct && isBmhProviderType)
                );

                if (!validCombination) {
                    isProductReferralMismatch = true;
                    validatedRow.invalidFields.push(this.getFieldLabelForKey('providerTypeCode'));
                }
            }

            validatedRow.isValid = valResult.invalidFields.length === 0 && !isProductReferralMismatch;

            if (!validatedRow.isValid) {
                let errorMessage;
                if (isProductReferralMismatch) {
                    errorMessage = this.MISMATCH_PROVIDER_REFERRAL;
                } else {
                    errorMessage = this.INVALID_REASON_STUB + validatedRow.invalidFields.join(', ');
                }
                validatedRow.errorReason = validatedRow.errorReason ? `
                    ${validatedRow.errorReason} -
                    ${errorMessage}
                ` : errorMessage;
                invalidData.push(validatedRow);
            }
            tested.push(validatedRow);
        }
        this.invalidRows = invalidData;
        return tested;
    }

    /**
     * BMH product only accepts two combinations for timing of a referral:
     *   30 minutes twice a week or 60 minutes once a week
     *   Both of the above only in group mode
     * If the timing is not as the above; leave those 4 fields empty
     *
     * @param data An array with the bulk of products the user wants to load
     */
    updateReferralTimingForBmhProduct(data: any[]): any[] {
        for (let i = 0; i < data.length; i++) {
            let isBmhProduct = false;
            if (data[i].productTypeCode) {
                isBmhProduct = (
                    data[i].productTypeCode.toUpperCase() === this.CLINICAL_PRODUCT.NAME.BIG_UPPER_CASE ||
                    data[i].productTypeCode.toUpperCase() === this.CLINICAL_PRODUCT.NAME.TG_UPPER_CASE
                );
            }

            if (isBmhProduct) {
                const rawData = data[i];

                if (rawData.grouping.toLowerCase() === 'either') { // Either grouping must be Group grouping type
                    rawData.grouping = 'Group';
                }

                const validTiming30 = rawData.duration === 30 && rawData.frequency === '2';
                const validTiming60 = rawData.duration === 60 && rawData.frequency === '1';
                const validInterval = rawData.interval.toLowerCase() === 'weekly';
                const validGroup = rawData.grouping.toLowerCase() === 'group';
                const validTiming = (validTiming30 || validTiming60) && validInterval && validGroup;

                if (!validTiming) {
                    rawData.duration = '';
                    rawData.frequency = '';
                    rawData.interval = '';
                    rawData.grouping = '';
                }
            }
        }

        return data;
    }

    /**
     * The BMH products have a specific code in the spread sheet for bulkupload.
     * Unfortunately the product code that the BE accepts for BMH products is a different one.
     * Therefore in this function; that code is being overriden, only for BMH products.
     *
     * @param data An array with the bulk of products the user wants to load
     */
    updateReferralTypeCodeForBmhProduct(data: any[]): any[] {
        for (let i = 0; i < data.length; i++) {
            let isBmhProduct = false;
            if (data[i].productTypeCode) {
                isBmhProduct = (
                    data[i].productTypeCode.toUpperCase() === this.CLINICAL_PRODUCT.NAME.BIG_UPPER_CASE ||
                    data[i].productTypeCode.toUpperCase() === this.CLINICAL_PRODUCT.NAME.TG_UPPER_CASE
                );
            }

            if (isBmhProduct) {
                data[i].productTypeCode = data[i].productTypeCode.toUpperCase() === this.CLINICAL_PRODUCT.NAME.BIG_UPPER_CASE ?
                this.CLINICAL_PRODUCT.CODE.BIG : this.CLINICAL_PRODUCT.CODE.TG ;
            }
        }

        return data;
    }

    // trim leading and trailing spaces from all string fields;
    // for internal spaces, ensure only one space separates tokens for fields
    // with preserveWhitespace = false;
    private trimData(data: any[], preserveWhitespaceFields: string[] = []) {
        const trimmed: any[] = [];
        const reg = /\S+/g;  // match some number of non-whitespace characters
        for (let i = 0; i < data.length; i++) {
            const rowData = data[i];
            Object.keys(rowData).forEach((val) => {
                if (typeof rowData[val] === 'string') {
                    const tokens = rowData[val].match(reg);
                    if (tokens && tokens.length && !preserveWhitespaceFields.includes(val)) {
                        rowData[val] = tokens.join(' ');
                    } else {
                        rowData[val] = rowData[val].trim();
                    }
                }
            });
            trimmed.push(rowData);
        }
        return trimmed;
    }

    /**
     * For the moment, our database only supports the Latin1 character set. This
     * strips out all characters not in that set.
     */
    stripUnicode(data: any[]): any[] {
        // Remove characters outside Latin1 range, 0-255.
        // Convert to normalized form decomposed, meaning compound characters
        // are decomposed into any more basic forms + modifier characters
        // (ñ -> lowercase n + tilde).
        // See https://en.wikipedia.org/wiki/Unicode_equivalence
        const strip = (s: string) => s.normalize('NFD').replace(/[^\x00-\xFF]/g, '');

        return data.map((row: any[]) => {
            const fields = Object.keys(row);

            return fields.reduce(
                (strippedRow: any, field: any) => {
                    const value = row[field];
                    const strippedValue = (typeof value === 'string') ? strip(value) : value;

                    return { ...strippedRow, [field]: strippedValue };
                },
                {},
            );
        });
    }

    // before any data massaging happens, make a copy of the original field entries for use in feedback
    stashOriginalEntries(data: any[]) {
        const stashed: any[] = [];
        for (let i = 0; i < data.length; i++) {
            const rowData = data[i];
            rowData.original = { ...rowData };
            stashed.push(rowData);
        }
        return stashed;
    }

    importData() {
        let data: any[] = [];
        const formats: any[] = [];
        for (let i = this.headerRow + 1; i < this.importedData.length; i++) {
            const nextRow = this.importedData[i];
            const nextFormatRow =
                this.importedDataFormats && this.importedDataFormats[i] ? this.importedDataFormats[i] : '';
            if (!this.isBlankRow(nextRow)) {
                const nextRowFinal = {};
                const nextFormatRowFinal = {};
                for (let j = 0; j < this.mappings.length; j++) {
                    if (this.mappings[j] && this.mappings[j] !== 'unused') {
                        nextRowFinal['rowIndex'] = i;
                        nextRowFinal[this.mappings[j]] = nextRow[j];
                        nextFormatRowFinal[this.mappings[j]] = nextFormatRow[j];
                    }
                }
                data.push(nextRowFinal);
                formats.push(nextFormatRowFinal);
            }
        }

        this.mappedData = [...data];
        data = this.stashOriginalEntries(data);
        data = this.testCompleteness(data);
        data = this.deDupeData(data);
        data = this.validateData(data, formats);
        data = this.updateReferralTimingForBmhProduct(data);
        data = this.updateReferralTypeCodeForBmhProduct(data);
        data = this.trimData(data, this.getPreserveWhitespaceFieldKeys());
        data = this.stripUnicode(data);
        this.finalImportedData = data.filter(row => !row.errorReason);
        this.templateErrorRows = data.filter(row => row.errorReason);
    }
}
