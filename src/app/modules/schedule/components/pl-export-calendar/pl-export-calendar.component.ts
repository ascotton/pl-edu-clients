import { environment } from '@environments/environment';
import {
    Component,
    ChangeDetectionStrategy,
    OnInit,
    Inject,
    ChangeDetectorRef,
} from '@angular/core';
import { PLScheduleService } from '../../services';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// tslint:disable-next-line: enforce-component-selector
@Component({
    templateUrl: './pl-export-calendar.component.html',
    styleUrls: ['./pl-export-calendar.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLExportCalendarComponent implements OnInit {

    private url = environment.apps.apiWorkplace.url;
    copied: boolean;
    exportDownloadUrl: string;
    exportDownloadUrlWebcal: string;

    constructor(private schedule: PLScheduleService,
        private cdr: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) public data: { provider: string }) {}

    ngOnInit() {
        this.schedule.getExportInfo(this.data.provider).subscribe(({ createCalendarForProvider }) => {
            const token = createCalendarForProvider.calendar.token;
            this.exportDownloadUrl = `${this.url}/api/v3/calendars/${token}/`;
            this.exportDownloadUrlWebcal = `webcal://${this.exportDownloadUrl.replace('https://', '')}`;
            this.cdr.detectChanges();
        });
    }

    exportCopyLink() {
        this.copied = true;
        navigator.clipboard.writeText(this.exportDownloadUrl);
        setTimeout(() => {
            this.copied = false;
            this.cdr.detectChanges();
        }, 3000);
    }
}
