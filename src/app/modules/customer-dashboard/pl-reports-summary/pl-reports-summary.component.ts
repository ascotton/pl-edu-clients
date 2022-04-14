import { Component, Input, OnInit, OnDestroy } from '@angular/core';

import { PLUtilService, PLComponentStateInterface } from '@common/services';
import { PLCustomerDashboardService } from '../pl-customer-dashboard.service';

@Component({
    selector: 'pl-reports-summary',
    templateUrl: './pl-reports-summary.component.html',
    styleUrls: ['./pl-reports-summary.component.less'],
})
export class PLReportsSummaryComponent implements OnInit, OnDestroy {
    componentName = 'PLReportsSummaryComponent';
    _state: PLComponentStateInterface;

    @Input() organizationId: string;
    @Input() locationId: string;
    @Input() locationName: string;
    @Input() currentSchoolYearCode: string;

    constructor(private util: PLUtilService, private dashboardService: PLCustomerDashboardService) {}

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
                mocks: [],
            },
            fn: (state: PLComponentStateInterface, done) => {
                state.currentSchoolYearCode = this.currentSchoolYearCode;

                state.clientOpts = [];
                state.locationOpts = [];
                state.clientId = '';

                state.type = 'client';
                state.classesToggle = { client: 'info', location: '' };

                if (this.locationId) {
                    done({ message: 'location context passed in' });
                } else {
                    done({ message: 'org context passed in' });
                }
            },
        });
    }

    ngOnDestroy(): void {
        this.util.destroyComponent(this._state);
    }

    // --------------------------
    // public methods
    // --------------------------
    onSearchClients(evt: { value: string }, state: PLComponentStateInterface) {
        state.clientsLoading = true;
        const vars: any = {
            schoolYearCode_In: state.currentSchoolYearCode,
            phiOnly: true,
            fullName_Icontains: evt.value,
        };

        if (this.locationId) vars.locationId = this.locationId;
        else vars.organizationId_In = this.organizationId;

        this.dashboardService.searchClientsByName$(vars, state).subscribe((res: any) => {
            state.clientOpts = res.clients.map((client: any) => {
                return {
                    value: client.id,
                    label: `${client.firstName} ${client.lastName}`,
                };
            });
            state.clientsLoading = false;
        });
    }

    onSearchLocations(evt: { value: string }, state: PLComponentStateInterface) {
        // if we're viewing a location, no need to search
        if (this.locationId) {
            state.locationOpts = [{ value: this.locationId, label: this.locationName }];
            return;
        }

        state.locationsLoading = true;
        const vars: any = {
            name_Icontains: evt.value,
            isActive: true,
            organizationId_In: this.organizationId,
        };

        this.dashboardService.getLocations$(vars, state).subscribe((res: any) => {
            state.locationOpts = res.locations.map((location: any) => {
                return {
                    value: location.id,
                    label: location.name,
                };
            });
            state.locationsLoading = false;
        });
    }

    toggleType(type: string, state: PLComponentStateInterface) {
        state.type = type;
        for (const key in state.classesToggle) {
            if (key === type) {
                state.classesToggle[key] = 'info';
            } else {
                state.classesToggle[key] = '';
            }
        }
    }
}
