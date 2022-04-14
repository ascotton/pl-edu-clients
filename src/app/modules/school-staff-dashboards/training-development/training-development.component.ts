import { AfterViewInit, Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
// NgRx Store
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
// RxJs
import { combineLatest, Subject, merge } from 'rxjs';
import { map, switchMap, takeUntil, tap, startWith, delay } from 'rxjs/operators';
// Ng Material
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
// Services
import { PLDesignService } from '@common/services';
import { PLSchoolStaffService, PLPlatformHelperService } from '../services';
import { selectPlatformUsers, selectPlatformUsersTotal, selectPlatformUsersLoding, PLFetchPlatformUsers } from '../store';

@Component({
    templateUrl: './training-development.component.html',
    styleUrls: ['./training-development.component.less'],
})
export class PLTrainingDevelopmentComponent implements OnInit, OnDestroy, AfterViewInit {
    private destroyed$ = new Subject<boolean>();
    displayedColumns = ['last_name', 'first_name', 'teletherapy_foundations_training_progress', 'live_training_date'];
    reFetch$ = this.helper.reFetch().pipe(
        tap(() => {
            if (this.paginator) {
                this.paginator.firstPage();
            }
        }));
    users$ = this.store$.select(selectPlatformUsers);
    userTotal$ = this.store$.select(selectPlatformUsersTotal);
    loading$ = this.store$.select(selectPlatformUsersLoding)
        .pipe(delay(0));

    graphs$ = this.reFetch$.pipe(
        switchMap(({ organization, schoolYear }) => combineLatest([
            this.plSS.fetchLiveTraining(organization.id, organization.isGroupOrganization ? '' : schoolYear.id),
            this.plSS.fetchTeletherapyFoundationsTraining(organization.id, organization.isGroupOrganization ? '' : schoolYear.id),
        ])),
        map(([live, teletherapy]) => ({ live, teletherapy })),
    );

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(
        private store$: Store<AppStore>,
        private plSS: PLSchoolStaffService,
        private helper: PLPlatformHelperService,
        public plDesign: PLDesignService) { }

    ngOnInit() {
    }

    ngAfterViewInit() {
        const interaction$ = merge(this.sort.sortChange, this.paginator.page)
            .pipe(startWith({ }));
        combineLatest([this.reFetch$, interaction$]).pipe(
            takeUntil(this.destroyed$),
        ).subscribe(() => {
            const { pageIndex, pageSize } = this.paginator;
            const { active, direction } = this.sort;
            this.store$.dispatch(PLFetchPlatformUsers({
                options: {
                    page: (pageIndex || 0) + 1,
                    limit: pageSize || this.plDesign.settings.paginator.size,
                    ordering: active ? `${direction === 'desc' ? '-' : ''}${active}` : '',
                },
                platform: true,
            }));
        });
    }

    ngOnDestroy() {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }
}
