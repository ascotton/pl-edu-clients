import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';

// grid sizing
const ROW_HEIGHT = 15;
const BLOCK_WIDTH = 123;
const TIME_COLUMN_WIDTH = 110;

// font-size of information displayed in a block
const BLOCK_CONTENT_FONT_SIZE = 12;

// block size constraints
const MIN_BLOCK_HOURS = .5;
const SLOTS_PER_HOUR = 2;
const MIN_SLOTS_PER_BLOCK = MIN_BLOCK_HOURS * SLOTS_PER_HOUR;
const MAX_SLOT = 24 * SLOTS_PER_HOUR;
const MAX_START_SLOT = MAX_SLOT - MIN_SLOTS_PER_BLOCK;

const FIRST_BUSINESS_HOUR_SLOT = 14;
const WEEKDAY_INDEX_ARRAY = [0, 1, 2, 3, 4];

// rg todo: what's up with this -- "Missing radix parameter"
// tslint:disable: radix

/**
 * TimeSlot - information related to each valid block time values.
 * The set of block times range from 12am to 12pm in increments of 30 minutes.
 */
interface TimeSlot {
    hour: number;
    isAM: boolean;
    label: string;
    label_mil: string;
    slot: number;
    value: string;
}

interface TimeBlock {
    col: number; // day column number
    start: number; // slot number
    end: number; // slot number
    hrs: number; // calculated timespan
    hover: boolean; // addressable state
    style: TimeBlockPosition; // positioning in the grid
    clone: TimeBlock; // copy of original values during edit in case edit is discarded
    value?: string; // used for {label, value} options
    _id: number; // a unique value for easy comparison
}

interface TimeBlockPosition {
    left: number;
    top: number;
    contentTop: number;
    width: number;
    height: number;
}

@Component({
    selector: 'pl-weekly-time-grid',
    templateUrl: './pl-weekly-time-grid.component.html',
    styleUrls: ['./pl-weekly-time-grid.component.less'],
    changeDetection: 0,
})
export class PLWeeklyTimeGridComponent {
    @Input() blocks: any[];
    @Input() showWorkstations = false;
    @Input() timezone: string;
    @Input() readOnly = false;
    @Output() readonly hoursChanged = new EventEmitter<any>();

    // root data object for managing data-model and logic state
    data: any = {
        const: {
            MIN_SLOTS_PER_BLOCK,
            MAX_START_SLOT,
            FIRST_BUSINESS_HOUR_SLOT,
            WEEKDAY_INDEX_ARRAY,
            SCROLL_OPTIONS_VIEWPORT_CENTER: { behavior: 'smooth', block: 'center' },
        },
        state: {
            rows: <TimeSlot[]>[],
            // each block contains {col, start, end, hrs};
            // a block can be uniquely identified with `${block.col}_${block.start}` or simply `${block._id}`
            blocks: <TimeBlock[]>[],
            startTimes: <TimeSlot[]>[], // valid start time options for the active selected day.
            endTimes: <TimeSlot[]>[], // valid end time options for the active selected day.
            workstations: [],
            activeBlock: {},
            dailyHours: [],
            listeners: {},
            flags: {
                DEBUG: 0,
                DEBUG_INLINE_CONSOLE: 0,
                SHOW_ZOOM: 0,
                FORCE_SAVE_ERROR: 0,
                SIMULATE_SAVE_ERROR: 0,
            },
        },
        model: {
            raw: {},
            start: null,
            end: null,
            selectedDay: '0',
            workstations: 1,
        },
    };

    private mouseDownSlot = -1;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
    ) {
        MODEL = this.data.model;
        STATE = this.data.state;
        CONST = this.data.const;
    }

    ngOnInit() {
        this.init();

        for (let x = 1; x < 30; x++) {
            STATE.workstations.push({ label: x, value: x });
        }
    }

    get model() {
        return MODEL;
    }

    get state() {
        return STATE;
    }

    // helps identify (and scroll to) the beginning of the business day in the visualization grid
    getFirstBusinessHourId(index: number) {
        return (index === FIRST_BUSINESS_HOUR_SLOT) ? 'id_init_view_top' : null;
    }

    getTimezoneHTML() {
        return (this.timezone)
            ? this.timezone.replace('/', '/<br />').replace('_', ' ')
            : '/';
    }

    onChangeDay(columnIndex: string) {
        if (this.readOnly) return;

        this.cleanupBlocks();
        this.reset();
        MODEL.selectedDay = columnIndex;

        this.findValidStartTimes(parseInt(MODEL.selectedDay));
    }

    onChangeStartTime(slot: any) {
        this.findValidEndTimes(slot);
        this.renderActiveBlock();
    }

    onChangeEndTime(slot: any) {
        this.renderActiveBlock();
    }

    onClickSaveActiveBlock() {
        if (!STATE.activeBlock.style) return;

        this.saveActiveBlock();

        this.onClickCancelActiveBlock();
    }

    onClickCancelActiveBlock() {
        this.reset();
        this.doAfterMutations();
    }

    onClickEditBlock(event: any, block: any) {
        const editBlock = STATE.blocks.find((_: TimeBlock) => _.clone);
        if (editBlock) {
            delete editBlock.clone;
            this.cleanupBlocks();
        }

        block.clone = this.clone(block);

        this.findValidStartTimes(block.col);
        MODEL.selectedDay = `${block.col}`;
        MODEL.start = `slot_${block.start}`;
        MODEL.end = `slot_${block.end}`;
        MODEL.workstations = block.availableStations;

        // mutates the active-block
        this.onChangeStartTime(MODEL.start);
        if (event) {
            event.stopPropagation();
        }

        STATE.activeBlock.clone = block.clone;
    }

    onClickDeleteBlock(event: any, block: any) {
        if (event) {
            event.stopPropagation();
        }

        const blockToDelete = STATE.blocks.find((_: TimeBlock) => _._id === block._id);
        if (blockToDelete) {
            const editBlock = STATE.blocks.find((_: TimeBlock) => _.clone);
            if (editBlock) {
                delete editBlock.clone;
            }
            MODEL.selectedDay = `${block.col}`;
            this.cleanupBlocks();
            this.reset();
            STATE.blocks = STATE.blocks.filter((_: TimeBlock) => !(_.col === block.col && _.start === block.start));
            this.doAfterMutations();
        }
        return blockToDelete;
    }

    onCellMouseDown(row: any, day: any, evnt: any) {
        if (evnt.button !== 0) return;
        if (this.readOnly) return;

        this.mouseDownSlot = row.slot;

        MODEL.selectedDay = '' + day;
        MODEL.start = row.value;

        this.findValidStartTimes(parseInt(MODEL.selectedDay));
        this.findValidEndTimes(MODEL.start);

        this.onCellMouseOver(row, day);
    }

    onCellMouseOver(row: any, day: any) {
        if (this.mouseDownSlot === -1 || !MODEL.start) return;

        const slot = row.slot + 1;

        if (slot < this.mouseDownSlot) return;

        if (!STATE.endTimes.some((x: any) => x.slot === slot)) return;

        const curVal = `slot_${slot}`;
        MODEL.end = curVal;

        this.renderActiveBlock(true);

        const e = document.getElementById('activeBlock');
        if (e) e.classList.add('drawing');

        this.changeDetectorRef.detectChanges();
    }

    onCellMouseUp() {
        this.mouseDownSlot = -1;

        const e = document.getElementById('activeBlock');
        if (e) e.classList.remove('drawing');
    }

    onFooterCellMouseOver() {
        this.onCellMouseUp();
    }

    scrollToSelectedOption(dropdownSelector: string) {
        const options = document.querySelectorAll(`.${dropdownSelector} .option`);
        const optionsArray = Array.from(options);
        if (!optionsArray || !optionsArray.length) {
            return;
        }
        const activeBlock = STATE.activeBlock;
        if (activeBlock && activeBlock.start) {
            const start = STATE.rows[activeBlock.start].label;
            const timeOptionElement: any = optionsArray.find((item: any) => item.textContent === start);
            setTimeout(() => {
                timeOptionElement.scrollIntoView();
            }, 50);
            return;
        }
    }

    //////////
    // private
    //////////
    private init() {
        STATE.dayOptions = [
            { label: 'Mon', value: '0' },
            { label: 'Tue', value: '1' },
            { label: 'Wed', value: '2' },
            { label: 'Thu', value: '3' },
            { label: 'Fri', value: '4' },
        ];

        MODEL.selectedDay = (this.readOnly) ? -1 : STATE.dayOptions[0].value;

        this.buildTimeSlots();

        STATE.blocks = this.blocks.map((rawBlock: any) => {
            const start = STATE.rows.find((_: TimeSlot) => _.label_mil === rawBlock.start);
            let end = STATE.rows.find((_: TimeSlot) => _.label_mil === rawBlock.end);
            // 00:00:00 occurs twice in the rows array (the day begins and ends at midnight)
            // if the end is midnight, interpret it as the slot at the the end of the day.
            if (end.slot === 0) {
                end = STATE.rows[STATE.rows.length - 1];
            }
            return this.getBlockWithPosition({
                col: WEEKDAYS.indexOf(rawBlock.day),
                start: start.slot,
                end: end.slot,
                hrs: this.getBlockHours(start.slot, end.slot),
                hover: false,
                _id: Math.random(),
                availableStations: rawBlock.availableStations,
            });
        });

        this.doAfterMutations(true);

        STATE.dataInitialized = true;
        STATE.pageInitialized = true;

        setTimeout(() => {
            const e = document.getElementById('id_init_view_top');
            if (e) e.parentElement.scrollBy({ top: e.offsetTop, behavior: 'smooth' });
        }, 1);
    }

    private renderActiveBlock(dontScroll: boolean = false) {
        const item = {
            col: parseInt(MODEL.selectedDay),
            start: this.parseSlotString(MODEL.start),
            end: this.parseSlotString(MODEL.end),
        };
        STATE.activeBlock = {
            ...(STATE.activeBlock || {}),
            ...this.getBlockWithPosition(item),
        };

        if (this.mouseDownSlot === -1) {
            setTimeout(() => {
                document
                .querySelectorAll('#activeBlock .save-button')[0]
                .scrollIntoView(CONST.SCROLL_OPTIONS_VIEWPORT_CENTER);
            }, 100);
        }
    }

    private saveActiveBlock(isBlockClicked?: boolean) {
        const activeBlock = STATE.activeBlock;

        if (this.showWorkstations) {
            activeBlock.availableStations = MODEL.workstations;
        }

        activeBlock.hrs = this.getBlockHours(activeBlock.start, activeBlock.end);
        activeBlock._id = activeBlock._id || Math.random();

        if (activeBlock.clone) {
            const cloneBlockIndex = STATE.blocks.findIndex((_: TimeBlock) => _.clone);
            if (cloneBlockIndex > -1) {
                STATE.blocks[cloneBlockIndex] = this.clone(activeBlock);
                delete activeBlock.clone;
            }
        } else {
            STATE.blocks.push(this.clone(activeBlock));
        }

        if (!isBlockClicked) {
            document.getElementById('activeBlock').scrollIntoView(CONST.SCROLL_OPTIONS_VIEWPORT_CENTER);
        }
        activeBlock.hover = false;
    }

    private getBlockHours(start: number, end: number) {
        const delta = end - start;
        return Math.floor(delta / SLOTS_PER_HOUR) + (delta % 2 ? 0.5 : 0);
    }

    private clone(o: any) {
        let clone;
        let v;
        let key;

        clone = (Array.isArray(o) && []) || {};
        for (key in o) {
            v = o[key];
            clone[key] = typeof v === 'object' ? this.clone(v) : v;
        }
        return clone;
    }

    // NOTE - the magic numbers make the position calculations work...
    private getBlockWithPosition(item: any) {
        const top = item.start * ROW_HEIGHT + item.start;
        const bottom = item.end * ROW_HEIGHT + item.end - 3;
        const height = bottom - top;
        const left = TIME_COLUMN_WIDTH + 1 + item.col * (BLOCK_WIDTH + 2) + item.col;
        const width = BLOCK_WIDTH;
        const contentTop = height / 2 - (BLOCK_CONTENT_FONT_SIZE + 2);
        return {
            ...item,
            style: { top, left, height, width, contentTop },
        };
    }

    private buildTimeSlots() {
        // use this twice below, for AM and PM
        const __buildSlots = (isAM: boolean) => {
            for (let hr = 0; hr < 12; hr++) {
                for (let parts = 0; parts < 2; parts++) {
                    const hour = hr % 12 || 12;
                    const minute = parts ? 30 : 0;
                    const slot = hr * 2 + parts + (isAM ? 0 : 24);
                    // const hour_mil = isAM && hour === 12 ? 0 : (isAM ? hour : hr + 13);
                    const hour_mil = (() => {
                        if (hour === 12 && isAM) return 0;
                        if (hour === 12 && !isAM) return 12;
                        return isAM ? hour : hr + 12;
                    })();
                    const value = `slot_${slot}`;
                    const label = `${hour}:${minute ? '30' : '00'}${isAM ? 'am' : 'pm'}`;
                    // @ts-ignore - for String.padStart (es2017)
                    const label_mil = `${('' + hour_mil).padStart(2, '0')}:${('' + minute).padStart(2, '0')}:00`;
                    STATE.rows.push({ label, label_mil, value, slot, hour, isAM });
                }
            }
        };
        __buildSlots(true); /* AM */
        __buildSlots(false); /* PM */

        // add the final row
        // NOTE: the final row gets special treatment in the UI
        // TODO: explain why it gets special treatment...
        const finalRow = {
            label: `12:00am`,
            label_mil: `00:00:00`,
            value: `slot_${48}`,
            slot: 48,
            hour: 12,
            isAM: true,
        };
        STATE.rows.push(finalRow);
    }

    private doAfterMutations(init = false) {
        this.findValidStartTimes(parseInt(MODEL.selectedDay));
        this.findValidEndTimes(MODEL.start);
        this.computeDailyHours();
        this.fireHoursChangedEvent(init);
    }

    private findValidStartTimes(column: number) {
        // find all the blocks for the selected day,
        // in start-time order, so that we can sequence
        // the available spaces for new blocks.
        const blocks = STATE.blocks
            .filter((_: TimeBlock) => _.col === column)
            .filter((_: TimeBlock) => !_.clone)
            .sort((a: TimeBlock, b: TimeBlock) => a.start - b.start);

        // search the space before, after, and between each block
        // for valid block space
        let timeSlot = 0;
        const startTimes = <TimeSlot[]>[];
        blocks.forEach((_: TimeBlock) => {
            while (timeSlot <= _.start - MIN_SLOTS_PER_BLOCK) {
                startTimes.push(STATE.rows[timeSlot]);
                timeSlot++;
            }
            timeSlot = _.end;
        });
        while (timeSlot <= MAX_START_SLOT) {
            startTimes.push(STATE.rows[timeSlot]);
            timeSlot++;
        }
        STATE.startTimes = startTimes;
    }

    private findValidEndTimes(startSlot: string) {
        if (!MODEL.start) {
            return;
        }
        const column = parseInt(MODEL.selectedDay);
        const startSlotValue = this.parseSlotString(startSlot);
        const blocks = STATE.blocks
            .filter((_: TimeBlock) => _.col === column)
            .sort((a: TimeBlock, b: TimeBlock) => a.start - b.start);

        const nearestBlockAfterSlot = blocks.find((_: TimeBlock) => {
            const activeBlockId = STATE.activeBlock && STATE.activeBlock.clone && STATE.activeBlock.clone._id;
            return startSlotValue < _.start && _._id !== activeBlockId;
        });

        let timeSlot = startSlotValue + MIN_SLOTS_PER_BLOCK;
        const endTimes = <TimeSlot[]>[];
        if (nearestBlockAfterSlot) {
            while (timeSlot <= nearestBlockAfterSlot.start) {
                endTimes.push(STATE.rows[timeSlot]);
                timeSlot++;
            }
        } else {
            while (timeSlot <= MAX_SLOT) {
                endTimes.push(STATE.rows[timeSlot]);
                timeSlot++;
            }
        }
        if (endTimes.length) {
            const found = endTimes.find((_: TimeSlot) => _.value === MODEL.end);
            if (!found) {
                MODEL.end = `slot_${startSlotValue + MIN_SLOTS_PER_BLOCK}`;
            }
        }
        STATE.endTimes = endTimes;
    }

    // return slot number
    private parseSlotString(slot: string) {
        return parseInt(slot.split('_')[1]);
    }

    private cleanupBlocks() {
        STATE.blocks.forEach((item: any) => {
            item.hover = false;
            item.hoverTrash = false;
            item.hoverEdit = false;
        });
    }

    private reset() {
        MODEL.start = null;
        MODEL.end = null;
        STATE.startTimes = [];
        STATE.endTimes = [];

        const editBlock = this.getCloneBlock();
        if (editBlock) {
            delete editBlock.block.clone;
        }

        STATE.activeBlock = {};
    }

    // a block clone is created when editing a block in case the edit is discarded
    private getCloneBlock() {
        const index = STATE.blocks.findIndex((_: TimeBlock) => _.clone);
        if (index > -1) {
            return {
                index,
                block: STATE.blocks[index],
            };
        }
    }

    private computeDailyHours() {
        const result = [];
        for (let i = 0; i < 5; i++) {
            const hours = STATE.blocks
                .filter((_: TimeBlock) => _.col === i)
                .reduce((result2: number, _: TimeBlock) => {
                    // tslint:disable-next-line: no-parameter-reassignment
                    return (result2 += _.hrs);
                }, 0);
            result.push(hours);
        }
        STATE.dailyHours = result;
    }

    private fireHoursChangedEvent(init = false) {
        const totalHours = STATE.dailyHours.reduce((result: number, _: number) => result + _, 0);
        const blocks = STATE.blocks.reduce((result: any[], _: any) => {
            result.push({
                day: WEEKDAYS[_.col],
                start: STATE.rows[_.start].label_mil,
                end: STATE.rows[_.end].label_mil,
                availableStations: _.availableStations,
            });
            return result;
        }, []);

        this.hoursChanged.emit({
            init,
            totalHours,
            blocks,
        });
    }
}

const WEEKDAYS = 'MTWRF';

let MODEL: any;
let STATE: any;
let CONST: any;
