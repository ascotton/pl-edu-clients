import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    templateUrl: './pl-confirm-dialog.component.html',
    styleUrls: ['./pl-confirm-dialog.component.less'],
})
export class PLConfirmDialog2Component {
    constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
