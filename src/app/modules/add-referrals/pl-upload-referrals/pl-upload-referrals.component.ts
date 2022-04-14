import { Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLSpreadsheetService } from '@common/services/pl-spreadsheet.service';

import { PLFileImportService, ImportedSheet } from './pl-file-import.service';
import { PLAddReferralsNavigationService } from '../pl-add-referrals-navigation.service';
import { PLAddReferralsLocationYearService } from '../pl-add-referrals-location-year.service';
import { PLAddReferralsDataTableService } from '../pl-add-referrals-table-data.service';

import { PLToastService, PLConfirmDialogService } from '@root/index';

@Component({
    selector: 'pl-upload-referrals',
    templateUrl: './pl-upload-referrals.component.html',
    styleUrls: ['./pl-upload-referrals.component.less', '../pl-add-referrals.component.less'],
    providers: [PLSpreadsheetService],
})
export class PLUploadReferralsComponent implements OnInit, OnDestroy {
    currentUser: User;

    displayData: any[] = [];

    unmappedFields: string[] = [];
    dataColumnsUnmapped: number[];

    readonly TABLE_PAGE_SIZE: number = 10;
    readonly MAX_FILE_SIZE_MB: number = 3;

    destroyed$ = new Subject<boolean>();
    locationName: string;

    showImportedData: boolean = false;

    loadingFile = false;
    noFileInputError = false;

    missingFieldsError = false;
    missingFields = '';

    myElement: any;
    tableDataService: PLAddReferralsDataTableService;

    errorRows: any[] = [];
    warningRows: any[] = [];
    conflictRows: any[] = [];

    isViewingErrors = false;
    hasEditedData = false;
    tableDataSubject: Subject<any> = new Subject();

    constructor(
        private plImport: PLFileImportService,
        private pLAddReferralsNavigationService: PLAddReferralsNavigationService,
        private locationService: PLAddReferralsLocationYearService,
        tableDataService: PLAddReferralsDataTableService,
        private plToast: PLToastService,
        private plConfirm: PLConfirmDialogService,
        myElement: ElementRef,
        private store: Store<AppStore>,
        private plSpreadsheet: PLSpreadsheetService,
    ) {
        store.select('currentUser').pipe(takeUntil(this.destroyed$))
            .subscribe((user: any) => {
                this.currentUser = user;
            });
        this.myElement = myElement;
        this.locationName = locationService.getSelectedLocationName();
        this.tableDataService = tableDataService;
        this.tableDataService.reset();

        if (tableDataService.importedFile && tableDataService.importedData.length > 0) {
            this.showImportedData = true;
            this.displayData = tableDataService.importedData;
        }

        pLAddReferralsNavigationService.navigateRequested$.pipe(takeUntil(this.destroyed$))
            .subscribe((stepIndex) => {
                if (!tableDataService.importedFile) {
                    this.noFileInputError = true;
                } else if (this.testMappingCompleteness()) {
                    this.confirmContinue(stepIndex);
                }
            });
    }

    ngOnInit() {
        this.myElement.nativeElement.addEventListener('fixture', this.handleFixture);
        this.updateChildTables();
    }

    ngOnDestroy() {
        // prevent memory leak when component destroyed
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    updateChildTables() {
        this.tableDataSubject.next('');
    }

    prefixIDs(data: any[], col: number, startRow: number): any[] {
        const prefix = new Date().getTime();
        for (let i = startRow; i < data.length; i++) {
            const row = data[i];
            if (row[col].length) {
                row[col] = prefix + row[col];
            }
        }
        return data;
    }

    // backdoor to bypass file upload and receive fixture data directly from Cypress via an event.
    // At this point we only handle CSVs.
    // If an idColumn and startRow are specified, the IDs in that data column will be prefixed by a
    // session ID to avoid duplicates with existing test data
    handleFixture = (event: any) => {
        const blob = event.detail.blob;
        this.plImport.papaParseFile(blob).pipe(takeUntil(this.destroyed$)).subscribe(
            (sheets: ImportedSheet[]) => {
                this.tableDataService.importedFile = blob;
                this.showImportedData = true;
                if (typeof event.detail.idColumn === 'number') {
                    sheets[0].values = this.prefixIDs(sheets[0].values, event.detail.idColumn, event.detail.startRow);
                }
                this.setData(sheets[0]);
                this.loadingFile = false;
            },
            (error: any) => {
                console.log('error parsing blob: ', blob);
            },
        );
    }

    testMappingCompleteness() {
        this.unmappedFields = this.tableDataService.findUnmappedFields();
        const complete = this.unmappedFields.length === 0;
        this.missingFieldsError = !complete;
        this.missingFields = `Map the required PresenceLearning label(s) to a column in your spreadsheet: ${this.unmappedFields.join(', ')}`;
        this.dataColumnsUnmapped = this.tableDataService.findUnmappedColumn();
        return complete;
    }

    confirmContinue(stepIndex: number) {
        const referralCount = this.tableDataService.getReferralAttemptCount();
        this.plConfirm.show({
            header: 'Confirm Referral Upload',
            content: `<div style="padding-bottom:12px;">You are about to add ${referralCount} referrals to:</div>
                        <div style="padding-bottom:12px;font-weight:bold;">${this.locationName}</div>
                        ${this.buildErrorsConfirmMessage()}
                        <br/>
                        <div>Do you wish to continue?</div>`,
            primaryLabel: 'Continue',
            secondaryLabel: 'Make Corrections',
            primaryCallback: () => {
                this.tableDataService.importData();
                this.pLAddReferralsNavigationService.confirmNavigate(stepIndex);
            },
            secondaryCallback: () => {
                // console.log('Making corrections...');
            },
        });
    }

    importNewFile() {
        this.plConfirm.show({
            header: 'Import New File',
            content: `<div>Importing a new file will replace the existing file and replace all the imported fields.
                      Are you sure you want to import a new file?</div>`,
            primaryLabel: 'Yes',
            secondaryLabel: 'No',
            primaryCallback: () => {
                this.tableDataService.reset();
                this.showImportedData = false;
                this.missingFieldsError = false;
            },
            secondaryCallback: () => {
                // console.log('Not uploading new file');
            },
        });
    }

    setData(data: ImportedSheet) {
        let cleanedData = this.parseRichText(data.values);
        cleanedData = this.cleanTopTemplateInstructions(cleanedData);
        this.tableDataService.setData(cleanedData);
        this.tableDataService.setDataFormats(data.formats);
        this.displayData = cleanedData
            .map(row => row.slice(0, this.tableDataService.endCol + 1))
            .slice(0, this.tableDataService.endRow + 1);
        this.testMappingCompleteness();
        this.hasEditedData = false;
    }

    onSheetChange(evt: any) {
        this.confirmSheetChange(evt.oldVal, evt.model);
    }

    confirmSheetChange(prevSheet: string, newSheet: string) {
        this.plConfirm.show({
            header: 'Change Sheet',
            content: `<div>If you leave this sheet "${prevSheet}", your changes will not be saved. <br /><br />
                      Are you sure you want to change sheets?</div>`,
            primaryLabel: 'Continue',
            secondaryLabel: 'Cancel',
            primaryCallback: () => {
                this.setData(this.tableDataService.selectSheet(newSheet));
                this.validateImportedReferals();
            },
            secondaryCallback: () => {
                this.tableDataService.currentSheetName = prevSheet;
            },
            closeCallback: () => {
                this.tableDataService.currentSheetName = prevSheet;
            },
        });
    }

    onFileChange(val: any) {
        this.displayData = [];
        this.tableDataService.importedData = [];
        this.noFileInputError = false;
        this.loadingFile = true;

        const errorToast = (msg: string) => {
            this.plToast.show('error', msg);
        };

        if (!val.model.file || !val.model.file.size) {
            errorToast(
                'Oops, something went wrong. Please try again. If the problem persists, please contact us for support.',
            );
            this.loadingFile = false;
        } else if (val.model.file.size > this.MAX_FILE_SIZE_MB * 1024 * 1024) {
            this.tableDataService.importedFile = null;
            errorToast(`
                The file you selected exceeds ${this.MAX_FILE_SIZE_MB} MB.
                Please select a smaller file and try again.`);
            this.loadingFile = false;
        } else {
            this.plImport.parseFile(val.model.file).pipe(takeUntil(this.destroyed$)).subscribe(
                (sheets: ImportedSheet[]) => {
                    this.tableDataService.setSheets(sheets);
                    this.showImportedData = true;
                    this.setData(sheets[0]);
                    this.loadingFile = false;
                    this.isViewingErrors = false;
                    this.validateImportedReferals();
                },
                (error: any) => {
                    if (error === this.plImport.UNSUPPORTED) {
                        errorToast('The file type you selected is not supported. Please upload an Excel file.');
                    } else {
                        errorToast(
                            'Oops, something went wrong. Please try again. If the problem persists, please contact ' +
                            'us for support.',
                        );
                    }
                    this.loadingFile = false;
                },
            );
        }
    }

    validateImportedReferals() {
        this.tableDataService.importData();
        this.buildLocalErrorsRows();
    }

    buildLocalErrorsRows() {
        this.errorRows = [];
        this.warningRows = [];
        this.warningRows = this.warningRows.concat(this.tableDataService.duplicateRows);
        this.errorRows = this.errorRows.concat(this.tableDataService.incompleteRows);
        this.errorRows = this.errorRows.concat(this.tableDataService.invalidRows);
        this.conflictRows = this.tableDataService.templateErrorRows;
    }

    toggleViewErrors() {
        this.isViewingErrors = !this.isViewingErrors;
    }

    buildErrorsConfirmMessage(): string {
        const incompletesErrorsMessage = this.tableDataService.incompleteRows.length ? `
            <div>
                ${this.tableDataService.incompleteRows.length} Referrals with missing required information
            </div>
        ` : '';

        const duplicatesMessage = this.tableDataService.duplicateRows.length ? `
            <div>
                ${this.tableDataService.duplicateRows.length} Duplicates within spreadsheet
            </div>
        ` : '';

        const invalidErrorMessage = this.tableDataService.invalidRows.length ? `
            <div>
                ${this.tableDataService.invalidRows.length} Referrals with invalid data
            </div>
        ` : '';

        return this.conflictRows.length ? `
            <div style="padding-bottom:12px;">
                Problems found with imported data:
                <div>
                    ${incompletesErrorsMessage}
                    ${duplicatesMessage}
                    ${invalidErrorMessage}
                </div>
                <div>These ${this.conflictRows.length} Referrals will not be uploaded.</div>
            </div>
        ` : '';
    }

    onColumnChanged(event: any) {
        this.tableDataService.mappings = event;
        this.validateImportedReferals();
        this.testMappingCompleteness();
    }

    cleanTopTemplateInstructions(data: any[]) {
        return data.map((row: string[]) => {
            if (this.isTempateInstructionRow(row)) {
                return row.map((cell: string) => '');
            }
            return row;
        });
    }

    isTempateInstructionRow(row: string[]) {
        return this.tableDataService.templateInstructionRows.includes(row.join('').trim());
    }

    parseRichText(data: any[]) {
        return data.map((row: string[]) => {
            return row.map((cell: any) => {
                if (typeof cell !== 'string') {
                    const richText = cell.text();
                    return richText || '';
                }
                return cell;
            });
        });
    }

    onCellChanged(event: any) {
        this.tableDataService.importedData = event.newData;
        this.displayData = this.tableDataService.importedData;
        this.hasEditedData = true;
        this.validateImportedReferals();
        if (this.conflictRows.length === 0) {
            this.isViewingErrors = false;
        }
    }

    downloadEdited() {
        const data = this.tableDataService.headerRow > -1 ?
            this.tableDataService.importedData.slice(this.tableDataService.headerRow + 1) :
            this.tableDataService.importedData;
        this.plSpreadsheet.generateEditedWorkbook(data, this.locationName);
    }

    onRowClear(event: any) {
        this.plConfirm.show({
            header: 'Clear Row Data',
            content: `<div>Are you sure you want to clear all the data in row ${event.rowNumber}?</div>`,
            primaryLabel: 'Continue',
            secondaryLabel: 'Cancel',
            primaryCallback: () => {
                this.onCellChanged(event);
            },
            secondaryCallback: () => {},
        });
    }
}
