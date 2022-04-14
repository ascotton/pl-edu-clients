import {
    Component,
    ChangeDetectionStrategy,
    Input,
    OnChanges,
    SimpleChanges,
} from '@angular/core';

@Component({
    selector: 'pl-training-graphs',
    templateUrl: './training-graphs.component.html',
    styleUrls: ['./training-graphs.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLTrainingGraphsComponent implements OnChanges {
    @Input() chartWidth = 250;
    @Input() completed: number;
    @Input() attended: number;
    @Input() inProgress: number;
    @Input() total: number;
    @Input() loading: boolean;
    liveTraining: any;
    teletherapyFoundationsTraining: any;

    ngOnChanges(changes: SimpleChanges) {
        const { completed, inProgress, total } = changes;
        if (completed || inProgress || total) {
            this.buildData();
        }
    }

    buildData() {
        this.liveTraining = [
            {
                label: 'Attended',
                color: 'green',
            },
            {
                label: 'Not Attended',
                color: 'gray-lighter',
            },
        ];
        /*
        if (!this.inProgress || !this.completed || !this.total) {
            return;
        }
        */
        this.teletherapyFoundationsTraining = [
            {
                label: 'Completed',
                value: this.completed,
                color: 'green',
            },
            {
                label: 'In Progress',
                value: this.inProgress,
                color: 'yellow',
            },
            {
                label: 'Not Started',
                value: this.total - this.inProgress - this.completed,
                color: 'gray-lighter',
            },
        ];
    }
}
