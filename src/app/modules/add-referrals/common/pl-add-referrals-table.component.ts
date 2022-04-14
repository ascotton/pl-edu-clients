import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PLTableLocalDataService } from '@root/index';

@Component({
    selector: 'pl-add-referrals-table',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './pl-add-referrals-table.component.html',
    styleUrls: ['./pl-add-referrals-table.component.less'],
    providers: [PLTableLocalDataService],
})
export class PLAddReferralsTableComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
    @Input() referralsRows: any[];
    @Input() parentDataSubject: Subject<any>;
    @Input() hasBulkAction = false;
    @Output() resolveDupeClient: EventEmitter <any> = new EventEmitter();
    @Output() resolveTransferClient: EventEmitter <any> = new EventEmitter();
    @Output() ignoreDuplicate: EventEmitter<any> = new EventEmitter();

    @ViewChild('tableRef', { static: true }) tableRef: ElementRef;

    localTableService: PLTableLocalDataService;
    destroyed$ = new Subject<boolean>();
    tableHeight = '500px';
    overrideAll = false;
    defaultOrdering = '-rowIndex';

    get hasAnyPerformAction() {
        return this.referralsRows.some(row => row.canResend);
    }

    constructor(localTableService: PLTableLocalDataService) {
        this.localTableService = localTableService;
    }

    ngOnInit() {
        this.localTableService.dataRows = this.referralsRows;
        this.localTableService.pageSize = this.referralsRows.length;
        this.parentDataSubject.pipe(takeUntil(this.destroyed$)).subscribe((event) => {
            this.localTableService.updateDisplayRows();
        });
    }

    ngAfterViewInit() {
        const tableElementRef = this.tableRef.nativeElement;
        if (tableElementRef) {
            tableElementRef.querySelector('.pages').style.display = 'none';
            tableElementRef.querySelector('.footer-items-per-page').style.display = 'none';
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.referralsRows) {
            this.localTableService.dataRows = this.referralsRows;
            this.localTableService.pageSize = this.referralsRows.length;
            this.localTableService.updateDisplayRows();
        }
    }

    ngOnDestroy(): void {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    resolveDupe(client: any) {
        this.resolveDupeClient.emit({ client });
    }

    resolveTransfer(client: any) {
        this.resolveTransferClient.emit({ client });
    }

    toggleIgnoreDuplicateFlag() {
        this.ignoreDuplicate.emit(this.referralsRows);
    }

    toggleIgnoreDuplicateFlagAll() {
        this.referralsRows = this.referralsRows.map((row) => {
            return {
                ...row,
                ignoreDuplicateWarning: row.canResend && this.overrideAll,
            };
        });
        this.localTableService.dataRows = this.referralsRows;
        this.localTableService.updateDisplayRows();
        this.ignoreDuplicate.emit(this.referralsRows);
    }

    hasErrors(referral: any): boolean {
        if (!referral) return false;
        return referral.errorReason  && !this.isDuplicate(referral);
    }

    isDuplicate(referral: any): boolean {
        if (!referral) return false;
        const errorReason = referral.errorReason ? referral.errorReason.toLowerCase() : '';
        return errorReason.includes('duplicate');
    }

    getRowNumber(row: any) {
        return row.rowIndex ? row.rowIndex + 1 : '';
    }

    onQuery(event: any) {
        if (event.orderQuery) {
            if (event.orderQuery.indexOf('-') === 0) {
                event.orderQuery = event.orderQuery.substring(1);
            } else {
                event.orderQuery = '-' + event.orderQuery;
            }
        } else {
            event.orderQuery = this.defaultOrdering;
        }
        this.localTableService.onQuery(event);
    }
}
