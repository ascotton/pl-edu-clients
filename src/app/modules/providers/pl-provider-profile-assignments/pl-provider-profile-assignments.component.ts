import { Component, OnInit } from '@angular/core';
import {
    PLAssignmentManagerService,
    PLAssignmentInterface,
    PLAssignmentRequirement,
} from '@modules/assignment-manager/pl-assignment-manager.service';
import { Store } from '@ngrx/store';
import { first, takeUntil, withLatestFrom } from 'rxjs/operators';

import { PLSchoolYearsService } from '@common/services';
import { PLProviderService } from '../pl-provider.service';
import { User } from '@modules/user/user.model';
import { AppStore } from '@root/src/app/appstore.model';
import { PLTableLocalDataService } from '@root/index';
import { PLDestroyComponent } from '@root/src/app/common/components';
import { Router } from '@angular/router';

@Component({
    selector: 'pl-provider-profile-assignemnts',
    templateUrl: './pl-provider-profile-assignments.component.html',
    styleUrls: ['./pl-provider-profile-assignments.component.less'],
    providers: [PLTableLocalDataService],
})
export class PLProviderProfileAssignmentsComponent extends PLDestroyComponent implements OnInit {
    selectedSchoolYear: any;
    schoolYearName: string;
    loading = false;
    assignments: PLAssignmentInterface[] = [];
    provider: any;
    schoolYearLoaded = false;
    schoolYears: any;
    filters: any;
    currentUser: User;
    filterSelectOpts: any[] = [
        { value: 'status', label: 'Status', type: 'multiSelect', selectOptsMulti: [], defaultVisible: false },
    ];
    assignmentsStatusOpts: any;
    defaultOrdering = '-orgName';
    localTableService: any;

    constructor(
        private assignmentManagerService: PLAssignmentManagerService,
        private schoolYear: PLSchoolYearsService,
        private plProvider: PLProviderService,
        private store: Store<AppStore>,
        private router: Router,
        localTableService: PLTableLocalDataService,
    ) {
        super();
        this.localTableService = localTableService;
    }

    ngOnInit() {
        this.store.select('currentUser')
            .pipe(takeUntil(this.destroyed$), first())
            .subscribe((user: any) => {
                this.currentUser = user;
            });
        const curUuid = this.router.url.split('/')[2];
        this.plProvider.getProvider(curUuid)
            .pipe(
                takeUntil(this.destroyed$),
                withLatestFrom(this.schoolYear.getSchoolYearsInfo()),
            )
            .subscribe(([res, years]: [any, any]) => {
                this.selectedSchoolYear = years.currentSchoolYear.code;
                this.schoolYears = years.schoolYears;
                this.schoolYearLoaded = true;

                this.provider = res.provider;
                this.loadAssignments();
            });
        this.setFilters();
        this.resetTable();
    }

    onYearSelected(event: any) {
        this.selectedSchoolYear = event.model;
        this.loadAssignments();
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

    onFiltersChange(event: any) {
        if (event.query && event.query.status) {
            this.localTableService.dataRows =
                this.assignments.filter((a: any) => event.query.status.includes(a.status));
            this.localTableService.pageSize = this.assignments.length;
        } else {
            this.localTableService.dataRows = this.assignments;
            this.localTableService.pageSize = this.assignments.length;
        }
        this.localTableService.updateDisplayRows();
    }

    getServiceLineDisplay(serviceLines: string[]): string {
        return serviceLines.join(', ');
    }

    private resetTable() {
        this.localTableService.dataRows = [];
        this.localTableService.pageSize = 0;
        this.localTableService.updateDisplayRows();
    }

    private setFilters() {
        this.assignmentsStatusOpts = this.assignmentManagerService.ASSIGNMENT_STATUS_OPTS;
        const statusOptionIndex = this.filterSelectOpts.findIndex((option: any) => option.value === 'status');
        this.filterSelectOpts[statusOptionIndex].selectOptsMulti = this.assignmentsStatusOpts;
    }

    private loadAssignments() {
        if (this.schoolYearLoaded && this.provider) {

            this.loading = true;

            let query = {
                provider: this.provider.user.id,
                school_year: this.schoolYears.find((year: any) => year.code === this.selectedSchoolYear).id,
            };
            if (this.filters) {
                query = {
                    ...query,
                    ...this.filters,
                };
            }
            this.assignments = [];
            this.assignmentManagerService.fetchAssignmentProposals(query)
                .subscribe((resProposals: any) => {
                    resProposals.forEach((proposalRaw: any) => {
                        if (proposalRaw.user === this.provider.user.id) {
                            const assignment: PLAssignmentInterface = {
                                uuid: proposalRaw.uuid,
                                orgName: proposalRaw.organization.name,
                                orgState: proposalRaw.organization.state,
                                orgTimezone: proposalRaw.organization.timezone,
                                orgSchoolType: proposalRaw.organization.organization_type || 'Brick & Mortar',
                                estimatedHours: +this.assignmentManagerService.durationToDecimalHours(proposalRaw.hours),
                                estimatedHoursDecimal:
                                    this.assignmentManagerService.durationToDecimalHoursDecimal(proposalRaw.hours),
                                schoolYear: this.schoolYears.find((year: any) => year.id === proposalRaw.school_year).name,
                                startDate: proposalRaw.start_date,
                                endDate: proposalRaw.end_date,
                                serviceLines: proposalRaw.service_lines || [],
                                isFTE: proposalRaw.is_fte,
                                isESY: proposalRaw.is_esy,
                                payRate: +proposalRaw.pay_rate,
                                modified: proposalRaw.modified.split('T')[0],
                                status: proposalRaw.status,
                                statusDetail: proposalRaw.status_detail,
                            };
                            this.assignments.push(assignment);
                        }
                    });
                    this.localTableService.dataRows = this.assignments;
                    this.localTableService.pageSize = this.assignments.length;
                    this.localTableService.updateDisplayRows();
                    this.loading = false;
                });
        }
    }
}
