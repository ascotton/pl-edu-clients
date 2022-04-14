import {
  ChangeDetectionStrategy,
  HostBinding,
  Component,
  Input,
  OnInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { PLStylesService } from '@root/index';

@Component({
    selector: 'pl-doughnut-chart',
    templateUrl: './pl-doughnut-chart.component.html',
    styleUrls: ['./pl-doughnut-chart.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLDoughnutChartComponent implements OnInit, OnChanges {

    @Input() data: { label: string; value: number, color?: string }[];
    @Input() @HostBinding('style.width.px') width = 200;
    @Input() @HostBinding('style.height.px') height: number = this.width;
    @Input() max: number;
    @Input() color: string;
    @Input() value: number;
    @Input() title: string;
    @Input() loading: boolean;
    @Input() legendPosition: string;
    @Input() type: 'progress' | 'chart' = 'chart';
    @Input() showTooltips = true;
    @Input() valueLabel = 'Value';
    @Input() remainingLabel = 'Remaining';

    chartData: any;

    constructor(private plStyles: PLStylesService) {}

    ngOnInit() {
        if (this.type === 'progress') {
            this.buildProgressData();
        }
        this.buildChartData();
    }

    ngOnChanges(changes: SimpleChanges) {
        const { max, value, width, height, data } = changes;
        if (((max && !max.firstChange) || (value && !value.firstChange))
            && this.type === 'progress') {
            this.buildProgressData();
            this.buildChartData();
        }
        if (data) {
            this.buildChartData();
        }
        if (width) {
            this.height = this.width;
        }
        if (height) {
            this.width = this.height;
        }
    }

    private buildProgressData() {
        let value = this.value;
        if (value < 0) {
            value = 0;
        }
        let max = this.max - value;
        if (max < 0) {
            max = 0;
        }
        this.data = [
            {
                value,
                label: this.valueLabel,
                color: this.color || 'green',
            },
            {
                value: max,
                label: this.remainingLabel,
                color: 'gray-lighter',
            },
        ];
    }

    private buildChartData() {
        const _colors = this.data.map(d => this.getColor(d.color));
        const options: any = {
            responsive: true,
            aspectRatio: 1,
            cutoutPercentage: 85,
            tooltips: { enabled: this.showTooltips },
            legend: {
                display: false,
            },
        };
        if (this.title) {
            options.title = {
                display: true,
                text: this.title,
            };
        }
        if (this.legendPosition) {
            options.legend = {
                ...options.legend,
                position: this.legendPosition,
            };
        }
        this.chartData = {
            options,
            labels: this.data.map(d => d.label),
            data: this.data.map(d => d.value || 0),
            colors: [{ backgroundColor: _colors, borderColor: _colors }],
        };
    }

    private getColor(color: string) {
        return `#${this.plStyles.getColorForName(color)}`;
    }
}
