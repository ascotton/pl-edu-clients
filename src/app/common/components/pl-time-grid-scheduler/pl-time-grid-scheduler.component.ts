import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    TemplateRef,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import { PLHideAnimation } from '../../animations';
import {
    PLWeekday,
    PLTimeBlock,
    PLTimeGridBlock,
    PLDayTimeFrame,
    PLTimeFrame,
    PLTimeGridBlockEvent,
    PLDrawMode,
} from '../../interfaces';

import { PLTimeGridService, PL_HOUR_PORTION, PL_DAY_FORMAT } from '../../services';

@Component({
    selector: 'pl-time-grid-scheduler',
    templateUrl: './pl-time-grid-scheduler.component.html',
    styleUrls: ['./pl-time-grid-scheduler.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        PLHideAnimation,
    ],
})
export class PLTimeGridSchedulerComponent implements OnInit, OnChanges {

    dayBlocks: { day: PLWeekday, blocks: PLTimeGridBlock[] }[] = [];
    slots: PLTimeFrame[] = [];
    timeLabels: string[] = [];
    labelsHidden = true;

    // Events
    @Output() readonly blockAction: EventEmitter<PLTimeGridBlockEvent> = new EventEmitter();
    @Output() readonly actionTriggerred: EventEmitter<{
        eventName: string;
        dayTime: PLDayTimeFrame;
        group?: number;
        week?: number;
    }> = new EventEmitter();

    // Drawing Configs
    @Input() blockDuration = 0;
    @Input() allWeeks = true;
    @Input() drawMode: PLDrawMode = PLDrawMode.None;

    // Configuration
    @Input() timezone: string;
    @Input() timeFrame: PLTimeBlock;
    @Input() hourPortion = PL_HOUR_PORTION.Quarter;
    @Input() dayFormat: PL_DAY_FORMAT = PL_DAY_FORMAT.Short;
    @Input() labels: { label: string, key: string }[] = [];

    // Data
    @Input() blocks: PLTimeGridBlock[] = [];
    @Input() slotTemplate: TemplateRef<any>;
    @Input() dayHeaderTemplate: TemplateRef<any>;

    get columnWidth() {
        return this.timeGridService.columnWidth || 200;
    }

    constructor(private timeGridService: PLTimeGridService) { }

    ngOnInit() {
        // TODO: Here we should build TimeGrid if it wasn't done.
        if (!this.timeGridService.built) {
            // If timeFrame null send an error
            this.timeGridService.buildTimeGrid(this.timeGridService.timeObj(this.timeFrame, this.timezone));
        }
        this.slots = this.timeGridService.slots;
        this.dayBlocks = this.timeGridService.days.map(day => ({
            day,
            blocks: this.getDayBlocks(day.key),
        }));
        this.buildLabels();
    }

    ngOnChanges(changes: SimpleChanges) {
        const { blocks, timezone } = changes;
        if (blocks) {
            this.dayBlocks = this.timeGridService.days.map(day => ({
                day,
                blocks: this.getDayBlocks(day.key),
            }));
        }
        if (timezone && !timezone.firstChange) {
            this.buildLabels();
        }
    }

    private getDayBlocks(day: string): PLTimeGridBlock[] {
        return this.blocks
            .filter(b => b.day === day)
            .map(b => ({
                ...b,
                timeFrame: {
                    start: b.timeFrame.start.tz(this.timezone),
                    end: b.timeFrame.end.tz(this.timezone),
                },
            })) // TODO: Showing UTC
            .sort((a, b) => a.configuration.priority - b.configuration.priority);
    }

    buildLabels() {
        this.timeLabels = this.timeGridService.timeSlots(
            this.timeGridService.timeFrameObj, 60)
            .map(slot => this.timeGridService.format(slot.start.tz(this.timezone), false));
    }

    onColumnActionTrigerred(
        event: { eventName: string; time?: PLTimeFrame; group?: number; week?: number; },
        day: string) {
        const { eventName, time, group, week } = event;
        const dayTime: PLDayTimeFrame = { day, time };
        this.actionTriggerred.emit({ eventName, dayTime, group, week });
    }

    toggleLabelCollapse() {
        this.labelsHidden = !this.labelsHidden;
    }
}
