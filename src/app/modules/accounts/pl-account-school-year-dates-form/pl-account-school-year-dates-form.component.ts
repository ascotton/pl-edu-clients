import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';

@Component({
    selector: 'pl-account-school-year-dates-form',
    templateUrl: './pl-account-school-year-dates-form.component.html',
    styleUrls: ['./pl-account-school-year-dates-form.component.less'],
})
export class PLAccountSchoolYearDatesFormComponent implements OnInit {
    
    @Input() dates: any;
    @Input() onSave: Function;

    @ViewChild('inputDatePickers') inputDatePickers: ElementRef;
    @ViewChild('inputDatePickersESY') inputDatePickersESY: ElementRef;

    closeDatePicker1 = false;
    closeDatePicker2 = false;
    closeDatePicker3 = false;
    closeDatePicker4 = false;
    datePickersArray: string[]  = [
        'closeDatePicker1', 'closeDatePicker2', 'closeDatePicker3', 'closeDatePicker4'
    ];
    schoolYears: string[] = [];
    targetEventInDatePicker: boolean;

    ngOnInit(): void {
        this.loadSchoolYearsForDatePickers();
    }

    onClickSave() {
        this.onSave({
            dates: this.dates,
        });
    }

    /**
     * When the target event is not anymore in the date picker; close the picker.
     * It means that the user is not anymore interacting within it.
     */
    onClickModal(evt: MouseEvent) {
        if (!this.isTargetEventInDatePicker(evt)) {
            this.datePickersArray.forEach((datePicker) => {
                this[datePicker] = true;
            });
        }
    }

    /**
     * If the user is interacting in a date picker, leave that picker open and close the rest
     */
    onFocusInDatePicker(evt: any, datePickerNumber: number) {
        if (this.isTargetEventInDatePicker(evt)) {
            this.datePickersArray.forEach((datePicker, index) => {
                let closeDatePicker = true;

                if (datePickerNumber === index + 1) { // Don't close the date picker chosen.
                    closeDatePicker = !closeDatePicker;
                }

                this[datePicker] = closeDatePicker;
            });
        }
    }

    /**
     * Validate whether the events are within the date picker or not.
     * option class name is a special scenario for when the user chosses month and years.
     */
    private isTargetEventInDatePicker(evt: any): boolean {
        let isOptionInClassName;

        try {
            isOptionInClassName = evt.target.className.includes('option');
        } catch (error) {
            isOptionInClassName = false;
        }

        return (
            isOptionInClassName ||
            this.inputDatePickers.nativeElement.contains(evt.target) ||
            this.inputDatePickersESY.nativeElement.contains(evt.target)
        );
    }

    private loadSchoolYearsForDatePickers() {
        for(let dateProp in this.dates) {
            if (this.dates[dateProp].date) {
                this.schoolYears.push(this.dates[dateProp].date.slice(0, 4));
            } else {
                this.schoolYears.push(moment().year().toString());
            }
        }
    }
}
