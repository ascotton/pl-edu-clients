import {
    Input,
    OnInit,
    Component,
    ChangeDetectionStrategy,
    SimpleChanges,
} from '@angular/core';
// Services
import { PLRecordParticipantsService } from '../pl-record-participants.service';
import { PLRecordService } from '../pl-record.service';
// Models
import { PLBillingCode } from '@common/interfaces';
import { PLEvent } from '../../models';
import { User } from '@modules/user/user.model';

@Component({
    selector: 'pl-records-preview',
    templateUrl: './pl-records-preview.component.html',
    styleUrls: ['./pl-records-preview.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLRecordsPreviewComponent implements OnInit {

    records: any[];
    billingCodeClass: any;
    @Input() showLocation: boolean;
    @Input() event: PLEvent;
    @Input() user: User;
    @Input() billingCodes: PLBillingCode[];

    constructor(
        private plRecordParticipants: PLRecordParticipantsService,
        private plRecord: PLRecordService) { }

    ngOnInit() {
        this.createRecords();
    }

    ngOnChanges(changes: SimpleChanges) {
        const { event } = changes;
        if (event && !event.firstChange) {
            this.createRecords();
        }
    }

    private createRecords() {
        this.records = this.plRecordParticipants.formRecords(this.event)
            .map(record =>
                this.plRecord.recordToView(record, this.user, this.billingCodes))
            .sort((a, b) => a.title.localeCompare(b.title));
    }
}
