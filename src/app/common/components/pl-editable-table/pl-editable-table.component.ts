import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { FormControl } from '@angular/forms';
import { Option } from '@common/interfaces';

export enum PLEditableTableInputType {
    TEXT = 'text',
    SELECT = 'select',
    DATE = 'date',
    TEXTAREA = 'textarea',
}

export interface PLEditableTableColumnConfig {
    value: string;
    label: string;
    inputConfig?: PLEditableTableInputConfig;
    [propName: string]: any;
}

export interface PLEditableTableInputConfig {
    inputType: PLEditableTableInputType;
    minChars?: number;
    maxChars?: number;
    regexp?: RegExp;
    tipMessage?: string;
    options?: Option[];
    default?: Option;
    isEditable?: boolean;
    minDate?: Date;
    maxDate?: Date;
}

export interface PLEditableTableCell {
    rowIndex: number;
    colIndex: number;
    inputConfig: PLEditableTableInputConfig;
    tabIndex: number;
    value: string;
    editable: boolean;
}

export interface PLEditableTableRow {
    values: PLEditableTableCell[];
    rowIndex?: number;
    error?: any;
    errorReason?: string;
    hidden: boolean;
    isDataRow: boolean;
    [propName: string]: any;
}

export interface PLEditableTableCoord {
    rowIndex: number;
    colIndex: number;
}

@Component({
    selector: 'pl-editable-table',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './pl-editable-table.component.html',
    styleUrls: ['./pl-editable-table.component.less'],
    encapsulation: ViewEncapsulation.None,
})
export class PLEditableTableComponent implements OnInit, OnChanges {
    @Input() fieldChoices: PLEditableTableColumnConfig[];
    @Input() data: string[][];
    @Input() highlighted: any;
    @Input() mappings: string[] = [];
    @Input() showHeaderMessage = false;
    @Input() headerErrorMessage: string;
    @Input() errorRows: PLEditableTableRow[];
    @Input() headerRow: number;
    @Input() showOnlyErrors = false;
    @Input() canChangeColumns = true;
    @Input() canDeleteRow = true;
    @Input() canSortData = false;
    @Input() nonEditableRows: number[] = [];

    @Output() columnChanged = new EventEmitter<string[]>();
    @Output() cellChanged = new EventEmitter<{ newData: string[][], change: any }>();
    @Output() rowClear = new EventEmitter<any>();

    @ViewChild(CdkVirtualScrollViewport, { static: true }) viewPort: CdkVirtualScrollViewport;
    @ViewChild('tableRowsRef', { static: true }) tableRowsRef: ElementRef;

    rows: PLEditableTableRow[] = [];
    dummyRows: any[] = [];
    formattedFieldChoices: any[] = [];
    currentCell: any;
    headerTop = '0px';
    focusedCell = [0, 0];

    get inverseTranslation(): string {
        const offset = this.viewPort.getOffsetToRenderedContentStart();
        return `-${offset}px`;
    }

    constructor() { }

    ngOnInit(): void {
        const unused = {
            value: 'unused',
            label: 'Unused',
            required: false,
            inputConfig: {
                inputType: PLEditableTableInputType.TEXT,
                minChars: 1,
                maxChars: 255,
                regexp: /\w/,
            },
        };
        this.fieldChoices.push(unused);
        this.formatLabels();
        this.mapDataRows();

        if (this.canSortData) {
            this.sortData();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.importErrors || changes.data || changes.mappings || changes.showOnlyErrors) {
            this.mapDataRows();
            if (this.canSortData) {
                this.sortData();
            }
            setTimeout(() => this.focusCell(this.focusedCell), 0);
        }
    }

    /**
     * Adds an '*' as a prefix to required fields.
     * Add 'required' prop to fieldChoice
     */
    formatLabels() {
        this.formattedFieldChoices = this.fieldChoices.map((field: any) => {
            const prefix = field.required ? '*' : field.labelPrefixSymbol;

            return {
                value: field.value,
                label: prefix ? `${prefix} ${field.label}` : field.label,
                isSortable: this.canSortData && field.isSortable,
                sortDirection: field.defaultSortField ? 'ascending' : null,
                secondarySortingField: !!field.secondarySortingField,
                secondarySortingDirection: field.secondarySortingDirection || 'ascending',
            };
        });
    }

    /**
     * Maps the raw data of the table with the column fieldChoice and the row errors.
     */
    mapDataRows() {
        let tabIndex = 0;
        this.dummyRows = this.fillDummyRows(this.data);
        this.rows = this.data.map((rowValues: string[], rowIndex: number) => {
            const errorRow = this.errorRows.find((row: PLEditableTableRow) => row.rowIndex === rowIndex);
            const isRowEditable =  rowIndex > this.headerRow && rowValues.join('').trim() !== ''
                && !this.nonEditableRows.includes(rowIndex);
            const values: PLEditableTableCell[] = rowValues.map((cell: string, colIndex: number) => {
                tabIndex++;
                const fieldChoice = this.fieldChoices
                    .find((field: PLEditableTableColumnConfig) => field.value === this.mappings[colIndex]);
                const inputConfig: PLEditableTableInputConfig =
                    fieldChoice && fieldChoice.inputConfig ? fieldChoice.inputConfig : {
                    inputType: PLEditableTableInputType.TEXT,
                    minChars: 1,
                    maxChars: 255,
                    regexp: /\w/,
                };
                return {
                    rowIndex,
                    colIndex,
                    inputConfig,
                    tabIndex,
                    value: cell,
                    editable: inputConfig.isEditable !== undefined ?
                        inputConfig.isEditable && isRowEditable :
                        isRowEditable,
                };
            });
            return {
                values,
                error: errorRow ? errorRow.errorReason : null,
                hidden: this.showOnlyErrors ? !errorRow : false,
                isDataRow: isRowEditable,
            };
        }).filter((row: PLEditableTableRow) => !row.hidden);
    }

    /**
     * This event is triggered when a change in a cell occurs
     * @param event DOM event when input changes
     * @param cell Cell that changed
     * @param coords Location of the change in the table
     */
    onCellChange(event: any, cell: PLEditableTableCell, coords: PLEditableTableCoord) {
        if (event.preventDefault) {
            event.preventDefault();
        }
        const newValue = cell.inputConfig.inputType === PLEditableTableInputType.DATE
            ? event.targetElement.value
            : event.target.value;
        this.data = this.data.map((row: any[], i: number) => {
            return row.map((col: string, j: number) => {
                if (i === cell.rowIndex && j === cell.colIndex) {
                    return newValue;
                }
                return col;
            });
        });
        const change: any = this.data[cell.rowIndex].reduce((acc, curr, currIndex) => {
            acc[this.mappings[currIndex]] = curr;
            return acc;
        }, {});
        change.rowIndex = cell.rowIndex;
        this.cellChanged.emit({ change, newData: this.data });
        this.focusedCell = [coords.rowIndex + 1, coords.colIndex];
    }

    /**
     * This event is triggered when a column changes its mapping by selecting a
     * different value in the column header
     * @param event DOM event when a column mapping has changed
     * @param index Column index
     */
    onColumnChange(event: any, index: number) {
        // when a column mapping is changed, find its existing mapping and null it out
        const newMappings: string[] = this.mappings.map((mapping: string, i: number) => {
            if (event.value !== 'unused' && i !== index && this.mappings[i] === event.value) {
                return null;
            }

            if (i === index && this.mappings[i] !== event.value) {
                return event.value;
            }

            return mapping;
        });
        this.columnChanged.emit(newMappings);
    }

    /**
     * This event is triggered when a key is pressed in a cell. This is used to
     * navigate to next cell after 'Enter' is pressed.
     * @param event DOM event when key pressed on cells
     * @param cell Cell affected
     */
    onCellKeyup(event: any, cell: PLEditableTableCell) {
        if (event.keyCode === 13) {
            const nextCell = [cell.rowIndex + 1, cell.colIndex];
            this.focusCell(nextCell);
        }
    }

    /**
     * This event is triggered when a cell is clicked. This is used to keep track
     * of the focused cell
     * @param event DOM event when a cell is clicked
     * @param cell Cell clicked
     */
    onCellClick(event: any, cell: PLEditableTableCell) {
        this.focusedCell = [cell.rowIndex, cell.colIndex];
    }

    /**
     * Focuse a specific cell
     * @param nextCell Next cell to focus
     */
    focusCell(nextCell: number[]) {
        const cellInput = this.tableRowsRef.nativeElement
            .querySelector(`.cell-input[rowindex="${nextCell[0]}"][colindex="${nextCell[1]}"]`);
        if (cellInput) {
            cellInput.focus();
        }
    }

    /**
     * This method tries to match a cell value with one of the possible cell
     * options (only for select type inputs)
     * @param value Cell value
     * @param options Cell config options (If inputType is 'select')
     * @returns True or False
     */
    isCellValueInOptions(value: string, options: {value: string; label: string}[]) {
        return !!options.find(option => option.value.toLowerCase() === value.toLowerCase());
    }

    /**
     * Adds a tooltip with the tip meesage for a column (E.g. Values accepted...)
     * @param colIndex Column index
     * @returns Tip message for the entire column.
     */
    getColTipMessage(colIndex: number): string {
        const fieldChoice = this.fieldChoices.find((field: any) => field.value === this.mappings[colIndex]);
        return fieldChoice && fieldChoice.inputConfig ? fieldChoice.inputConfig.tipMessage : null;
    }

    /**
     * Adds 10 more non-editable rows to the end of the table to fill space when
     * small amounts of data is passed
     * @param data Raw data
     * @returns New raw data with dummy rows at the end
     */
    fillDummyRows(data: string[][]) {
        const dummyRows = [];
        for (let index = 0; index < 10; index++) {
            dummyRows.push(data[0].map((_: any) => ''));
        }
        return dummyRows;
    }

    /**
     * This event is triggered when a row is to be cleared.
     * @param event DOM event when the row clear button is clicked
     * @param dataRow Row to be cleared
     */
    onClearRow(event: any, dataRow: PLEditableTableRow) {
        const newData = this.data.map((row: string[], i: number) => {
            return row.map((col: string, j: number) => {
                if (i === dataRow.values[0].rowIndex) {
                    return '';
                }
                return col;
            });
        });
        this.rowClear.emit({
            newData,
            rowNumber: dataRow.values[0].rowIndex + 1,
        });
    }

    /**
     * This method is used to parse raw date values into a date format that the
     * date picker can work with
     * @param value Raw cell value
     * @returns Date formatted with the form control
     */
    getDateFormControlValue(value: string) {
        return new FormControl(new Date(value)).value;
    }

    onSortByColumn(colIndex: number) {
        if (this.canSortData) {
            this.formattedFieldChoices = this.formattedFieldChoices.map((field, index) => {
                if (colIndex === index) {
                    return {
                        ...field,
                        sortDirection: field.sortDirection === 'ascending' ? 'descending' : 'ascending',
                    };
                }
                return {
                    ...field,
                    sortDirection: null,
                };
            });
            this.sortData();
        }
    }

    sortData() {
        const sortField = this.formattedFieldChoices.find((field: any) => !!field.sortDirection);
        const secSortingField = this.formattedFieldChoices.find((field: any) => field.secondarySortingField);
        if (sortField !== undefined) {
            const sortFieldIndex = this.mappings.findIndex((m: string) => m === sortField.value);
            const secSortingIndex = secSortingField
                ? this.mappings.findIndex((m: string) => m === secSortingField.value)
                : null;
            let sortedRows = [];
            if (secSortingIndex !== null) {
                sortedRows = this.sortByFieldIndex(
                    this.rows,
                    secSortingIndex,
                    secSortingField.secondarySortingDirection === 'ascending',
                );
            }
            sortedRows = this.sortByFieldIndex(
                sortedRows,
                sortFieldIndex,
                sortField.sortDirection === 'ascending',
            );
            this.rows = sortedRows.filter((row: PLEditableTableRow) => !row.hidden);
        }
    }

    hasSorting(index: number): boolean {
        return this.formattedFieldChoices[index].isSortable && this.formattedFieldChoices[index].sortDirection;
    }

    private sortByFieldIndex(arr: any[], index: number, isAscending: boolean) {
        return arr.sort((a: PLEditableTableRow, b: PLEditableTableRow) => {
            if (isAscending) {
                if (a.values[index].value > b.values[index].value) {
                    return 1;
                }

                if (a.values[index].value < b.values[index].value) {
                    return -1;
                }

                return 0;
            }

            if (!isAscending) {
                if (a.values[index].value < b.values[index].value) {
                    return 1;
                }

                if (a.values[index].value > b.values[index].value) {
                    return -1;
                }

                return 0;
            }
        });
    }

    /**
     * This is needed to make the Infinite scroller from CDK work correctly with sticky headers
     */
    scrollIndexChanged(event: any) {}
}
