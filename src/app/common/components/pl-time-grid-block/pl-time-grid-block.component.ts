import {
    ChangeDetectionStrategy,
    EventEmitter,
    HostBinding,
    HostListener,
    ElementRef,
    Renderer2,
    Component,
    Output,
    OnInit,
    Input,
} from '@angular/core';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
    PLTimeGridBlock,
    PLTimeFrame,
    PLTimeGridBlockAction,
    PLTimeGridBlockEvent,
} from '../../interfaces';
import { PLTimeGridService } from '../../services';
import { PLDestroyComponent } from '../pl-destroy.component';

@Component({
    selector: 'pl-time-grid-block',
    templateUrl: './pl-time-grid-block.component.html',
    styleUrls: ['./pl-time-grid-block.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLTimeGridBlockComponent extends PLDestroyComponent implements OnInit {

    private _block: PLTimeGridBlock;

    time: string;
    viewTime = true;

    @Output() readonly contentDroped: EventEmitter<{ time: PLTimeFrame, uuid: string }> = new EventEmitter();
    @Output() readonly action: EventEmitter<PLTimeGridBlockEvent> = new EventEmitter();

    @HostBinding('class.drawing') private drawing = false;
    @HostBinding('style.left.%') x: number;
    @HostBinding('style.top.px') y: number;
    @HostBinding('style.width.%') width: number;
    @HostBinding('style.min-height.px') minHeight: number; // Added to allow block resize on hover
    @HostBinding('style.height.px') height: number;
    @HostBinding('style.z-index') zIndex: number;
    @HostBinding('class.not-clickable') notClickable = false;
    @HostBinding('class.not-selectable') notSelectable = false;

    @Input()
    get block() { return this._block; }
    set block(value: PLTimeGridBlock) {
        this._block = value;
        const { clickable, drawable, selectable, viewTime, priority, className, size } = value.configuration;
        this.viewTime = typeof(viewTime) === 'undefined' ? true : viewTime;
        const { start, end } = value.timeFrame;
        this.time = `${this.timeGridService.format(start, false)} - ${this.timeGridService.format(end, false)}`;
        if (className) {
            className.split(' ')
                .forEach(cName => this.renderer.addClass(this.elementRef.nativeElement, cName));
        }
        this.notSelectable = !selectable;
        this.notClickable = !clickable;
        this.zIndex = priority || 0;
        // Size
        this.x = size.x;
        this.width = size.width;
        // Position
        const { y, height } = this.timeGridService.getBlockPosition(value.timeFrame);
        this.minHeight = this.height = height;
        this.y = y;
    }

    @HostListener('drop', ['$event']) onDrop(ev: any) {
        const initialY = ev.dataTransfer.getData('initialY');
        const duration = ev.dataTransfer.getData('duration');
        const { start: blockStart, end: blockEnd } = this.block.timeFrame;
        const Y = ev.offsetY - (initialY ? Number(initialY) : 0);
        const minutesFromStart = this.timeGridService.getEllapsedTime(Y);
        const start = blockStart.clone().add(minutesFromStart, 'minute');
        const end = start.clone().add(duration, 'minute');
        if (end <= blockEnd) {
            this.contentDroped.emit({ uuid: this.block.uuid, time: { start, end } });
        }
    }

    @HostListener('dragover', ['$event']) allowDrop(ev: any) {
        ev.preventDefault();
    }

    constructor(
        private elementRef: ElementRef,
        private renderer: Renderer2,
        private timeGridService: PLTimeGridService) {
        super();
    }

    ngOnInit() {
        const elem = this.elementRef.nativeElement;
        const { clickable, drawable, size } = this.block.configuration;
        this.renderer.addClass(elem, 'pl-time-grid-block');
        // Set event listeners
        if (drawable) {
            this.timeGridService
                .manageTimeSelection(elem, this.destroyed$, 4, this.block.timeFrame)
                    .subscribe(({ selecting, group, time }) => {
                        // Start
                        if (selecting && !this.drawing) {
                            this.drawing =  true;
                            this.triggerAction(PLTimeGridBlockAction.mouseDown, { time, size, week: group });
                        }
                        // Update
                        if (selecting && this.drawing) {
                            this.triggerAction(PLTimeGridBlockAction.mouseMove, { time });
                        }
                        // End
                        if (!selecting && this.drawing) {
                            this.triggerAction(PLTimeGridBlockAction.mouseUp);
                            this.drawing = false;
                        }
                    });
        }
        if (clickable && !drawable) {
            fromEvent<MouseEvent>(elem, 'click').pipe(
                takeUntil(this.destroyed$),
            ).subscribe(() => this.triggerAction(PLTimeGridBlockAction.click));
            fromEvent<MouseEvent>(elem, 'dblclick').pipe(
                takeUntil(this.destroyed$),
            ).subscribe(() => this.triggerAction(PLTimeGridBlockAction.dbClick));
        }
    }

    triggerAction(action: PLTimeGridBlockAction, options?: any) {
        this.action.emit({ action, options, uuid: this.block.uuid });
    }
}
