import {
    Input,
    Component,
    ViewChild,
    OnChanges,
    SimpleChanges,
    AfterViewInit,
    ChangeDetectionStrategy,
    Output,
    EventEmitter,
    OnDestroy,
} from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
// RxJs
import { merge, Subject, BehaviorSubject } from 'rxjs';
import { startWith, takeUntil, delay, filter } from 'rxjs/operators';
// Services
import { PLDesignService } from '@common/services';
import { PLUrlsService } from '@root/index';
import { PLTrainingUser } from '../services';

@Component({
    selector: 'dashboard-table',
    templateUrl: './dashboard-table.component.html',
    styleUrls: ['./dashboard-table.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('detailExpanded', [
            state('collapsed', style({ height: '0px' })),
            state('expanded', style({ height: '*' })),
            transition('collapsed <=> expanded', [animate('.4s')]),
        ]),
    ],
})
export class DashboardTableComponent implements AfterViewInit, OnChanges, OnDestroy {
    @Input() data: PLTrainingUser[];
    @Input() count: number;
    @Input() loading: boolean;
    @Input() expandedItem: { loading: boolean; data: any };
    @Input() columns: { [key: string]: string };
    @Input() canExpand: boolean;
    @Input() reset: boolean;
    @Input() isSS: boolean;
    @Input() view: string;
    @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: false }) sort: MatSort;
    @Output() readonly expand: EventEmitter<PLTrainingUser> = new EventEmitter();
    @Output() readonly action: EventEmitter<{ action: string; user: PLTrainingUser }> = new EventEmitter();
    @Output() readonly query: EventEmitter<{
        pageIndex: number;
        pageSize: number;
        sort: string;
        direction: string;
        is_active?: boolean;
    }> = new EventEmitter();
    private showActive$ = new BehaviorSubject<boolean>(true);
    private destroyed$ = new Subject<boolean>();
    private reseting: boolean;
    displayedColumns: string[];
    columnsDefinition: string[];
    roomUrl = this.plUrls.urls.roomFE;

    constructor(public plDesign: PLDesignService, private plUrls: PLUrlsService) { }

    ngOnChanges(changes: SimpleChanges) {
        const { columns, reset } = changes;
        if (columns) {
            this.displayedColumns = Object.keys(this.columns);
            const expandCols = this.canExpand ? ['expand-arrow'] : [];
            this.columnsDefinition = [...expandCols, ...this.displayedColumns];
        }
        if (reset && !reset.firstChange) {
            this.resetTable();
        }
    }

    ngAfterViewInit() {
        const paginator$ = this.paginator.page.pipe(
            filter(() => {
                if (this.reseting) {
                    this.reseting = false;
                }
                return !this.reseting;
            }),
        );
        merge(this.sort.sortChange, paginator$)
            .pipe(
                takeUntil(this.destroyed$),
                startWith(() => {}),
                delay(0),
            ).subscribe(() => {
                const { pageIndex, pageSize } = this.paginator;
                const { active, direction } = this.sort;
                this.query.emit({
                    pageIndex,
                    pageSize,
                    direction,
                    sort: active,
                });
            });
    }

    ngOnDestroy() {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    resetTable() {
        this.reseting = true;
        this.paginator.firstPage();
    }

    toggleExpand(row: PLTrainingUser) {
        this.expand.emit(
            this.expandedItem &&
            this.expandedItem.data &&
            this.expandedItem.data.uuid === row.uuid
            ? null : row);
    }

    emitAction(action: string, row: PLTrainingUser) {
        this.action.emit({ action, user: row });
    }

    selectAction(event: PointerEvent, row: PLTrainingUser) {
        if (this.expandedItem) {
            if (this.expandedItem.data.uuid !== row.uuid) {
                this.toggleExpand(row);
            }
            event.stopPropagation();
        }
    }
}
