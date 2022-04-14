import { ValidatorFn, FormGroup } from '@angular/forms';
import { Option } from '@common/interfaces';

export enum PL_COLUMN_TYPE {
    ReadOnly,
    Input,
    Select,
    Boolean,
    Date, // TODO: Not Implemented
    Time, // TODO: Not Implemented
    DateTime, // TODO: Not Implemented
}

export type ReadOnlyFn<T> = (row: T) => boolean;

export interface PLColumnDataConfig {
    defaultValue?: any | Function;
    validations?: {
        unique?: any;
        required: any;
        duplicates?: any;
        custom?: Function;
    };
    validators?: ValidatorFn[];
}

export interface PLColumnConfig {
    width?: number; // PX
    readonly?: boolean | ReadOnlyFn<any>;
}

// Mimics PLEditableTableInputConfig
export interface PLEditableColumn {
    key: string;
    label: string;
    type: PL_COLUMN_TYPE;
    config?: PLColumnConfig;
    dataConfig?: PLColumnDataConfig;
}

export interface PLEditableRow<T> {
    value: T;
    form: FormGroup;
    errors?: PLTableRowError[];
}

export interface PLEditableInputColumn extends PLEditableColumn {
    textType: 'text' | 'email';
}

export interface PLEditableSelectColumn extends PLEditableColumn {
    options: Option[];
}

export interface PLEditableBooleanColumn extends PLEditableSelectColumn {
    trueValue: string;
}

// Erro Management
export enum PL_TABLE_ERROR_TYPE {
    Duplicate = 'PL_DUPLICATE_ERROR',
    Unique = 'PL_UNIQUE_ERROR',
    InvalidField = 'PL_INVALID_FIELD',
    Other = 'PL_OTHER_ERROR',
}

export interface PLTableRowError {
    index: number;
    type: PL_TABLE_ERROR_TYPE;
    field?: string;
    message?: string;
}

// TOD: Move to common interfaces?
export interface PLQueryOptions {
    page?: number;
    limit?: number;
    ordering?: string;
    search?: any;
}