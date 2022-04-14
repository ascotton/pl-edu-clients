import {
    Input,
    Component,
    OnChanges,
    SimpleChanges,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    OnInit,
    OnDestroy,
    Output,
    EventEmitter,
} from '@angular/core';
// import { SelectionModel } from '@angular/cdk/collections';
import { MatSelectChange } from '@angular/material/select';
import { Subscription } from 'rxjs';
import {
    FormBuilder,
    FormGroup,
    ValidatorFn,
} from '@angular/forms';
import {
    PLEditableRow,
    PLEditableColumn,
    PLBulkUploadService,
    PLTableRowError,
    PL_COLUMN_TYPE,
    PL_TABLE_ERROR_TYPE,
    ReadOnlyFn,
} from '../services';

@Component({
    selector: 'pl-editable-table-v2',
    templateUrl: './pl-editable-table.component.html',
    styleUrls: ['./pl-editable-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLEditableTableComponentV2<T> implements OnInit, OnDestroy, OnChanges {

    private subscriptions: Subscription[] = [];
    readonly COLUMN_TYPES = PL_COLUMN_TYPE;

    isValid: boolean;
    maxRowsError: boolean;
    rows: PLEditableRow<T>[] = [];
    visibleRows: PLEditableRow<T>[] = [];

    // TO BE REMOVE
    visibleData: T[];
    workingData: T[];

    view: 'All' | 'Errors' = 'All';
    banner: {
        title: string;
        type?: string;
        subtitles: string[];
    };

    @Input() data: string[][];
    @Input() maxRows: number;
    @Input() header: string[];
    @Input() columns: PLEditableColumn[];
    @Input() columnsDefinition: string[];
    @Input() validator: (data: any[]) => PLTableRowError[];
    @Input() errorCategories: { [key: string]: PL_TABLE_ERROR_TYPE[] } = {
        'possible duplicates': [PL_TABLE_ERROR_TYPE.Duplicate],
        'missing data or invalid data': [PL_TABLE_ERROR_TYPE.InvalidField, PL_TABLE_ERROR_TYPE.Unique],
        'issues assigning licenses': [PL_TABLE_ERROR_TYPE.Other],
    };
    @Input() viewErrors: PL_TABLE_ERROR_TYPE[];
    // TODO: It should exist a workingData and visibleData
    @Output() readonly dataChange: EventEmitter<string[][]> = new EventEmitter();
    @Output() readonly validData: EventEmitter<T[]> = new EventEmitter();
    @Output() readonly invalidRows: EventEmitter<PLEditableRow<T>[]> = new EventEmitter();
    // @Output() readonly itemsChange: EventEmitter<T[]> = new EventEmitter();

    constructor(
        private bulkUpload: PLBulkUploadService,
        private fb: FormBuilder) { }

    ngOnInit() { }

    ngOnDestroy() {
        this.unsubscribeAll();
    }

    ngOnChanges(changes: SimpleChanges) {
        const { columns, data } = changes;
        if (columns) {
            this.setColumns();
            if (this.header) {
                this.matchColumnHeader(this.header);
            }
        }
        if (data) {
            this.normailizeData(this.data);
        }
    }

    private setColumns() {
        this.columnsDefinition = [
            'selector',
            ...this.columns.map(c => c.key),
            'actions',
        ];
    }

    private normailizeData(_data: string[][], columns: PLEditableColumn[] = this.columns) {
        const normalizedData = this.bulkUpload.formatData<T>(_data, columns, { ignoreBooleans: true });
        this.maxRowsError = this.maxRows && normalizedData.length > this.maxRows;
        this.workingData = normalizedData;
        this.buildRows(normalizedData, columns);
        this.updateVisibleRows();
    }

    private buildRows(items: T[], columns: PLEditableColumn[]) {
        this.unsubscribeAll();
        const rowStructure = this.createRowStructure();
        this.rows = items.map((value, index) => {
            const form = this.fb.group(rowStructure, { updateOn: 'blur' });
            const row = { form, value };
            this.handleRowChanges(row, index, items, columns);
            form.setValue(value);
            return row;
        });
        this.validateTable(items);
    }

    private handleRowChanges(row: PLEditableRow<T>, index: number, data: any[], columns: PLEditableColumn[]) {
        const { form } = row;
        let firstCheck = true;
        const sub = form.valueChanges.subscribe(() => {
            const currentValue = form.getRawValue();
            const newValue = this.bulkUpload.setDefaultValue(currentValue, columns);
            const readonlyColumns = columns.filter(c => c.config &&
                c.config.readonly &&
                typeof c.config.readonly === 'function');
            if (readonlyColumns.length) {
                readonlyColumns.forEach((col) => {
                    const roFn = <ReadOnlyFn<T>>col.config.readonly;
                    const disabled = roFn(newValue);
                    const field = form.get(col.key);
                    if (disabled && !field.disabled) {
                        field.disable();
                    }
                    if (!disabled && !field.enabled) {
                        field.enable();
                    }
                });
            }
            // Clear Errors
            let errors = (row.errors || []).filter(e => !(e.index === index
                && e.type === PL_TABLE_ERROR_TYPE.InvalidField));
            if (form.invalid) {
                errors = [
                    ...errors,
                    ...this.columns.filter(({ key }) => {
                        const ctrl = form.get(key);
                        return ctrl.invalid;
                    }).map(col => ({
                        index,
                        field: col.key,
                        type: PL_TABLE_ERROR_TYPE.InvalidField,
                    })),
                ];
            }
            this.workingData[index] = row.value = newValue;
            form.setValue(newValue, { emitEvent: false });
            row.errors = errors;
            if (!firstCheck) {
                this.setData(this.workingData);
                this.validateTable(data);
            } else {
                firstCheck = false;
            }
        });
        this.subscriptions.push(sub);
    }

    private validateTable(data: T[]) {
        let errors = this.bulkUpload.validateData(data, this.columns);
        if (this.validator) {
            errors = [...errors, ...this.validator(data)];
        }
        this.rows.forEach((row, idx) => {
            const rowErrors = errors
                .filter(({ index }) => index === idx);
            const currentErrors = row.errors
                .filter(({ type }) =>
                    type === PL_TABLE_ERROR_TYPE.InvalidField);
            row.errors = [...currentErrors, ...rowErrors];
        });
        this.updateValidData();
    }

    private unsubscribeAll() {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.subscriptions = [];
    }

    private setData(items: T[]): string[][] {
        const csv = this.bulkUpload.dataToCsvRows<T>(items, this.columns);
        this.data = csv;
        this.dataChange.emit(this.data);
        return csv;
    }

    private updateVisibleRows() {
        this.visibleRows = this.view === 'All' ? this.rows :
            this.rows.filter(r => r.errors && r.errors.length > 0);
    }

    private updateValidData() {
        const validData: T[] = [];
        const invalidRows: PLEditableRow<T>[] = [];
        this.rows.forEach((row) => {
            row.errors && row.errors.length > 0 ?
                invalidRows.push(row) :
                validData.push(row.value);
        });
        this.buildErrorBanner(invalidRows);
        this.validData.emit(validData);
        this.invalidRows.emit(invalidRows);
    }

    buildErrorBanner(invalidRows: PLEditableRow<T>[]) {
        if (!invalidRows.length) {
            this.banner = null;
            return;
        }
        const errorCategoriesKeys = Object.keys(this.errorCategories);
        let allErrors: { index: number, category: string }[] = [].concat(
            ...invalidRows.map(row =>
                row.errors.map(({ index, type }) => {
                    const category = errorCategoriesKeys.find(key =>
                        this.errorCategories[key].includes(type));
                    return { index, category };
                }),
            ),
        );
        allErrors = allErrors.filter((item, pos) =>
            allErrors.findIndex(({ index, category }) =>
                item.index === index && item.category === category) === pos);
        const errorCounts = allErrors.map(err => err.category).reduce((acc, value) => ({
            ...acc,
            [value]: (acc[value] || 0) + 1,
        }), {});
        this.banner = {
            title: `You have ${invalidRows.length} rows with errors that need to be addressed`,
            subtitles: Object.keys(errorCounts).map(key =>
                `${errorCounts[key]} rows have ${key}`),
        };
    }

    getTooltipError(row: PLEditableRow<T>, column: string): string {
        const errors = row.form.get(column).errors;
        if (!errors) {
            const customErrors = this.getErrors(row, column);
            if (!customErrors.length) {
                return '';
            }
            return customErrors[0].message;
        }
        if (errors['required']) {
            return 'Missing field';
        }
        if (errors['email']) {
            return 'Email is in a wrong format';
        }
        if (errors['invalidOption']) {
            return 'Selected option is not valid';
        }
        if (errors['pattern']) {
            return 'Please enter a valid format';
        }
        if (errors['maxlength']) {
            const error = errors['maxlength'];
            return `Character max length of ${error.requiredLength} exceeded`;
        }
        return '';
    }

    getErrors(row: PLEditableRow<T>, column: string): PLTableRowError[] {
        if (!row.errors) {
            return [];
        }
        return row.errors.filter(e => e.field === column);
    }

    getRowErrors(row: PLEditableRow<T>): PLTableRowError[] {
        if (!row.errors) {
            return [];
        }
        return row.errors.filter(e => !e.field);
    }

    matchColumnHeader(header: string[]) {
        const normalizedHeader = header.map(h => this.normalizeNames(h));
        normalizedHeader.forEach((name, idx) => {
            const colIdx = this.columns
                .findIndex(col => name.startsWith(
                    this.normalizeNames(col.key)));
            if (colIdx >= 0 && colIdx !== idx) {
                const column = this.columns[idx];
                const columnName = this.columns[colIdx].key;
                this.swapColumns(column, columnName);
            }
        });
    }

    swapColumns(column: PLEditableColumn, swapKey: string) {
        const columns = [...this.columns];
        const currentKey = column.key;
        const colIdx = this.columns.findIndex(c => c.key === currentKey);
        const swapColIdx = this.columns.findIndex(c => c.key === swapKey);
        columns[colIdx] = { ...this.columns[swapColIdx] };
        columns[swapColIdx] = { ...column };
        this.columns = columns;
        this.setColumns();
        this.normailizeData(this.data, columns);
    }

    deleteRow(row: PLEditableRow<T>, index: number) {
        const newData = this.workingData.filter((item, idx) => idx !== index);
        const csv = this.setData(newData);
        // TODO: Needs performance optimization
        this.normailizeData(csv, this.columns);
    }

    createRowStructure(): { [key: string]: any } {
        const rowColumns = {};
        this.columns.forEach(({ key, dataConfig, config }) => {
            let validators: ValidatorFn[] = [];
            let value = '';
            let disabled = false;
            if (dataConfig) {
                validators = dataConfig.validators || [];
                if (typeof dataConfig.defaultValue !== 'function') {
                    value = dataConfig.defaultValue;
                }
            }
            if (config && config.readonly && typeof config.readonly !== 'function') {
                disabled = true;
            }
            rowColumns[key] = [{ value, disabled }, validators];
        });
        return rowColumns;
    }

    toggleView() {
        this.view = this.view === 'All' ? 'Errors' : 'All';
        this.updateVisibleRows();
    }

    private normalizeNames(name: string) {
        return name.toLowerCase()
            .replace(/\s/g, '');
    }
}
