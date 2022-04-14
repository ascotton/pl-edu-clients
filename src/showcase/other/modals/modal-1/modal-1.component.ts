import { Component } from '@angular/core';

@Component({
    selector: 'modal-1',
    templateUrl: './modal-1.component.html',
    styleUrls: ['./modal-1.component.less'],
})
export class Modal1Component {
    headerText: string = '';
    onCancel: Function;
    onSave: Function;

    models: any = {};
    selectOptsColors: any[] = [{ value: 'blue', label: 'blue' }, { value: 'red', label: 'red' }];

    constructor() {}

    cancel() {
        this.onCancel();
    }

    save() {
        this.onSave({ models: this.models });
    }
}
