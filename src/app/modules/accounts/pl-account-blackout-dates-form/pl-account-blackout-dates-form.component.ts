import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
    selector: 'pl-account-blackout-dates-form',
    templateUrl: './pl-account-blackout-dates-form.component.html',
    styleUrls: ['./pl-account-blackout-dates-form.component.less'],
})

export class PLAccountBlackoutDatesFormComponent {
    @Input() year: number;
    @Input() dates: any;
    @Input() onSave: Function;

    datesFormGroup: FormGroup = new FormGroup({});

    onClickSave() {
        Object.keys(this.dates).forEach((k: any) => {
            if (this.dates[k] && !Array.isArray(this.dates[k])) {
                this.dates[k] = this.dates[k].split(',');
            } else if (!this.dates[k]) {
                this.dates[k] = [];
            }
        });

        this.onSave({
            dates: this.dates,
        });
    }
}
