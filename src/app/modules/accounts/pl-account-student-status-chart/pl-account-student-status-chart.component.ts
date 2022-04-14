import { Component, Input } from '@angular/core';

import {
    PLStylesService,
} from '@root/index';

@Component({
    selector: 'pl-account-student-status-chart',
    templateUrl: './pl-account-student-status-chart.component.html',
    styleUrls: ['./pl-account-student-status-chart.component.less'],
})

export class PLAccountStudentStatusChartComponent {
    @Input() studentStats: any;
    @Input() sideBySide: boolean;

    studentStatusChartData: any = {
        datasets: [{ data: [0, 0, 0] }],
        datasetsForChart: [{ data: [0, 0, 0] }],
        labels: [
            SERVICE_STATUS.ONBOARDING.name,
            SERVICE_STATUS.IN_SERVICE.name,
            SERVICE_STATUS.NOT_IN_SERVICE.name,
        ],
        colors: [
            {
                backgroundColor: [this.getColor('yellow'), this.getColor('green'), this.getColor('gray')],
                borderColor: [this.getColor('white'), this.getColor('white'), this.getColor('white')],
            },
        ],
        options: {
            responsive: true,
            legend: false,
        },
    };

    constructor(
        private plStyles: PLStylesService,
    ) {}

    ngOnChanges(changes: any) {
        if (changes.studentStats) {
            const onboarding = this.getStatusCount(this.studentStats, SERVICE_STATUS.ONBOARDING);
            const inService = this.getStatusCount(this.studentStats, SERVICE_STATUS.IN_SERVICE);
            const notInService = this.getStatusCount(this.studentStats, SERVICE_STATUS.NOT_IN_SERVICE);

            if (onboarding === 0 && inService === 0 && notInService === 0) {
                this.studentStatusChartData = null;
            } else {
                this.studentStatusChartData.datasets = [{ data: [onboarding, inService, notInService] }];

                // timeout here helps with animation
                setTimeout(() => {
                    if (this.studentStatusChartData != null) {
                        this.studentStatusChartData.datasetsForChart = this.studentStatusChartData.datasets;
                    }
                }, 100);
            }
        }
    }

    private getStatusCount(statusCounts: any, status: any) {
        return statusCounts.find((item: any) => item.name === status.name).count;
    }

    private getColor(color: string) {
        return `#${this.plStyles.getColorForName(color)}`;
    }
}

const SERVICE_STATUS = {
    IN_SERVICE: { name: 'In Service' },
    NOT_IN_SERVICE: { name: 'Not In Service' },
    ONBOARDING: { name: 'Onboarding' },
};
