import {
    Input,
    Component,
    OnChanges,
    SimpleChanges,
    ChangeDetectionStrategy,
} from '@angular/core';

@Component({
    selector: 'pl-platform-user-activity',
    templateUrl: './platform-user-activity.component.html',
    styleUrls: ['./platform-user-activity.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLPlatformUserActivityComponent implements OnChanges {

    @Input() fullWidth = false;
    @Input() usage: { [key: number]: number }[];
    items: { value: string; time: string }[];

    ngOnChanges(changes: SimpleChanges) {
        const { usage } = changes;
        if (usage) {
            this.items = this.usage ? [
                { value: this.usage['1'], time: '24 hours' },
                { value: this.usage['7'], time: '7 days' },
                { value: this.usage['30'], time: '30 days' },
            ] : [];
        }
    }
}
