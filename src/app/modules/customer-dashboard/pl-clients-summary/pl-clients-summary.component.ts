import { Router, ActivatedRoute } from '@angular/router';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { PLUtilService, PLComponentStateInterface } from '@common/services';
import { PLStylesService, PLMayService, PLModalService } from '@root/index';
import { PLCustomerDashboardService } from '../pl-customer-dashboard.service';
import { PLStudentStatusHelpComponent } from '../pl-student-status-help/pl-student-status-help.component';

@Component({
    selector: 'pl-clients-summary',
    templateUrl: './pl-clients-summary.component.html',
    styleUrls: ['../../../common/less/app/client-absences.less', './pl-clients-summary.component.less'],
})
export class PLClientsSummaryComponent implements OnInit, OnDestroy {
    componentName = 'PLClientsSummaryComponent';
    _state: PLComponentStateInterface;

    @Input() uuid: string;
    @Input() isLocation: boolean;
    @Input() currentSchoolYearCode: string;

    constructor(
        private router: Router,
        private util: PLUtilService,
        private plMay: PLMayService,
        private plModal: PLModalService,
        private plStyles: PLStylesService,
        private activatedRoute: ActivatedRoute,
        private dashboardService: PLCustomerDashboardService,
    ) {}

    // --------------------------
    // lifecycle methods
    // --------------------------
    ngOnInit() {
        this._state = this.util.initComponent({
            name: this.componentName,
            params: {
                flags: {
                    // COMPONENT_INIT: 1,
                    // RUN_TEST: 1,
                },
                mocks: [
                    // 'MOCK_STATS_IEPS'
                ],
            },
            afterDoneFn: (state: PLComponentStateInterface) => {
                this.test(state);
                state.init = true;
            },
            fn: (state: PLComponentStateInterface, done) => {
                state.currentSchoolYearCode = this.currentSchoolYearCode;

                state.asyncCount = 2;

                this.initPermissions(state);

                if (state.mayViewAbsences) {
                    state.asyncCount++;
                }

                this.getStats(state, done);
            },
        });
    }

    ngOnDestroy() {
        this.util.destroyComponent(this._state);
    }

    // tslint:disable-next-line: use-life-cycle-interface
    ngOnChanges() {
        if (!this._state || !this._state.init) {
            return;
        }

        this.getStats(this._state, () => {});
    }

    //#region Public Methods

    getIepServiceExitedCount(type: string /* BMH, OT, SLT */, state: PLComponentStateInterface) {
        return this.getExitedCount(state.model.data.statsIeps.serviceStatusCounts, type);
    }

    /* types: ACHIEVED, PARTIALLY_ACHIEVED, DISCONTINUED, NOT_ADDRESSED */
    getIepStatusCount(type: string, state: PLComponentStateInterface) {
        return this.getStatusCount(state.model.data.statsIeps.statusCounts, IEP_STATUS[type]);
    }

    getTotalCountStatsIeps() {
        return (
            this._state.model.data.statsIeps.statusCounts
                // tslint:disable-next-line: no-parameter-reassignment
                .reduce((result: number, item: any) => (result += item.count), 0)
        );
    }

    onClickStudentStatusInfoIcon() {
        this.plModal.create(PLStudentStatusHelpComponent);
    }

    routeTo(uriToRoute: string): void {
        if (uriToRoute) {
            this.router.navigate([uriToRoute], {relativeTo: this.activatedRoute});
        }
    }

    //#endregion Public Methods

    //#region Private Methods

    private getStats(state: PLComponentStateInterface, done: any) {
        const vars = {
            schoolYearCode: state.currentSchoolYearCode,
            id: this.uuid,
            isLocation: this.isLocation,
        };

        // --- STATS student ieps
        this.dashboardService.getStatsIeps$(vars, state).subscribe((res: any) => {
            state.model.data.statsIeps = res.statsIeps;
            if (this.util.flag(state, 'MOCK_STATS_IEPS')) {
                this.mockStatsIeps(state);
            }
            this.initIepStatsChart(state.model.data.statsIeps, state);
            done();
        });

        // --- STATS student status
        this.dashboardService.getStatsServices$(vars, state).subscribe((res: any) => {
            state.studentStatusChartData = res.statsServices.statusCounts;
            done();
        });

        // --- STATS student absences
        if (state.mayViewAbsences) {
            this.dashboardService.getStatsAbsences$(vars, state).subscribe((res: any) => {
                state.model.data.summaryData = {
                    priority1: res.statsAbsences.absences1,
                    priority2: res.statsAbsences.absences2Or3,
                    priority3: res.statsAbsences.absences4OrMore,
                };
                done();
            });
        }
    }

    private initPermissions(state: PLComponentStateInterface) {
        const enabledUiFlags = state.currentUser.xEnabledUiFlags;
        state.mayViewAbsences = enabledUiFlags && enabledUiFlags.includes('client-absence-dashboard');
        state.mayAddSingleReferral = this.plMay.addSingleReferral(state.currentUser);
        state.mayAddReferrals = this.plMay.addReferrals(state.currentUser);
    }

    private initIepStatsChart(stats: any, state: PLComponentStateInterface) {
        const serviceStatusCounts = stats.serviceStatusCounts;

        const statusColors = {
            ACHIEVED: `#${this.plStyles.getColorForName('green')}`,
            PARTIALLY_ACHIEVED: `#${this.plStyles.getColorForName('blue-medium')}`,
            DISCONTINUED: `#${this.plStyles.getColorForName('yellow')}`,
            NOT_ADDRESSED: `#${this.plStyles.getColorForName('gray')}`,
        };

        state.iepStatusChartData = {
            datasets: [
                {
                    label: IEP_STATUS.ACHIEVED.name,
                    backgroundColor: statusColors.ACHIEVED,
                    data: [
                        this.getStatusCountByDiscipline(
                            serviceStatusCounts,
                            IEP_SERVICE_TYPE.SLT.key,
                            IEP_STATUS.ACHIEVED,
                        ),
                        this.getStatusCountByDiscipline(
                            serviceStatusCounts,
                            IEP_SERVICE_TYPE.BMH.key,
                            IEP_STATUS.ACHIEVED,
                        ),
                        this.getStatusCountByDiscipline(
                            serviceStatusCounts,
                            IEP_SERVICE_TYPE.OT.key,
                            IEP_STATUS.ACHIEVED,
                        ),
                    ],
                },
                {
                    label: IEP_STATUS.PARTIALLY_ACHIEVED.name,
                    backgroundColor: statusColors.PARTIALLY_ACHIEVED,
                    data: [
                        this.getStatusCountByDiscipline(
                            serviceStatusCounts,
                            IEP_SERVICE_TYPE.SLT.key,
                            IEP_STATUS.PARTIALLY_ACHIEVED,
                        ),
                        this.getStatusCountByDiscipline(
                            serviceStatusCounts,
                            IEP_SERVICE_TYPE.BMH.key,
                            IEP_STATUS.PARTIALLY_ACHIEVED,
                        ),
                        this.getStatusCountByDiscipline(
                            serviceStatusCounts,
                            IEP_SERVICE_TYPE.OT.key,
                            IEP_STATUS.PARTIALLY_ACHIEVED,
                        ),
                    ],
                },
                {
                    label: IEP_STATUS.DISCONTINUED.name,
                    backgroundColor: statusColors.DISCONTINUED,
                    data: [
                        this.getStatusCountByDiscipline(
                            serviceStatusCounts,
                            IEP_SERVICE_TYPE.SLT.key,
                            IEP_STATUS.DISCONTINUED,
                        ),
                        this.getStatusCountByDiscipline(
                            serviceStatusCounts,
                            IEP_SERVICE_TYPE.BMH.key,
                            IEP_STATUS.DISCONTINUED,
                        ),
                        this.getStatusCountByDiscipline(
                            serviceStatusCounts,
                            IEP_SERVICE_TYPE.OT.key,
                            IEP_STATUS.DISCONTINUED,
                        ),
                    ],
                },
                {
                    label: IEP_STATUS.NOT_ADDRESSED.name,
                    backgroundColor: statusColors.NOT_ADDRESSED,
                    data: [
                        this.getStatusCountByDiscipline(
                            serviceStatusCounts,
                            IEP_SERVICE_TYPE.SLT.key,
                            IEP_STATUS.NOT_ADDRESSED,
                        ),
                        this.getStatusCountByDiscipline(
                            serviceStatusCounts,
                            IEP_SERVICE_TYPE.BMH.key,
                            IEP_STATUS.NOT_ADDRESSED,
                        ),
                        this.getStatusCountByDiscipline(
                            serviceStatusCounts,
                            IEP_SERVICE_TYPE.OT.key,
                            IEP_STATUS.NOT_ADDRESSED,
                        ),
                    ],
                },
            ],
            // NOTE: this empty colors object is needed for the dataset backgroundColor to work
            colors: [{}], // do not remove
            labels: [IEP_SERVICE_TYPE.SLT.key, IEP_SERVICE_TYPE.BMH.key, IEP_SERVICE_TYPE.OT.key],
            options: {
                responsive: true,
                legend: false,
                scales: {
                    yAxes: [
                        {
                            ticks: {
                                beginAtZero: true,
                                callback: (value: any) => {
                                    if (value % 1 === 0) {
                                        return value;
                                    }
                                },
                            },
                        },
                    ],
                },
            },
        };
    }

    private getStatusCountByDiscipline(serviceStatusCounts: any, discipline: string, status: any) {
        const statusCounts = serviceStatusCounts.find((item: any) => item.name === discipline).statusCounts;
        return this.getStatusCount(statusCounts, status);
    }

    private getStatusCount(statusCounts: any, status: any) {
        return statusCounts.find((item: any) => item.name === status.name).count;
    }

    private getExitedCount(serviceStatusCounts: any, discipline: string) {
        return serviceStatusCounts.find((item: any) => item.name === discipline).exited;
    }

    private mockStatsIeps(state: PLComponentStateInterface) {
        state.model.data.statsIeps = {
            serviceStatusCounts: [
                {
                    name: 'BMH',
                    exited: 3,
                    statusCounts: [
                        { name: 'Achieved', count: 1 },
                        { name: 'Partially Achieved', count: 5 },
                        { name: 'Discontinued', count: 3 },
                        { name: 'Not Addressed', count: 7 },
                    ],
                },
                {
                    name: 'OT',
                    exited: 1,
                    statusCounts: [
                        { name: 'Achieved', count: 5 },
                        { name: 'Partially Achieved', count: 3 },
                        { name: 'Discontinued', count: 7 },
                        { name: 'Not Addressed', count: 1 },
                    ],
                },
                {
                    name: 'SLT',
                    exited: 2,
                    statusCounts: [
                        { name: 'Achieved', count: 3 },
                        { name: 'Partially Achieved', count: 2 },
                        { name: 'Discontinued', count: 9 },
                        { name: 'Not Addressed', count: 4 },
                    ],
                },
            ],
            statusCounts: [
                { name: 'Achieved', count: 9 },
                { name: 'Partially Achieved', count: 10 },
                { name: 'Discontinued', count: 19 },
                { name: 'Not Addressed', count: 12 },
            ],
        };

        this.util.mockLog('MOCK_IEP_STATS', state.model.data.statsIeps, state);
    }

    private test(state: PLComponentStateInterface) {
        this.util.runTest(state, () => {
            const params = {
                schoolYearCode: state.currentSchoolYearCode,
                id: this.uuid,
                isLocation: this.isLocation,
            };

            // stats ieps (IEP final goal status)
            this.dashboardService.getStatsIeps$(params, state).subscribe((res: any) => {
                state.test.statsIeps = res.statsIeps;
                this.util.testLog('stats ieps', res, state);
            });

            // stats services (Student Status)
            this.dashboardService.getStatsServices$(params, state).subscribe((res: any) => {
                state.test.statsServices = res.statsServices;
                this.util.testLog('stats services', res, state);
            });

            // stats absences (Attendance)
            this.dashboardService.getStatsAbsences$(params, state).subscribe((res: any) => {
                state.test.statsAbsences = res.statsAbsences;
                this.util.testLog('stats absences', res, state);
            });
        });
    }

    //#endregion Private Methods
}

const IEP_STATUS = {
    ACHIEVED: { name: 'Achieved' },
    PARTIALLY_ACHIEVED: { name: 'Partially Achieved' },
    DISCONTINUED: { name: 'Discontinued' },
    NOT_ADDRESSED: { name: 'Not Addressed' },
};

const IEP_SERVICE_TYPE = {
    BMH: { key: 'BMH' },
    OT: { key: 'OT' },
    SLT: { key: 'SLT' },
};
