import  * as moment from 'moment';
import {
    Input,
    OnInit,
    Output,
    Component,
    EventEmitter,
} from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { PLTimeBlock, PLTimeFrame } from '@common/interfaces';
import { PLTimezoneService } from '@root/src/lib-components';

// TODO: Refactor? and used on Master Schedule

@Component({
    selector: 'pl-date-time-range',
    templateUrl: './pl-date-time-range.component.html',
    styleUrls: ['./pl-date-time-range.component.less'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: PLDateTimeRangeComponent,
            multi: true,
        },
    ],
})
export class PLDateTimeRangeComponent implements ControlValueAccessor, OnInit {
    range: PLTimeFrame;

    formats = {
        time: {
            default: 'HH:mm',
            API: 'HH:mm:ss',
            display: 'hh:mm A',
        },
        date: {
            default: 'YYYY-MM-DD',
            display: 'ddd MMM D, YYYY',
        },
    };

    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    invalid: boolean;
    errorMessages: { key: string; message: string; }[];

    @Input() timezone: string;
    @Input() duration = 30;
    @Input() maxDuration = 24;
    @Input() showDate = true;
    @Input() readonly = false;
    @Input() disabled = false;
    @Input() vertical: boolean;
    @Input() startWidth: number;
    @Input() endWidth: number;
    @Input() inlineErrors: boolean;
    @Input() value: { start: string; end?: string; };
    @Output() readonly errors: EventEmitter<{ key: string, message: string }[]> = new EventEmitter();
    @Output() readonly valueChange: EventEmitter<{ start: string; end?: string; }> = new EventEmitter();

    constructor(private plTimezone: PLTimezoneService) { }

    ngOnInit() {
        this.afterValueChanged();
    }

    private afterValueChanged() {
        const { start, end } = this.value;
        this.setRange(start, end);
        this.createDateTimes();
        this.validate();
    }

    private createDateTimes() {
        const { start, end } = this.range;
        if (this.showDate) {
            this.startDate = this.formatDate(start);
            this.endDate = this.formatDate(end);
        }
        this.startTime = this.formatTime(start);
        this.endTime = this.formatTime(end);
    }

    private setEnd(start: moment.Moment) {
        return start.clone().add(this.duration, 'm');
    }

    validate() {
        const { start, end } = this.range;
        const errors = [];
        // TODO: Add validations for required
        // Max Range duration
        const hourDiff: number = end.diff(start, 'hours');
        if(this.maxDuration && hourDiff >= this.maxDuration) {
            errors.push({ 
                key: 'maxDuration', 
                message: `Please select duration less then ${this.maxDuration} hours.` 
            });
        }
        if (end.isSameOrBefore(start)) {
            errors.push({ 
                key: 'endBefore', 
                message: 'End must be after start.' 
            });
        }
        this.invalid = errors.length > 0;
        this.errorMessages = errors;
        this.errors.emit(errors);
    }

    writeValue(value: PLTimeBlock) {
        this.value = value;
        this.afterValueChanged();
    }

    registerOnChange(fn: any) {

    }

    registerOnTouched(fn: any) {

    }

    setDisabledState(isDisabled: boolean) {
        this.disabled = isDisabled;
    }

    manageChange(type: string, value: string, isStart = true) {
        let { start, end } = this.range;
        const time = type === 'time' ? value : isStart ? this.startTime : this.endTime;
        const date = type === 'date' ? value : isStart ? this.startDate : this.endDate;
        const dateTime = moment.tz(`${date} ${time}`, this.timezone);
        if (isStart) {
            if (type === 'date') {
                const days = dateTime.diff(start, 'days');
                end.add(days, 'days');
            }
            start = dateTime;
            if (type === 'time') {
                end = this.setEnd(start);
            }
        } else {
            end = dateTime;
        }
        this.setValue({ start, end });
        this.afterValueChanged();
    }

    setRange(_start: string, _end?: string) {
        const start = moment(_start).tz(this.timezone);
        let end;
        if (_end) {
            end = moment(_end).tz(this.timezone);
            this.duration = end.diff(start, 'm');
        } else {
            end = this.setEnd(start);
        }
        this.range = { start, end };
    }

    setValue(range: PLTimeFrame) {
        const { start, end } = range;
        this.value = {
            start: start.format(this.plTimezone.formatDateTime),
            end: end.format(this.plTimezone.formatDateTime),
        };
        this.valueChange.emit(this.value);
    }

    formatTime(time: moment.Moment) {
        return time.format(this.formats.time.default);
    }

    formatDate(date: moment.Moment) {
        return date.format(this.formats.date.default);
    }
}
