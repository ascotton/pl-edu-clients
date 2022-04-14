import {
    Component,
    OnInit,
    Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({ 
    templateUrl: './pl-upload-summary.component.html',
})
export class PLUploadSummaryComponent implements OnInit {

    csvUrl: string;

    constructor(
        public dialogRef: MatDialogRef<PLUploadSummaryComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { csv: string, count: { error: number; success: number } }) { }

    ngOnInit() {
        const blob = new Blob([this.data.csv], { type: 'text/csv;charset=utf-8;' });
        this.csvUrl = URL.createObjectURL(blob);
    }

    close() {
        this.dialogRef.close();
    }
}
