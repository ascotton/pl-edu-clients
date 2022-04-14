import * as moment from 'moment';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Option } from '@common/interfaces';
import { PLTimezoneService } from '@root/index';
import { PLRepeatingRuleValue } from '../../models';

interface PLRepeatingRule {
    frequency: string;
    interval?: number;
    repeats?: boolean;
    end: {
        type: string;
        count?: number;
        datetime?: any;
    };
    daily: {
        interval?: any;
    };
    weekly: {
        interval?: any;
        byweekday?: any;
    };
    monthly: {
        by?: any;
        interval?: any;
        bymonthday?: any;
        byweekday?: any;
        bysetpos?: any;
    };
    yearly: {
        by?: any;
        interval?: any;
        bymonth?: string;
        bysetpos?: any;
        byweekday?: any;
        bymonthday?: any;
    };
}

@Component({
    selector: 'pl-repeat-rule',
    templateUrl: './pl-repeat-rule.component.html',
    styleUrls: ['./pl-repeat-rule.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLRepeatRuleComponent implements OnInit, OnChanges {
    // TODO: refactor all logic regarding recurrence_params to common component

    mStart: moment.Moment;
    rruleInput: PLRepeatingRule;
    repeatSelection = 'norepeat';
    monthdayOpts: Option[] = this.makeNumberOpts(30);
    weeklyIntervalOpts: Option[] = this.makeNumberOpts(12);
    monthlyIntervalOpts: Option[] = this.makeNumberOpts(6);
    frequencyOpts: Option[] = [
        { value: 'DAILY', label: 'days' },
        { value: 'WEEKLY', label: 'weeks' },
        { value: 'MONTHLY', label: 'months' },
        { value: 'YEARLY', label: 'years' },
    ];
    byweekdayOpts: Option[] = [
        { value: 6, label: 'Su' },
        { value: 0, label: 'Mo' },
        { value: 1, label: 'Tu' },
        { value: 2, label: 'We' },
        { value: 3, label: 'Th' },
        { value: 4, label: 'Fr' },
        { value: 5, label: 'Sa' },
    ];
    bysetposOpts: Option[] = [
        { value: 1, label: 'First' },
        { value: 2, label: 'Second' },
        { value: 3, label: 'Third' },
        { value: 4, label: 'Fourth' },
        { value: -1, label: 'Last' },
    ];
    monthOpts: Option[] = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];
    endOpts: Option[] = [
        { value: 'never', label: 'Never' },
        { value: 'count', label: 'After' },
        { value: 'datetime', label: 'On' },
    ];
    monthlyRepeatBy: Option[] = [
        { value: 'dayOfMonth', label: 'Day' },
        { value: 'dayOfWeek', label: 'The' },
    ];
    repatingOpts: Option[] = [];

    @Input() start: string;
    @Input() end: string;
    @Input() timezone: string;
    @Input() value: PLRepeatingRuleValue = {};
    @Input() horizontal: boolean;
    @Output() readonly valueChange: EventEmitter<PLRepeatingRuleValue> = new EventEmitter();
    @Output() readonly valid: EventEmitter<boolean> = new EventEmitter();

    constructor(private plTimezone: PLTimezoneService) {}

    ngOnInit() {
        this.mStart = this.plTimezone.toUserZone(this.start, '', this.timezone);
        this.rruleInput = this.rruleToInputs(this.value);
        if (this.rruleInput.repeats) {
            this.repeatSelection = 'custom';
        }
        this.initRepeeatingOpts();
    }

    ngOnChanges(changes: SimpleChanges) {
        const { start } = changes;
        if (start) {
            this.initRepeeatingOpts();

            if (this.rruleInput) {
                if (
                    this.value.recurrence_frequency === 'WEEKLY' &&
                    this.rruleInput.weekly.byweekday.length <= 1
                ) {
                    let day = this.mStart.weekday();
                    day = day === 0 ? 6 : day - 1;
                    this.rruleInput.weekly.byweekday = [day];
                    this.change();
                }
            }
        }
    }

    private initRepeeatingOpts() {
        this.mStart = this.plTimezone.toUserZone(this.start, '', this.timezone);
        this.buildRepeatingOpts();
    }

    private getMonthWeek(start: moment.Moment): number {
        let monthWeek = Math.ceil(start.date() / 7);
        if (monthWeek > 4) {
            monthWeek = -1;
        }
        return monthWeek;
    }

    private buildRepeatingOpts() {
        const weekDayName =  this.mStart.format('dddd');
        const monthWeek = this.getMonthWeek(this.mStart);
        const weekPosition = this.bysetposOpts.find(o => o.value === monthWeek);
        this.repatingOpts = [
            { value: 'norepeat', label: 'Does not repeat' },
            { value: 'weekday', label: 'Every weekday (Monday to Friday)' },
            { value: 'weekly', label: `Weekly on ${weekDayName}` },
            { value: 'monthly', label: `Monthly on the ${weekPosition.label} ${weekDayName}` },
            ...(monthWeek >= 4 ?
                [{ value: 'lastmonthly', label: `Monthly on the Last ${weekDayName}` }] : []),
            { value: 'custom', label: 'Custom...' },
        ];
    }

    private rruleToInputs(model: PLRepeatingRuleValue = {}): PLRepeatingRule {
        // Set a default
        const inputs: PLRepeatingRule = {
            frequency: 'WEEKLY',
            interval: 1,
            end: {
                type: 'never',
            },
            daily: {},
            weekly: {
                interval: 1,
                byweekday: [],
            },
            monthly: {},
            yearly: {},
        };
        if (!model.recurrence_frequency) {
            let day = this.mStart.weekday();
            const monthWeek = this.getMonthWeek(this.mStart);

            day = day === 0 ? 6 : day - 1;
            inputs.weekly.byweekday = [day];
            inputs.monthly.by = 'dayOfWeek';
            inputs.monthly.byweekday = day;
            inputs.monthly.bysetpos = this.bysetposOpts.find(o => o.value === monthWeek).value;
            return inputs;
        }
        inputs.repeats = true;
        inputs.frequency = model.recurrence_frequency;
        const rrules = model.recurrence_params ? model.recurrence_params.split(';') : [];
        const rulesObj: any = {};
        rrules.forEach((rule: any) => {
            const keyVal = rule.split(':');
            const key = keyVal[0];
            rulesObj[key] = key === 'byweekday' ? keyVal[1] : parseInt(keyVal[1], 10);
        });

        // End
        if (model.end_recurring_period) {
            inputs.end.type = 'datetime';
            // Backend has a time too, but just want the date.
            inputs.end.datetime = model.end_recurring_period.slice(0, 'YYYY-MM-DD'.length);
        } else if (rulesObj.count) {
            inputs.end.type = 'count';
            inputs.end.count = rulesObj.count;
        }

        let byweekday;
        if (model.recurrence_frequency === 'DAILY') {
            inputs.daily.interval = rulesObj.interval;
            inputs.interval = inputs.daily.interval;
        } else if (model.recurrence_frequency === 'WEEKLY') {
            inputs.weekly.interval = rulesObj.interval;
            inputs.interval = inputs.weekly.interval;
            // This should be required, but prevent errors just in case.
            if (rulesObj.byweekday) {
                byweekday = rulesObj.byweekday.split(',');
                byweekday = byweekday.map((curVal: any) => {
                    return parseInt(curVal, 10);
                });
                inputs.weekly.byweekday = byweekday;
            }
        } else if (model.recurrence_frequency === 'MONTHLY') {
            inputs.monthly.interval = rulesObj.interval;
            inputs.interval = inputs.monthly.interval;
            if (rulesObj.bymonthday) {
                inputs.monthly.by = 'dayOfMonth';
                inputs.monthly.bymonthday = rulesObj.bymonthday;
            } else if (rulesObj.byweekday && rulesObj.bysetpos) {
                inputs.monthly.by = 'dayOfWeek';
                inputs.monthly.byweekday = parseInt(rulesObj.byweekday, 10);
                inputs.monthly.bysetpos = rulesObj.bysetpos;
            }
        } else if (model.recurrence_frequency === 'YEARLY') {
            inputs.yearly.interval = rulesObj.interval;
            inputs.interval = inputs.yearly.interval;
            if (rulesObj.bymonthday) {
                inputs.yearly.by = 'dayOfYear';
                inputs.yearly.bymonth = rulesObj.bymonth;
                inputs.yearly.bymonthday = rulesObj.bymonthday;
            } else if (rulesObj.byweekday) {
                inputs.yearly.by = 'dayOfWeek';
                inputs.yearly.bysetpos = rulesObj.bysetpos;
                inputs.yearly.byweekday = parseInt(rulesObj.byweekday, 10);
                inputs.yearly.bymonth = rulesObj.bymonth;
            }
        }

        return inputs;
    }

    private inputsToRrule(inputs: PLRepeatingRule): PLRepeatingRuleValue {
        if (!inputs.repeats) {
            return {};
        }
        const retRule: any = {
            recurrence_frequency: inputs.frequency,
        };
        let valid = false;
        const rrules = [];

        // End.
        if (inputs.end.type === 'count') {
            if (!inputs.end.count || inputs.end.count < 1) {
                return retRule;
            }
            rrules.push(`count:${inputs.end.count}`);
        } else if (inputs.end.type === 'datetime') {
            if (!inputs.end.datetime) {
                return retRule;
            }
            // Just a date (since smallest frequency is daily) so no need to
            // mess with timezones or convert to UTC. Just pass through as is.
            // With one exception - the backend supports smaller frequencies so
            // wants a time. We'll just set to 00:00.
            retRule.end_recurring_period = `${inputs.end.datetime}T00:00`;
        }
        if (inputs.frequency === 'DAILY') {
            inputs.daily.interval = inputs.interval;
            if (inputs.daily && inputs.daily.interval) {
                rrules.push(`interval:${inputs.daily.interval}`);
                valid = true;
            }
        } else if (inputs.frequency === 'WEEKLY') {
            inputs.weekly.interval = inputs.interval;
            if (inputs.weekly && inputs.weekly.interval && inputs.weekly.byweekday && inputs.weekly.byweekday.length) {
                rrules.push(`interval:${inputs.weekly.interval}`);
                rrules.push(`byweekday:${inputs.weekly.byweekday.join(',')}`);
                valid = true;
            }
        } else if (inputs.frequency === 'MONTHLY') {
            inputs.monthly.interval = inputs.interval;
            if (inputs.monthly && inputs.monthly.interval && inputs.monthly.by) {
                rrules.push(`interval:${inputs.monthly.interval}`);
                if (inputs.monthly.by === 'dayOfMonth' && inputs.monthly.bymonthday) {
                    rrules.push(`bymonthday:${inputs.monthly.bymonthday}`);
                    valid = true;
                } else if (inputs.monthly.by === 'dayOfWeek' && inputs.monthly.bysetpos &&
                 typeof inputs.monthly.byweekday === 'number') {
                    rrules.push(`bysetpos:${inputs.monthly.bysetpos}`);
                    rrules.push(`byweekday:${inputs.monthly.byweekday}`);
                    valid = true;
                }
            }
        } else if (inputs.frequency === 'YEARLY') {
            if (inputs.yearly && inputs.yearly.interval && inputs.yearly.by) {
                rrules.push(`interval:${inputs.yearly.interval}`);
                if (inputs.yearly.by === 'dayOfYear' && inputs.yearly.bymonth &&
                 inputs.yearly.bymonthday) {
                    rrules.push(`bymonth:${inputs.yearly.bymonth}`);
                    rrules.push(`bymonthday:${inputs.yearly.bymonthday}`);
                    valid = true;
                } else if (inputs.yearly.by === 'dayOfWeek' && inputs.yearly.bysetpos &&
                 typeof inputs.yearly.byweekday === 'number' && inputs.yearly.bymonth) {
                    rrules.push(`bysetpos:${inputs.yearly.bysetpos}`);
                    rrules.push(`byweekday:${inputs.yearly.byweekday}`);
                    rrules.push(`bymonth:${inputs.yearly.bymonth}`);
                    valid = true;
                }
            }
        }
        if (rrules.length) {
            retRule.recurrence_params = rrules.join(';');
        }
        if (!valid) {
            return {};
        }
        return retRule;
    }

    private makeNumberOpts(count: number): Option[] {
        const opts: Option[] = [];
        for (let ii = 1; ii <= count; ii++) {
            opts.push({ value: ii, label: `${ii}` });
        }
        return opts;
    }

    setSelection(selection: string) {
        let value: PLRepeatingRule = {
            ...this.rruleInput,
            repeats: selection !== 'norepeat',
        };
        let day = this.mStart.weekday();
        day = day === 0 ? 6 : day - 1;
        if (['weekday', 'weekly'].includes(selection)) {
            value = {
                ...value,
                frequency: 'WEEKLY',
                weekly: {
                    interval: 1,
                    byweekday: selection === 'weekday' ?
                        [0, 1, 2, 3, 4] : [day],
                },
            };
        }
        if (['monthly', 'lastmonthly'].includes(selection)) {
            const monthWeek = this.getMonthWeek(this.mStart);
            const weekPosition = selection === 'monthly' ?
                this.bysetposOpts.find(o => o.value === monthWeek) :
                this.bysetposOpts[4];
            value = {
                ...value,
                frequency: 'MONTHLY',
                monthly: {
                    interval: 1,
                    byweekday: day,
                    by: 'dayOfWeek',
                    bysetpos: weekPosition.value,
                },
            };
        }
        this.rruleInput = value;
        this.change();
    }

    change() {
        const modelUpdates = this.inputsToRrule(this.rruleInput);
        let valid = true;
        if (this.repeatSelection !== 'norepeat') {
            valid = !!(modelUpdates && modelUpdates.recurrence_frequency && modelUpdates.recurrence_params);
        }
        this.valueChange.emit(modelUpdates);
        this.valid.emit(valid);
    }
}
