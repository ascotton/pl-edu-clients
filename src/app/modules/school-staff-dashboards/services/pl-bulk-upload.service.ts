import { Injectable } from '@angular/core';
import { PLFileImportService, ImportedSheet } from '../../add-referrals/pl-upload-referrals/pl-file-import.service';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    PL_COLUMN_TYPE,
    PLEditableColumn,
    PLEditableBooleanColumn,
    PLTableRowError,
    PL_TABLE_ERROR_TYPE,
} from './models';

@Injectable()
export class PLBulkUploadService {

    private _fetching$ = new BehaviorSubject(false);
    get fetching$() {
        return this._fetching$.asObservable();
    }

    readonly TABLE_PAGE_SIZE: number = 10;
    readonly MAX_FILE_SIZE_MB: number = 3;

    constructor(private plImport: PLFileImportService) { }

    private formatRow<T>(row: string[], columns: PLEditableColumn[],
        options: { defaults?: boolean }): T {
        let obj: T = <T>{};
        columns.forEach((col, idx) => {
            let value: any = row[idx];
            if (col.type === PL_COLUMN_TYPE.Boolean) {
                const { trueValue } = (<PLEditableBooleanColumn>col);
                if (typeof value !== 'boolean') {
                    value = value === trueValue;
                }
                obj[col.key] = value;
                return;
            }
            if (value === undefined) {
                value = '';
            }
            obj[col.key] = value.trim();
        });
        if (options.defaults) {
            obj = this.setDefaultValue(obj, columns);
        }
        return obj;
    }

    private rowToCSV<T>(row: T, columns: PLEditableColumn[]): string[] {
        return columns.map((col: PLEditableColumn) => {
            const value = row[col.key];
            if (col.type === PL_COLUMN_TYPE.Boolean && typeof value === 'boolean') {
                const bCol = <PLEditableBooleanColumn>col;
                return `${bCol.options[row[col.key] ? 0 : 1].label}`;
            }
            return `${value}`;
        });
    }

    formatData<T>(_data: string[][], columns: PLEditableColumn[],
        options?: { ignoreBooleans?: boolean, defaults?: boolean }): T[] {
        let defaultOptions = { ignoreBooleans: false, defaults: true };
        if (options) {
            defaultOptions = { ...defaultOptions, ...options };
        }
        const dupCols = columns
            .filter(c => c.dataConfig && c.dataConfig.validations && c.dataConfig.validations.duplicates);
        return _data
            .filter(item => item.join('') !== '')
            .map(item =>
                this.formatRow<T>(item, columns, defaultOptions))
            .sort((itemA, itemB) => {
                const a = dupCols.map(col => itemA[col.key]).join('');
                const b = dupCols.map(col => itemB[col.key]).join('');
                if (a === '' || a === null) {
                    return 1;
                }
                if (b === '' || b === null) {
                    return -1;
                }
                if (a === b) {
                    return 0;
                }
                return a < b ? -1 : 1;
            });
    }

    dataToCsvRows<T>(data: T[], columns: PLEditableColumn[]): string [][] {
        return data.map(item =>
            this.rowToCSV(item, columns));
    }

    dataToCSV<T>(data: T[], columns: PLEditableColumn[]): string {
        let csv = `${columns.map(c => c.label).join(',')}\r\n`;
        csv += data.map(item =>
            this.rowToCSV(item, columns).join(','))
            .join('\r\n');
        return csv;
    }

    /*
    downloadCsv(csvFile: string, fileName: string) {
        const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, fileName);
        } else {
            const link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }
    */

    getChunks<T>(data: T[], size?: number): T[][] {
        const chunks = [];
        for (let i = 0; i < data.length; i += size) {
            const chunk = data.slice(i, i + size);
            chunks.push(chunk);
        }
        return chunks;
    }

    validateData<T>(data: T[], columns: PLEditableColumn[]): PLTableRowError[] {
        return [
            ...this.checkDuplicates(data, columns),
            ...this.checkUniques(data, columns),
        ];
    }

    checkUniques<T>(data: T[], columns: PLEditableColumn[]): PLTableRowError[] {
        const uniqueCols = columns
            .filter(c => c.dataConfig && c.dataConfig.validations && c.dataConfig.validations.unique);
        const uniques: PLTableRowError[] = [];
        uniqueCols.forEach((col) => {
            const colData = data.map(item => item[col.key]);
            colData.forEach((value, index) => {
                if (!value) {
                    return;
                }
                const values = colData.filter(rowValue => rowValue === value);
                if (values.length > 1) {
                    uniques.push({
                        index,
                        field: col.key,
                        message: `Duplicate ${col.label}. Please delete or change.`,
                        type: PL_TABLE_ERROR_TYPE.Unique,
                    });
                }
            });
        });
        return uniques;
    }

    checkDuplicates<T>(data: T[], columns: PLEditableColumn[]): PLTableRowError[] {
        const dupCols = columns
            .filter(c => c.dataConfig && c.dataConfig.validations && c.dataConfig.validations.duplicates);
        const rowKeys = data.map(item =>
            dupCols.map(({ key }) => item[key] ? item[key].toString().trim() : '')
            .join('-'));
        const duplicates: PLTableRowError[] = [];
        rowKeys.forEach((row, idx) => {
            if (rowKeys.filter(r => r === row).length > 1) {
                duplicates.push({
                    index: idx,
                    message: 'Duplicate row',
                    type: PL_TABLE_ERROR_TYPE.Duplicate,
                });
            }
        });
        return duplicates;
    }

    checkFile(event: any, _options?: { maxFile?: number, headerRow?: number, sheet?: number, maxRows?: number })
        : Observable<{ error?: string; warning?: string; data?: string[][], header?: string[] }> {
        const options = {
            headerRow: 0,
            sheet: 0,
            maxFile: this.MAX_FILE_SIZE_MB,
            ..._options,
        };
        const { model } = event;
        const maxFileMB = options.maxFile * 1024 * 1024;
        // this.displayData = [];
        // this.tableDataService.importedData = [];
        // this.noFileInputError = false;
        // this.loadingFile = true;
        /*
        const errorToast = (msg: string) => {
            this.plToast.show('error', msg);
        };
        */
        if (!model.file) {
            return of({ error: 'No file' });
        }
        if (!model.file.size || model.file.size > maxFileMB) {
            /*
            this.tableDataService.importedFile = null;
            errorToast(`
                The file you selected exceeds ${this.MAX_FILE_SIZE_MB} MB.
                Please select a smaller file and try again.`);
            this.loadingFile = false;
            */
            return of({
                error: `The file you selected exceeds ${this.MAX_FILE_SIZE_MB} MB.
                        Please select a smaller file and try again.`,
            });
        }
        this._fetching$.next(true);
        return this.plImport.parseFile(model.file).pipe(
            map((sheets: ImportedSheet[]) => {
                if (sheets.length < 1) {
                    return {
                        error: `The file you selected doesn't have any data.
                                Please select other file and try again.`,
                    };
                }
                const templateSheet = sheets.find(s => s.name.toLowerCase() === 'template') ||
                    sheets[options.sheet] || sheets[0];
                let data = templateSheet.values;
                const header = data[options.headerRow];
                data = data.slice(options.headerRow + 1)
                    // Remove empty data
                    .filter(row => row.join('') !== '');
                this._fetching$.next(false);
                return { data, header };
            }),
        );
    }

    /*
    normalizeColumns(columns: PLEditColumn[]): PLEditColumn[] {
        return columns.map((col) => {
            if (col.type === PL_COLUMN_TYPE.Boolean) {
                if (!col.options) {
                    col.options = this.getBooleanOptions();
                }
                if (!col.default) {
                    col.default = this.DEFAULT_FALSE_VALUE;
                }
            }
            return col;
        });
    }
    */

    setDefaultValue<T>(item: T, columns: PLEditableColumn[]): T {
        columns
            .filter(({ dataConfig }) => dataConfig && dataConfig.defaultValue)
            .forEach(({ key, dataConfig }) => {
                const cValue = item[key];
                const { defaultValue } = dataConfig;
                const isFunction = typeof defaultValue === 'function';
                if (isFunction) {
                    item = defaultValue(item);
                } else if (cValue) {
                    item[key] = defaultValue;
                }
            });
        return { ...item };
    }
}
