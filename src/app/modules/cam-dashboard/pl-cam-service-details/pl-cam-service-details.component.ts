import { Component, Input, OnInit } from '@angular/core';
import { PLStylesService } from '@root/index';

@Component({
    selector: 'pl-cam-service-details',
    templateUrl: './pl-cam-service-details.component.html',
    styleUrls: ['./pl-cam-service-details.component.less'],
})
export class PLCamServiceDetailsComponent implements OnInit {
    @Input() serviceName: string;
    // Angular test runner complains about input "onboardingCount" in template
    @Input() inOnboardingCount: number;
    @Input() inServiceCount: number;
    @Input() notInServiceCount: number;
    @Input() assignedHours: number;
    @Input() contractedHours: number;

    public readonly SERVICE_STATUS = {
        IN_SERVICE: { name: 'In Service' },
        NOT_IN_SERVICE: { name: 'Not In Service' },
        // Heads-up: string includes soft-hyphen (On-boarding)
        ONBOARDING: { name: 'On­boarding' }, // Onboarding
    };

    public readonly chartOptions = {
        aspectRatio: 1,
        animation: { duration: 0 },
        cutoutPercentage: 70, // size of hole in middle of chart
        responsive: true,
        legend: false,
    };
    public readonly chartType = 'doughnut';
    public readonly chartLabels: string[] = [
        this.SERVICE_STATUS.IN_SERVICE.name,
        this.SERVICE_STATUS.ONBOARDING.name,
        this.SERVICE_STATUS.NOT_IN_SERVICE.name,
    ];

    public chartData: { data: number[], borderWidth: number }[];
    public chartColors: [ { backgroundColor: string[] } ];

    constructor(private plStyles: PLStylesService) {}

    ngOnInit(): void {
        const color = (name: string) => `#${this.plStyles.getColorForName(name)}`;

        this.chartColors = [{ backgroundColor:  [color('green'), color('yellow'), color('gray')] }];
        this.chartData = [{
            borderWidth: 0,
            data: [
                this.inServiceCount,
                this.inOnboardingCount,
                this.notInServiceCount,
            ],
        }];
    }

    total(): number {
        return this.inOnboardingCount + this.inServiceCount + this.notInServiceCount;
    }
}
