import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

import { PLSchoolYearsService } from '@common/services/';

import { Option } from '@common/interfaces';

@Component({
    selector: 'pl-schoolyear-select',
    templateUrl: './pl-schoolyear-select.component.html',
    styleUrls: ['./pl-schoolyear-select.component.less'],
    inputs: ['simpleSelect'],
})
export class PLSchoolyearSelectComponent {
    // TODO: consider removing this
    @Output() onYearSelected = new EventEmitter<any>();

    @Input() selectedSchoolYear: string = null;
    // by default, the option value is school year code
    // override it to use id
    @Input() useValueId: boolean;

    // this emitter is nominally related to selectedSchoolYear
    // and allows the parent component to declaratively express a 2-way binding
    // via <pl-schoolyear-select [(selectedSchoolYear)]="schoolYear"...
    // without implementing an event handler onYearSelected()
    @Output() readonly selectedSchoolYearChange = new EventEmitter<string>();
    @Input() disableSchoolYears = false;

    currentUser: User;
    simpleSelect = false;
    yearsSubscription: Subscription;
    schoolYearOpts: Option[] = [];
    loadingYears = true;

    allTimeOption: Option = {
        value: 'all_time',
        label: 'All Time',
    };

    constructor(
        private yearsService: PLSchoolYearsService,
        private store: Store<AppStore>,
    ) { }

    ngOnInit() {
        this.store.select('currentUser')
            .subscribe((user: any) => {
                this.currentUser = user;
            });
        this.yearsSubscription = this.yearsService.getYearsData().subscribe(
            (result: any) => {
                this.loadingYears = false;
                setTimeout(() => {
                    if (this.useValueId) {
                        this.schoolYearOpts = this.yearsService.getYearOptions()
                            .map((obj: any) => ({ label: obj.label, value: obj.id }));
                    } else {
                        this.schoolYearOpts = this.yearsService.getYearOptions();
                    }
                    if (!this.simpleSelect) {
                        this.schoolYearOpts.push(this.allTimeOption);
                    }
                    this.schoolYearOpts = this.schoolYearOpts.reverse().slice(0, 5);
                }, 0);
            },
        );

        this.yearsService.getCurrentSchoolYearCode().subscribe(
            (res: any) => {
                if (!this.selectedSchoolYear) {
                    this.selectedSchoolYear = res;
                }
            },
        );
    }

    yearSelected(event: any) {
        const label = this.schoolYearOpts.find(element => element.value === event.model).label;
        // emit the value for for 2-way binding
        this.selectedSchoolYearChange.emit(event.model);
        this.onYearSelected.emit({ ...event, name: label });
    }
}
