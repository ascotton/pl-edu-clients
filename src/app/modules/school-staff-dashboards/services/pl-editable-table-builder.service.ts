import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { Option } from '@common/interfaces';
import {
    PL_COLUMN_TYPE,
    PLEditableColumn,
    PLEditableSelectColumn,
    PLEditableBooleanColumn,
    PLEditableInputColumn,
    PLColumnConfig,
    PLColumnDataConfig,
} from './models';
import { plValidOptionValidator } from '@root/src/app/common/validators';

@Injectable()
export class PLEditableTableBuilder {

    private readonly DEFAULT_TRUE_VALUE = 'Yes';
    private readonly DEFAULT_FALSE_VALUE = 'No';

    private createBooleanOptions(trueValue: string, falseValue: string): Option[] {
        return [
            { value: true, label: trueValue },
            { value: false, label: falseValue },
        ];
    }

    createColumn(key: string, label: string, type: PL_COLUMN_TYPE,
        _dataConfig?: PLColumnDataConfig, _config?: PLColumnConfig): PLEditableColumn {
        let dataConfig: PLColumnDataConfig = _dataConfig || {};
        const config: PLColumnConfig = _config || {};
        if (_dataConfig) {
            let { validators } = _dataConfig;
            const { validations } = _dataConfig;
            if (!validators) {
                validators = [];
            }
            if (validations) {
                const { required } = validations;
                if (required) {
                    validators.push(Validators.required);
                }
            }
            dataConfig = { ..._dataConfig, validators };
        }
        if (!dataConfig.validators) {
            dataConfig.validators = [];
        }
        return { key, label, type, config, dataConfig };
    }

    createReadOnlyColumn(key: string, label: string,
        _dataConfig?: PLColumnDataConfig, _config?: PLColumnConfig): PLEditableColumn {
        return this.createColumn(key, label, PL_COLUMN_TYPE.ReadOnly, _dataConfig, _config);
    }

    createInputColumn(
        key: string,
        label: string,
        type: 'text' | 'email' = 'text',
        dataConfig?: PLColumnDataConfig,
        config?: PLColumnConfig): PLEditableInputColumn {
        const column = <PLEditableInputColumn>this.createColumn(key, label, PL_COLUMN_TYPE.Input, dataConfig, config);
        column.textType = type;
        if (type === 'email') {
            column.dataConfig.validators.push(Validators.email);
        }
        return column;
    }

    createSelectColumn(
        key: string,
        label: string,
        options: Option[],
        dataConfig?: PLColumnDataConfig,
        config?: PLColumnConfig): PLEditableSelectColumn {
        const column = <PLEditableSelectColumn>this.createColumn(key, label, PL_COLUMN_TYPE.Select, dataConfig, config);
        column.options = options;
        column.dataConfig.validators.push(plValidOptionValidator(column.options));
        return column;
    }

    createBoolenColumn(
        key: string,
        label: string,
        config?: PLColumnConfig,
        trueValue = this.DEFAULT_TRUE_VALUE,
        falseValue = this.DEFAULT_FALSE_VALUE): PLEditableBooleanColumn {
        const dataConfig: PLColumnDataConfig = { defaultValue: false };
        const column = <PLEditableBooleanColumn>this.createColumn(key, label, PL_COLUMN_TYPE.Boolean,
            dataConfig, config);
        column.options = this.createBooleanOptions(trueValue, falseValue);
        column.dataConfig.validators.push(plValidOptionValidator(column.options));
        column.trueValue = trueValue;
        return column;
    }
}
