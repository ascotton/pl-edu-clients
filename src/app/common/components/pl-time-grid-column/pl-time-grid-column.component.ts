import {
    Input,
    Output,
    Component,
    ViewChild,
    ElementRef,
    TemplateRef,
    EventEmitter,
    ChangeDetectionStrategy,
    OnInit,
    ChangeDetectorRef,
    SimpleChanges,
    Renderer2,
    OnChanges,
} from '@angular/core';
import { filter } from 'rxjs/operators';
// Services
import { PLTimeGridService } from '../../services';
// Models
import {
    PLTimeFrame,
    PLTimeGridBlock,
    PLTimeGridBlockEvent,
    PLTimeGridColumnActions,
    PLTimeGridBlockAction,
    PLTimeGridBlockSize,
    PLDrawMode,
} from '../../interfaces';
import { PLDestroyComponent } from '../pl-destroy.component';

interface PLBlock extends PLTimeGridBlock {
    hovered?: boolean;
}

@Component({
    selector: 'pl-time-grid-column',
    templateUrl: './pl-time-grid-column.component.html',
    styleUrls: ['./pl-time-grid-column.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLTimeGridColumnComponent extends PLDestroyComponent implements OnInit, OnChanges {

    get columnWidth(): number {
        return this.elementRef.nativeElement.offsetWidth;
    }

    selecting: boolean;
    initialTime: PLTimeFrame;
    selection: { week: number; time: PLTimeFrame; group: number; };
    tempBlock: PLTimeGridBlock;
    boxSelectionAllow = false;

    @Input() slots: PLTimeFrame[];
    @Input() blocks: PLBlock[] = [];
    @Input() blockTemplate: TemplateRef<any>;
    @Input() slotTemplate: TemplateRef<any>;

    @Input() timezone: string;
    @Input() blockDuration = 0;
    @Input() allWeeks = true;
    @Input() drawMode: PLDrawMode = PLDrawMode.None;

    @Output() readonly blockAction: EventEmitter<PLTimeGridBlockEvent> = new EventEmitter();
    @Output() readonly actionTrigerred: EventEmitter<{
        eventName: PLTimeGridColumnActions;
        time: PLTimeFrame;
        group?: number;
        week?: number;
    }> = new EventEmitter();

    @ViewChild('drawingBox', { static: true }) drawingBox: ElementRef;

    constructor(
        private elementRef: ElementRef,
        private render: Renderer2,
        private timeGridService: PLTimeGridService,
        private cdr: ChangeDetectorRef) {
        super();
    }

    ngOnInit() {
        const elem = this.drawingBox.nativeElement;
        const groups = this.timeGridService.numberOfGroups || 1;
        this.updateDrawBox();
        this.timeGridService.manageTimeSelection(elem, this.destroyed$, groups)
            .pipe(filter(() => this.boxSelectionAllow))
            .subscribe(({ selecting, group, time }) => {
                if (selecting && !this.selecting) {
                    const width = 100 / groups;
                    this.startSelection({ time, size: { width, x: (group - 1) * width } });
                }
                if (selecting && this.selecting) {
                    this.updateSelection({ time });
                }
                if (!selecting && this.selecting) {
                    this.endSelection();
                }
                this.cdr.detectChanges();
            });
    }

    ngOnChanges(changes: SimpleChanges) {
        const { drawMode, timezone } = changes;
        if (drawMode) {
            this.updateDrawBox();
        }
        if (timezone && !timezone.firstChange) {
            this.blocks = this.blocks.map(b => ({
                ...b,
                timeFrame: this.timeGridService.toLocalTimeFrame(b.timeFrame, this.timezone),
            }));
        }
    }

    updateDrawBox() {
        const drawOptions = [PLDrawMode.Any, PLDrawMode.Box];
        this.boxSelectionAllow = drawOptions.includes(this.drawMode);
        if (this.boxSelectionAllow) {
            this.render.setStyle(this.drawingBox.nativeElement, 'zIndex', '998');
            this.render.addClass(this.drawingBox.nativeElement, 'pointer');
        } else {
            this.render.removeStyle(this.drawingBox.nativeElement, 'zIndex');
            this.render.removeClass(this.drawingBox.nativeElement, 'pointer');
        }
    }

    selectionTimeFrame = (time: PLTimeFrame) => {
        const localTime = this.timeGridService.toLocalTimeFrame(time, this.timezone);
        const { start, end } = localTime;
        if (this.blockDuration) {
            return {
                ...localTime,
                end: start.clone().add(this.blockDuration, 'minute'),
            };
        }
        if (this.initialTime) {
            const { start: iStart, end: iEnd } = this.initialTime;
            const direction = end >= iEnd;
            return direction ? { end, start: iStart } : { start, end: iEnd };
        }
        return localTime;
    }

    startSelection(options: { time: PLTimeFrame, size: PLTimeGridBlockSize, week?: number }) {
        this.selecting =  true;
        let { week, time, size } = options;
        const { width, x } = size;
        const group = (x / 100) * this.timeGridService.numberOfGroups;
        this.initialTime = this.timeGridService.toLocalTimeFrame(time, this.timezone);
        if (this.allWeeks || !week) {
            week = null;
        } else {
            const blockWidth = width / 4;
            size = {
                width: blockWidth,
                x: x + (blockWidth * (week - 1)),
            };
        }
        time = this.selectionTimeFrame(time);
        this.selection = { time, week, group };
        this.tempBlock = {
            uuid: 'temp',
            timeFrame: time,
            configuration: { size, priority: 999, className: 'temp drawing' },
        };
    }

    updateSelection(options: { time: PLTimeFrame }) {
        let { time } = options;
        time = this.selectionTimeFrame(time);
        this.selection = { ...this.selection, time };
        this.tempBlock = { ...this.tempBlock, timeFrame: time };
    }

    endSelection() {
        this.actionTrigerred.emit({ ...this.selection, eventName: PLTimeGridColumnActions.added });
        this.selecting = false;
        this.selection = null;
        this.tempBlock = null;
    }

    manageBlockAction(event: PLTimeGridBlockEvent) {
        const colActions = {
            [PLTimeGridBlockAction.mouseDown]: (options: any) => this.startSelection(options),
            [PLTimeGridBlockAction.mouseUp]: () => this.endSelection(),
            [PLTimeGridBlockAction.mouseMove]: (options: any) => this.updateSelection(options),
        };
        const colAction = colActions[event.action];
        const drawOptions = [PLDrawMode.Any, PLDrawMode.Blocks];
        if (!colAction) {
            this.blockAction.emit(event);
        } else if (drawOptions.includes(this.drawMode)) {
            colAction(event.options);
        }
    }
}
