
import * as moment from 'moment';
import { Injectable } from '@angular/core';

import { Observable, fromEvent, BehaviorSubject } from 'rxjs';
import { filter, takeUntil, map, distinctUntilChanged, takeWhile } from 'rxjs/operators';

import {
    PLWeekday,
    PLTimeFrame,
    PLTimeBlock,
    PLTimeGridBlock,
    PLTimeGridBlockSize,
    PLTimeGridBlockConfiguration,
} from '../interfaces';

const PL_WEEKDAYS_VALUES = 'ZMTWRFS';

export enum PL_HOUR_PORTION {
    None = 1,
    Half = 2,
    Quarter = 4,
}

export enum PL_DAY_FORMAT {
    Full,
    Short,
    Min,
}

interface PLTimeSelectionState {
    selecting: boolean;
    time?: PLTimeFrame;
    group?: number;
}

@Injectable()
export class PLTimeGridService {

    private readonly hourHeight = 120;

    private _built = false;
    private _timeFrameObj: PLTimeFrame;
    private _slotDuration: number;
    private slotHeight: number;
    private hourPortion: PL_HOUR_PORTION = PL_HOUR_PORTION.Quarter;

    apiHourFormat = 'HH:mm';
    hourFormat = 'hh:mm A';
    numberOfGroups = 1;
    groupWidth: number;
    days: PLWeekday[] = [];
    slots: PLTimeFrame[] = [];
    timezone: string;

    // Readonly Properties
    get built() { return this._built; }
    get timeFrameObj() { return this._timeFrameObj; } // Expressed in UTC
    get slotDuration() { return this._slotDuration; }
    get columnWidth() { return this.groupWidth * this.numberOfGroups; }

    constructor() {
        this._slotDuration = 60 / this.hourPortion;
        this.slotHeight = this.hourHeight / this.hourPortion;
    }

    private builtWarning(methodName: string) {
        if (!this.built) {
            console.error(`buildTimeGrid method should run before calling ${methodName}`);
        }
    }

    format(time: moment.Moment, apiFormat = true): string {
        return time.format(apiFormat ? this.apiHourFormat : this.hourFormat);
    }

    toLocalTimeFrame(frame: PLTimeFrame, timezone: string): PLTimeFrame {
        const { start, end } = frame;
        start.tz(timezone);
        end.tz(timezone);
        return { start, end };
    }

    toLocalTimeFrameStr(frame: PLTimeFrame, timezone: string): PLTimeBlock {
        const { start, end } = this.toLocalTimeFrame(frame, timezone);
        return {
            start: this.format(start),
            end: this.format(end),
        };
    }

    buildTimeGrid(
        timeFrame: PLTimeFrame,
        dayFormat: PL_DAY_FORMAT = PL_DAY_FORMAT.Short) {
        this._timeFrameObj = timeFrame;
        this.days = this.createWeekdays(dayFormat);
        this.slots = this.timeSlots(this.timeFrameObj);
        this._built = true;
    }

    timeObj(block: PLTimeBlock, timezone: string): PLTimeFrame {
        const { start, end } = block;
        const _start = moment.tz(start, this.apiHourFormat, timezone).utc();
        const _end = moment.tz(end, this.apiHourFormat, timezone).utc();
        if (_start.isAfter(_end)) {
            _end.add(1, 'd');
        }
        return { start: _start, end: _end };
    }

    timeBlock(frame: PLTimeFrame, withTimezone = true): PLTimeBlock {
        const { start, end } = frame;
        return withTimezone ?
            this.toLocalTimeFrameStr(frame, this.timezone) :
            {
                start: this.format(start),
                end: this.format(end),
            };
    }

    createWeekdays = (format: PL_DAY_FORMAT, weekends = false): PLWeekday[] => {
        const formatter = {
            [PL_DAY_FORMAT.Full]: moment.weekdays,
            [PL_DAY_FORMAT.Short]: moment.weekdaysShort,
            [PL_DAY_FORMAT.Min]: moment.weekdaysMin,
        };
        let weekdays: PLWeekday[] = formatter[format]()
            .map((label, idx) => ({
                label,
                key: PL_WEEKDAYS_VALUES[idx],
            }));
        if (!weekends) {
            weekdays = weekdays.filter(wd => wd.key !== 'Z' && wd.key !== 'S');
        }
        return weekdays;
    }

    timeSlots(timeFrame: PLTimeFrame, duration = this.slotDuration): PLTimeFrame[] {
        const { start: timeFrameStart, end: timeFrameEnd } = timeFrame;
        const slotTime = timeFrameStart.clone();
        const slots: PLTimeFrame[] = [];
        while (slotTime < timeFrameEnd) {
            const start = slotTime.clone();
            const end = slotTime.add(duration, 'minute').clone();
            slots.push({ start, end });
        }
        return slots;
    }

    inTimeFrame(slot: PLTimeFrame, start: moment.Moment, end: moment.Moment): boolean {
        const { start: startTime, end: endTime } = slot;
        return start.isSameOrAfter(startTime) && end.isSameOrBefore(endTime);
    }

    overlap(slot1: PLTimeFrame, slot2: PLTimeFrame): { overlap: boolean; slot?: PLTimeFrame } {
        if (!slot1 || !slot2) {
            return { overlap: false };
        }
        if (slot1.start > slot1.end) {
            slot1.end.add(1, 'day');
        }
        if (slot2.start > slot2.end) {
            slot2.end.add(1, 'day');
        }
        const result: { overlap: boolean; slot?: PLTimeFrame } = {
            overlap: slot1.start < slot2.end && slot2.start < slot1.end,
        };
        if (result.overlap) {
            const start = slot2.start > slot1.start ? slot2.start : slot1.start;
            const end = slot2.end < slot1.end ? slot2.end : slot1.end;
            result.slot = { start, end };
        }
        return result;
    }

    getBlockPosition(timeFrame: PLTimeFrame): { height: number, y: number } {
        this.builtWarning('getBlockPosition');
        const { start, end } = timeFrame;
        const timeFromStart = start.diff(this.timeFrameObj.start, 'minutes') % 1440; // In case is a day diffrence
        let blockDuration = end.diff(start, 'minutes') % 1440;
        if (blockDuration < 0) {
            blockDuration = 1440 + blockDuration;
        }
        const height = (blockDuration / this.slotDuration) * this.slotHeight;
        const y = (timeFromStart / this.slotDuration) * this.slotHeight;
        return { height, y };
    }

    getBlockSize(groupIndex: number, numberOfGroups = this.numberOfGroups): { width: number, x: number } {
        const width = 100 / numberOfGroups;
        const x = width * groupIndex;
        return { width, x };
    }

    buildBlock(
        uuid: string,
        title: string,
        day: string,
        timeFrame: PLTimeBlock,
        configuration: PLTimeGridBlockConfiguration,
        timeZone: string): PLTimeGridBlock {
        this.builtWarning('buildBlock');
        const defaultSize: PLTimeGridBlockSize = { x: 0, width: 100 };
        const defaultPriority = 0;
        if (!configuration.size) {
            configuration.size = defaultSize;
        }
        if (!configuration.priority) {
            configuration.priority = defaultPriority;
        }
        return { uuid, configuration, title, day, timeFrame: this.timeObj(timeFrame, timeZone) };
    }

    getTime(y: number, time?: PLTimeFrame): PLTimeFrame {
        let slots = this.slots;
        const position = this.getTimeSlotIndex(y);
        if (time) {
            slots = this.timeSlots(time);
        }
        return slots[position];
    }

    getTimeSlotIndex(y: number): number {
        return Math.floor(y / this.slotHeight);
    }

    getGroupIndex(x: number, width: number, numberOfGroups = this.numberOfGroups) {
        const groupWidth = width / numberOfGroups;
        return Math.floor(x / groupWidth);
    }

    getEllapsedTime(y: number): number {
        return this.slotDuration * this.getTimeSlotIndex(y);
    }

    formatRange(frame: PLTimeFrame, format = 'dateFirst', duration1 = false, durationUnits: any = 'guess') {
        const { start, end } = frame;
        let duration: any = false;
        if (duration1) {
            if (durationUnits === 'guess') {
                duration = end.from(start, true);
            } else {
                const diff = end.diff(start, durationUnits);
                duration = `${diff} ${durationUnits}`;
            }
        }
        let range = '';
        const dateFormat = 'YYYY-MM-DD';
        if (start.format(dateFormat) === end.format(dateFormat)) {
            if (format === 'dateFirst') {
                range = `${start.format('ddd M/D/YY h:mm A')} - ${end.format('h:mm A')}`;
            } else if (format === 'timeFirst') {
                range = `${start.format('h:mm A')} - ${end.format('h:mm A')}, ${start.format('ddd, MMM D')}`;
            }
        } else {
            if (format === 'dateFirst') {
                range = `${start.format('ddd M/D/YY h:mm A')} - ${end.format('ddd M/D/YY h:mm A')}`;
            } else if (format === 'timeFirst') {
                range = `${start.format('h:mm A, MMM D')} - ${end.format('h:mm A MMM D')}`;
            }
        }
        if (duration) {
            range += ` (${duration})`;
        }
        return range;
    }

    //#region Events
    mapFromXY = (X: number, Y: number, groups: number, width: number, timeFrame?: PLTimeFrame)
    : { group: number; time: PLTimeFrame } => ({
        time: this.getTime(Y, timeFrame),
        group: this.getGroupIndex(X, width, groups) + 1,
    })

    manageTimeSelection(elem: any, destroyed$: Observable<any>, groups = 1, timeFrame?: PLTimeFrame)
        : Observable<PLTimeSelectionState> {
        const state$: BehaviorSubject<PLTimeSelectionState> = new BehaviorSubject({ selecting: false });
        fromEvent<MouseEvent>(elem, 'mousedown').pipe(
            filter(({ which, button, target }) => !(which ? which === 3 : button === 2)
                && target === elem),
            takeUntil(destroyed$),
        ).subscribe(({ offsetX: X, offsetY: Y }) => {
            const { time, group } = this.mapFromXY(X, Y, groups, elem.offsetWidth, timeFrame);
            state$.next({ time, group, selecting: true });
            this.createSelectionListeners(elem, state$, groups, timeFrame);
        });
        return state$.pipe(takeUntil(destroyed$));
    }

    createSelectionListeners(elem: any, state$: BehaviorSubject<PLTimeSelectionState>, groups: number, timeFrame?: PLTimeFrame) {
        fromEvent<MouseEvent>(elem, 'mousemove').pipe(
            takeWhile(() => state$.value.selecting),
            filter(({ offsetY: Y }) => Y >= 0 && Y <= elem.offsetHeight),
            map(({ offsetX: X, offsetY: Y }) => this.mapFromXY(X, Y, groups, elem.offsetWidth, timeFrame)),
            distinctUntilChanged((p, q) => p.time.start.isSame(q.time.start)),
        ).subscribe(({ time, group }) => state$.next({ time, group, selecting: true }));

        fromEvent(window, 'mouseup').pipe(
            takeWhile(() => state$.value.selecting),
        ).subscribe(() => state$.next({ selecting: false }));
    }
    //#endregion
}
