import { PLUrlsService } from '@root/index';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'pl-fte-over-hours-survey',
    templateUrl: './pl-fte-over-hours-survey.component.html',
    styleUrls: ['./pl-fte-over-hours-survey.component.less']
})
export class PLFTEOverHoursSurveyComponent {
    @Input() date: string = '';
    @Input() school: any = {};
    @Input() inCalendarWeekView = false;

    @Output() onDone = new EventEmitter<any>();

    urls: any;
    reasons: any = {
        presets: [],
        other: '',
    };
    optsReasons = [
        { value: 'additional_students', label: 'Was assigned additional students' },
        { value: 'make_up_time', label: 'Make-up time from earlier' },
        { value: 'new_evaluations', label: 'Given additional evaluations' },
        { value: 'need_school_access', label: 'Need access to school information systems' },
    ];
    message: string = '';
    delimiter: string = ', ';

    constructor(private plUrls: PLUrlsService) { }

    ngOnInit() {
        this.urls = this.plUrls.urls;
        if (this.school && this.school.reason) {
            this.setReason(this.school.reason);
        }
    }

    ngOnChanges() {
        if (this.school && this.school.reason) {
            this.setReason(this.school.reason);
        }
    }

    setReason(reason: string) {
        if (reason.length) {
            let reasons = [reason];
            if (reason.includes(this.delimiter)) {
                reasons = reason.split(this.delimiter);
            }
            const reasonValues = this.optsReasons.map((reason1) => {
                return reason1.value;
            });
            const reasonsToSet: any = {
                presets: [],
                other: '',
            };
            reasons.forEach((reason1) => {
                if (reasonValues.includes(reason1)) {
                    reasonsToSet.presets.push(reason1);
                } else {
                    reasonsToSet.other += reason1;
                }
            });
            this.reasons = reasonsToSet;
        }
    }

    reset() {
        this.reasons = {
            presets: [],
            other: ''
        };
    }

    submit() {
        this.message = '';
        const reasons = this.reasons.presets.length ? this.reasons.presets : [];
        if (this.reasons.other.length) {
            reasons.push(this.reasons.other);
        }
        if (reasons.length) {
            this.reset();
            this.onDone.emit({ school: this.school, reason: reasons.join(this.delimiter)});
        } else {
            this.message = "Please select at least one reason.";
        }
    }

    cancel() {
        this.reset();
        this.onDone.emit({ school: this.school });
    }
};
