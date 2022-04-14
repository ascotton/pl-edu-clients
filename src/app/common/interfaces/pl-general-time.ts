import * as moment from 'moment';

export interface PLWeekday {
    key: string;
    label: string;
}

export interface PLTimeFrame {
    start: moment.Moment;
    end: moment.Moment;
}

export interface PLDayTimeFrame {
    day: string;
    time: PLTimeFrame;
}

// TODO: Rename to TimeRange
export interface PLTimeBlock {
    start: string;
    end: string;
}

export interface PLAvailability extends PLTimeBlock {
    uuid: string;
    day: string;
    modified?: string;
}

export interface PLLocationAvailability extends PLAvailability {
    dayName: string;
    availableStations: number;
}
