import { Component, Input, OnInit, OnDestroy } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PLTableLocalDataService } from '@root/index';

@Component({
    selector: 'pl-name-change-table',
    templateUrl: './pl-name-change-table.component.html',
    styleUrls: ['./pl-referrals-confirmation.component.less', '../pl-add-referrals.component.less'],
    providers: [PLTableLocalDataService],
})
export class PLNameChangeTableComponent implements OnInit, OnDestroy {

    @Input() nameChanges: any = {};
    @Input() parentDataSubject: Subject<any>;

    localTableService: PLTableLocalDataService;
    destroyed$ = new Subject<boolean>();

    constructor(localTableService: PLTableLocalDataService) {
        this.localTableService = localTableService;
    }

    ngOnInit() {
        this.localTableService.dataRows = this.nameChanges;
        this.parentDataSubject.pipe(takeUntil(this.destroyed$)).subscribe((event) => {
            this.localTableService.updateDisplayRows();
        });
    }

    ngOnDestroy() {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }
}
