import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';

@Component({
    selector: 'pl-client-absences-dashboard-bucket',
    templateUrl: './pl-client-absences-dashboard-bucket.component.html',
    styleUrls: ['./pl-client-absences-dashboard-bucket.component.less'],
})
export class PLClientAbsencesDashboardBucketComponent {
    @Input() canDownload: boolean = false;
    @Input() count: number = 0;
    @Input() priority: number;
    @Input() isApplied: boolean = false;
    @Input() filterButtonAnalyticsClass = '';
    @Input() downloadButtonAnalyticsClass = '';

    @Output() toggle: EventEmitter<number> = new EventEmitter<number>();
    @Output() download: EventEmitter<number> = new EventEmitter<number>();

    wrapperClasses() {
        return {
            applied: this.isApplied,
        };
    }

    downloadIconClasses(): any {
        return {
            white: this.isApplied,
            orange: this.priority === 1 && !this.isApplied,
            blue: this.priority === 2 && !this.isApplied,
            'gray-darkest': this.priority === 3 && !this.isApplied,
        };
    }

    filterButtonLabel(): string {
        return this.isApplied ? 'Remove Filter' : 'Apply Filter';
    }

    onFilterButtonClick() {
        this.toggle.emit(this.priority);
    }

    onDownloadClick() {
        this.download.emit(this.priority);
    }
}
