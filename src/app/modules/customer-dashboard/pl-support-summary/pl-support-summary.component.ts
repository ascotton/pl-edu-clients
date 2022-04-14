import { Component, Input, OnInit, OnDestroy } from '@angular/core';

import { PLToastService } from '@root/index';
import { PLUtilService, PLComponentStateInterface } from '@common/services';
import { PLCustomerDashboardService } from '../pl-customer-dashboard.service';

@Component({
    selector: 'pl-support-summary',
    templateUrl: './pl-support-summary.component.html',
    styleUrls: ['./pl-support-summary.component.less'],
})
export class PLSupportSummaryComponent implements OnInit, OnDestroy {
    componentName = 'PLSupportSummaryComponent';
    _state: PLComponentStateInterface;

    @Input() uuid: string;

    constructor(
        private plToast: PLToastService,
        private util: PLUtilService,
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
                    // 'MOCK_CSM',
                    // 'MOCK_CQM'
                ],
            },
            afterDoneFn: (state: PLComponentStateInterface) => {
                state.init = true;
            },
            fn: (state: PLComponentStateInterface, done) => {
                state.idea = {};
                state.summaryOpts = [
                    { value: 'new_idea', label: 'New Idea' },
                    { value: 'student_details', label: 'Student Details' },
                    { value: 'provider_information', label: 'Provider Information' },
                    { value: 'absence_idea', label: 'Absence Idea' },
                    { value: 'data_visualization', label: 'Data Visualization' },
                    { value: 'other', label: 'Other' },
                ];

                state.asyncCount = 1;

                if (this.uuid) this.getStats(state, done);
                else done();
            },
        });
    }

    ngOnDestroy() {
        this.util.destroyComponent(this._state);
    }

    // tslint:disable-next-line: use-life-cycle-interface
    ngOnChanges(changes: any) {
        if (!this._state || !this._state.init) return;

        this.getStats(this._state, () => {});
    }

    // --------------------------
    // public methods
    // --------------------------
    submitIdea(evt: any) {
        const vars: any = {
            summary: this._state.idea.summary,
            description: this._state.idea.description,
            component: 'customer-dashboard',
        };

        this.dashboardService.saveIdeaFeedback$(vars, this._state).subscribe((res: any) => {
            this.plToast.show('success', 'Idea submitted', 2000, true);
            this._state.idea = {};
        });
    }

    canDisplayCsm() {
        const obj = this._state.model.csm;
        return obj && (obj.name || obj.email || obj.phone);
    }

    canDisplayCqm() {
        const obj = this._state.model.cqm;
        return obj && (obj.name || obj.email || obj.phone);
    }

    // --------------------------
    // private methods
    // --------------------------
    private getStats(state: PLComponentStateInterface, done: any) {
        const vars = {
            id: this.uuid,
        };

        this.dashboardService.getOrganizationOverview$(vars, state).subscribe((res: any) => {
            state.model.data.organizationOverview = res.organization;
            if (this.util.flag(state, 'MOCK_CSM')) {
                this.mockOrgCSM(state);
            }
            this.initCsmValues(state);
            if (this.util.flag(state, 'MOCK_CQM')) {
                this.mockOrgCQM(state);
            }
            this.initCqmValues(state);
            done();
        });
    }

    private initCsmValues(state: PLComponentStateInterface) {
        const csmRaw = (state.model.data.csmRaw =
            (state.model.data.organizationOverview && state.model.data.organizationOverview.accountOwner) || {});
        const csm = (state.model.csm = {
            name: `${csmRaw.firstName || ''} ${csmRaw.lastName || ''}`.trim(),
            email: csmRaw.email || '',
            phone: (csmRaw.profile && csmRaw.profile.primaryPhone) || '',
        });
        if (!(csm.name || csm.email || csm.phone)) {
            state.model.csm = undefined;
        }
    }

    private initCqmValues(state: PLComponentStateInterface) {
        const cqmRaw = (state.model.data.cqmRaw =
            (state.model.data.organizationOverview && state.model.data.organizationOverview.accountCqm) || {});
        const cqm = (state.model.cqm = {
            name: `${cqmRaw.firstName || ''} ${cqmRaw.lastName || ''}`.trim(),
            email: cqmRaw.email || '',
            phone: (cqmRaw.profile && cqmRaw.profile.primaryPhone) || '',
        });
        if (!(cqm.name || cqm.email || cqm.phone)) {
            state.model.cqm = undefined;
        }
    }

    private mockOrgCSM(state: PLComponentStateInterface) {
        state.model.data.organizationOverview.accountOwner = {
            email: 'csm@email.com',
            firstName: 'First',
            lastName: 'Last',
            profile: {
                primaryPhone: '000-000-0000',
            },
        };
        this.util.mockLog('MOCK_CSM', state.model.data.organizationOverview.accountOwner, state);
    }

    private mockOrgCQM(state: PLComponentStateInterface) {
        state.model.data.organizationOverview.accountCqm = {
            email: 'cqm@email.com',
            firstName: 'First',
            lastName: 'Last',
            profile: {
                primaryPhone: '000-000-0000',
            },
        };
        this.util.mockLog('MOCK_CQM', state.model.data.organizationOverview.accountCqm, state);
    }
}
