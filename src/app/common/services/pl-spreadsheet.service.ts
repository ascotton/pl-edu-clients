declare var require: any;

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PLAddReferralsDataTableService } from '@modules/add-referrals/pl-add-referrals-table-data.service';
import { PLStylesService } from '@root/index';
const moment = require('moment');

@Injectable()
export class PLSpreadsheetService {
    // temporarily using require until typings are created for xlsx-populate
    xlsxPop = require('xlsx-populate/browser/xlsx-populate.js');
    white = this.plStyles.getColorForName('white');
    slate = this.plStyles.getColorForName('slate-lighter');
    gray = this.plStyles.getColorForName('gray-lighter');
    grayLightest = this.plStyles.getColorForName('gray-lightest');

    nameChangeFields = ['newLast', 'oldLast', 'newFirst', 'oldFirst'];
    nameChangeHeaders = ['Last Name', 'Last Name (former)', 'First Name', 'First Name (former)'];
    errorSummaryFields = [
        'lastName', 'firstName', 'externalId', 'birthday', 'grade', 'providerTypeCode', 'productTypeCode', 'duration', 'frequency', 'interval', 'grouping',
    ];
    templateFields = [
        'lastName', 'firstName', 'externalId', 'birthday', 'grade', 'providerTypeCode', 'productTypeCode', 'duration', 'frequency', 'interval', 'grouping', 'primaryLanguageCode', 'esy', 'notes',
    ];
    studentListFields = ['lastName', 'firstName', 'externalId', 'birthday'];
    errorHeaders: any[] = [];
    templateHeaders: any[] = [];
    maxCols = 0;

    constructor(private tableDataService: PLAddReferralsDataTableService, private plStyles: PLStylesService) {
        this.errorHeaders = this.errorSummaryFields.map(
            (key: string) => {
                const label = this.tableDataService.getFieldLabelForKey(key);
                return label ? label : key;
            },
        );
        this.errorHeaders.push('Error Reason');
        this.templateHeaders = this.templateFields.map((key: string) => {
            const label = this.tableDataService.getFieldLabelForKey(key);
            return label ? label : key;
        });
        this.maxCols = this.errorHeaders.length;
    }

    private generateDownload(workbook: any, reportName: string, locationName: string, timestamp: string) {
        const filename = `${reportName} - ${locationName} - ${timestamp}.xlsx`;
        workbook.outputAsync().then((blob: any) => {
            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                // If IE, you must uses a different method.
                window.navigator.msSaveOrOpenBlob(blob, filename);
            } else {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                document.body.appendChild(a);
                a.href = url;
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        });
    }

    private addIntroText(text: string, backgroundColor: string, rowStart: number, cols: number, sheet: any) {
        let row = rowStart;
        row++; // next row
        let range = sheet.range(row, 1, row, 1);
        range.value([[text]]);
        range = sheet.range(row, 1, row, cols);
        range.style('fill', backgroundColor);
        range.style({ bold: true });
        range.style('fontColor', this.white);
        return row;
    }

    private addHeaders(headers: string[], rowStart: number, sheet: any) {
        let row = rowStart;
        row++; // next row
        const range = sheet.range(row, 1, row, headers.length);
        range.value([headers]);
        range.style({ bold: true });
        range.style('fill', this.slate);
        range.style('borderStyle', 'thin');
        range.style('borderColor', this.gray);
        return row;
    }

    private addData(headers: string[], data: any[][], rowStart: number, sheet: any) {
        let row = this.addHeaders(headers, rowStart, sheet);
        row++; // next row
        const range = sheet.range(row, 1, (row + data.length - 1), data[0].length);
        range.value(data);
        range.style('fill', this.plStyles.getColorForName('gray-really-light'));
        range.style('borderStyle', 'thin');
        range.style('borderColor', this.gray);
        return row;
    }

    private addNameChangeSection(nameChangeData: any[][], rowStart: number, sheet: any) {
        let row = this.addIntroText('Names that were changed', this.plStyles.getColorForName('green'),
            rowStart, this.nameChangeHeaders.length, sheet);
        row = this.addData(this.nameChangeHeaders, nameChangeData, row, sheet);
        // skip the added rows
        row += nameChangeData.length;

        return row;
    }

    private addErrorSection(errorData: any[][], rowStart: number, sheet: any) {
        let row = this.addIntroText('Referrals that were not added and need attention or review.',
            this.plStyles.getColorForName('red'), rowStart, this.errorHeaders.length, sheet);
        row = this.addData(this.errorHeaders, errorData, row, sheet);
        // skip the added rows
        row += errorData.length;

        return row;
    }

    private addWarningSection(warningData: any[][], rowStart: number, sheet: any) {
        let row = this.addIntroText('Referrals that were not added, no action required.',
            this.plStyles.getColorForName('yellow'), rowStart, this.errorHeaders.length, sheet);
        row = this.addData(this.errorHeaders, warningData, row, sheet);
        return row;
    }

    private addEditedReferralsSection(editedData: any[][], rowStart: number, sheet: any) {
        let row = this.addIntroText('Referrals that were edited in the platform.',
            this.plStyles.getColorForName('green'), rowStart, this.templateHeaders.length, sheet);
        row = this.addData(this.templateHeaders, editedData, row, sheet);
        return row;
    }

    private buildWorkbook(
        nameChangeData: any[][],
        errorData: any[][],
        warningData: any[][],
        locationName: string,
        timestamp: string,
    ) {
        return new Observable((observer: any) => {
            this.xlsxPop.fromBlankAsync().then(
                (workbook: any) => {
                    const sheet = workbook.sheet(0);
                    let row = 1;

                    const title = `Upload Referrals - referrals not added for ${locationName} on ${timestamp}`;
                    let range = sheet.range(row, 1, row, 1);
                    range.value([[title]]);

                    // add a blank row and this.white fill
                    range = sheet.range(row, 1, ++row, this.maxCols);
                    range.style('fill', this.white);

                    if (nameChangeData.length > 0) {
                        row = this.addNameChangeSection(nameChangeData, row, sheet);
                        // add a white blank row if there's a warningData section coming up
                        if (errorData.length > 0) {
                            range = sheet.range(row, 1, row, this.maxCols);
                            range.style('fill', this.white);
                        }
                    }

                    if (errorData.length > 0) {
                        row = this.addErrorSection(errorData, row, sheet);
                        // add a white blank row if there's a warningData section coming up
                        if (warningData.length > 0) {
                            range = sheet.range(row, 1, row, this.maxCols);
                            range.style('fill', this.white);
                        }
                    }

                    if (warningData.length > 0) {
                        row = this.addWarningSection(warningData, row, sheet);
                    }

                    // set all column widths of data fields to 20
                    for (let i = 1; i < this.maxCols; i++) {
                        sheet.column(i).width(20);
                    }

                    // set column width of final column, errorReason, to 100
                    sheet.column(this.maxCols).width(100);

                    // set global font size
                    range = sheet.usedRange();
                    range.style({ fontSize: 14 });

                    // set the tile font size
                    range = sheet.range(1, 1, 1, 1);
                    range.style('fontSize', 18);

                    observer.next(workbook);
                },
            );
        });
    }

    generateErrorSummary(nameChangeRows: any[], errorRows: any[], warningRows: any[], locationName: string) {
        const timestamp = new Date().toLocaleString();
        const reportName = 'ReferralResults';

        const nameChangeData = nameChangeRows.map((row: any) => {
            const rowArray = this.nameChangeFields.map(key => row[key]);
            return rowArray;
        });

        const errorData = errorRows.map((row: any) => {
            const rowArray = this.errorSummaryFields.map(key => row.original[key]);
            rowArray.push(row.errorReason);
            return rowArray;
        });

        const warningData = warningRows.map((row: any) => {
            const rowArray = this.errorSummaryFields.map(key => row.original[key]);
            rowArray.push(row.errorReason);
            return rowArray;
        });

        this.buildWorkbook(nameChangeData, errorData, warningData, locationName, timestamp).subscribe(
            (workbook: any) => {
                this.generateDownload(workbook, reportName, locationName, timestamp);
            },
        );
    }

    generateStudentList(data: any[], locationName: string) {
        const timestamp = new Date().toLocaleString();
        const reportName = 'ReferralResults';

        this.buildStudentsWorkbook(data).subscribe(
            (workbook: any) => {
                this.generateDownload(workbook, reportName, locationName, timestamp);
            },
        );
    }

    generateEditedWorkbook(data: any[], locationName: string) {
        const timestamp = new Date().toLocaleString();
        const reportName = 'ReferralEdited';

        this.buildEditedReferralsWorkbook(data, locationName, timestamp).subscribe(
            (workbook: any) => {
                this.generateDownload(workbook, reportName, locationName, timestamp);
            },
        );
    }

    getTemplateWorkbook() {
        const that = this;
        return new Promise(function (resolve, reject) {
            var req = new XMLHttpRequest();
            var url = 'https://cdn.presencelearning.com/statics/PL-Referrals-Template.xlsx';
            req.open('GET', url, true);
            req.responseType = 'arraybuffer';
            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    if (req.status === 200) {
                        resolve(that.xlsxPop.fromDataAsync(req.response));
                    } else {
                        reject('Received a ' + req.status + ' HTTP code.');
                    }
                }
            };
            req.send();
        });
    }

    private buildStudentsWorkbook(data: any[][]) {
        return new Observable((observer: any) => {
            this.getTemplateWorkbook().then(
                (workbook: any) => {
                    const sheet = workbook.sheet(0);
                    const firstDataRow = 6;

                    if (data.length > 0) {
                        data = data.map((row: any) => {
                            return this.studentListFields.map(key => row[key]);
                        });
                        const range = sheet.range(firstDataRow, 1, (firstDataRow + data.length - 1), data[0].length);
                        range.value(data);
                        // change date strings to date format
                        for (let i = 0; i < data.length; i++) {
                            const value = sheet.column('D').cell(firstDataRow + i).value();
                            sheet.column('D').cell(firstDataRow + i).value(moment(value).format('MM/DD/YYYY'));
                        }
                    }

                    observer.next(workbook);
                },
            );
        });
    }

    private buildEditedReferralsWorkbook(data: any[][], locationName: string, timestamp: string) {
        return new Observable((observer: any) => {
            this.xlsxPop.fromBlankAsync().then(
                (workbook: any) => {
                    const sheet = workbook.sheet(0);
                    let row = 1;

                    const title = `Upload Referrals - referrals edited for ${locationName} on ${timestamp}`;
                    let range = sheet.range(row, 1, row, 1);
                    range.value([[title]]);

                    // add a blank row and this.white fill
                    range = sheet.range(row, 1, ++row, this.templateHeaders.length);
                    range.style('fill', this.white);

                    if (data.length > 0) {
                        row = this.addEditedReferralsSection(data, row, sheet);
                    }

                    // set all column widths of data fields to 20
                    for (let i = 1; i < this.templateHeaders.length; i++) {
                        sheet.column(i).width(20);
                    }

                    // set column width of final column, errorReason, to 100
                    sheet.column(this.templateHeaders.length).width(100);

                    // set global font size
                    range = sheet.usedRange();
                    range.style({ fontSize: 14 });

                    // set the tile font size
                    range = sheet.range(1, 1, 1, 1);
                    range.style('fontSize', 18);

                    observer.next(workbook);
                },
            );
        });
    }
}
