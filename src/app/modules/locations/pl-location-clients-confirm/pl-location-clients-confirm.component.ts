import { Component, Input } from '@angular/core';
import { PLSpreadsheetService } from '@common/services/pl-spreadsheet.service';

@Component({
    selector: 'pl-location-clients-confirm',
    templateUrl: './pl-location-clients-confirm.component.html',
    styleUrls: ['./pl-location-clients-confirm.component.less'],
    providers: [PLSpreadsheetService],
})
export class PLLocationClientsConfirmComponent {
    @Input() data: any[][] = [];
    @Input() location: string;
    @Input() schoolYearString: string;
    @Input() clientStudentCapital: string;
    @Input() onCancel: Function;

    constructor(private plSpreadsheet: PLSpreadsheetService) {}

    cancel() {
        this.onCancel();
    }

    confirm() {
        this.plSpreadsheet.generateStudentList(this.data, this.location);
        this.onCancel();
    }
}