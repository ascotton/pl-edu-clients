import {
    Component,
    ChangeDetectionStrategy,
    OnInit,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    SimpleChanges,
    HostBinding,
    ChangeDetectorRef,
} from '@angular/core';
import * as moment from 'moment';
import { PLTimezoneService } from '@root/index';
import { PLTimeGridService } from '@common/services';

import { User } from '@modules/user/user.model';
import { PLBillingCode } from '@common/interfaces';
import { PLEvent, PLEventRecord } from '../../models';
import { PLMayService } from '@root/src/lib-components';
import { PLScheduleHelperService } from '../../services';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { PLRecordParticipantsService } from '../../pl-records/pl-record-participants.service';

@Component({
    selector: 'pl-event-preview',
    templateUrl: './pl-event-preview.component.html',
    styleUrls: ['./pl-event-preview.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('plEventPreviewAppearing', [
            state('visible', style({
                opacity: 1,
            })),
            transition('void => *', [
                style({
                    opacity: 0,
                }),
                animate(250)
            ]),
        ])
    ],
})
export class PLEventPreviewComponent implements OnInit, OnChanges {

    eventEdit: boolean;
    eventDelete: boolean;
    eventDocumentEdit: boolean;
    eventDocumentView: boolean;
    canViewDocumentationDetail: boolean;
    isAmendable: boolean;
    isBlackoutDay: boolean;
    records: PLEventRecord[];
    eventView: {
        type: string;
        dateTimeDisplay?: string;
        billingName?: string;
        availabilityDetails?: string;
    };
    recurrencePattern = '';
    notFoundClients: PLEventRecord[];
    locationName = '';

    @Input() readOnly = false;
    @Input() displayActionButtonsInPreview = false;
    @Input() user: User;
    @Input() timezone: string;
    @Input() event: PLEvent;
    @Input() dateState: any;
    @Input() billingCodes: PLBillingCode[] = [];
    @Input() caseload: any[] = [];
    @Input() @HostBinding('class.modal') isModal = true;
    @Input() isSelected: boolean = null;
    @Output() public readonly action: EventEmitter<{ type: string; value?: any; }> = new EventEmitter();

    constructor(
        private plMay: PLMayService,
        private cdr: ChangeDetectorRef,
        private plTime: PLTimeGridService,
        private plTimezone: PLTimezoneService,
        private plHelper: PLScheduleHelperService,
        private plRecordParticipants: PLRecordParticipantsService,
    ) { }

    ngOnInit() {
        this.prepareEvent();
    }

    ngOnChanges(changes: SimpleChanges) {
        const { event } = changes;
        if (event && !event.firstChange) {
            this.prepareEvent();
        }
    }

    onCheckedChanged() {
        // need timeout here due to timeout inside pl-input-checkbox component
        setTimeout(() => {
            this.action.emit({ type: 'edit_bulk_check_changed' });
        }, 100);
    }

    deselectCheckbox() {
        // to get the checkbox to reset, need to set isSelected to null, then to false
        if (this.isSelected) {
            this.isSelected = null;
            this.cdr.detectChanges();
            this.isSelected = false;
            this.cdr.detectChanges();
        }
    }

    prepareEvent() {
        if (this.plHelper.eventIsBilling(this.event)) {
            this.records = this.plRecordParticipants.formRecords(this.event);
        }
        this.isAmendable = this.plHelper.isAmendable(this.dateState, this.event, this.timezone);
        this.isBlackoutDay = this.event.is_blacked_out || !!localStorage.getItem('DEBUG_BLACKOUT_DAY');
        this.eventView = this.formatEvent(this.event, this.records);
        this.recurrencePattern = this.getRecurrencePattern(this.event);

        if (!this.displayActionButtonsInPreview) return;

        const caseloadIds = this.caseload.map(c => c.uuid);
        this.notFoundClients = [];
        if (!this.plMay.isSuperuser(this.user)
            && !this.plMay.isSupport(this.user)
            && !this.plMay.isClinicalAccountManager(this.user)) {
            this.notFoundClients = this.event.records
                .filter(r => (r.signed && !r.billing_code)
                    || (!!r.client && !caseloadIds.includes(r.client)));
        }
        this.eventEdit = this.plHelper.eventEdit(this.user, this.event, this.dateState);
        this.eventDelete = !this.notFoundClients.length && this.plHelper.eventDelete(this.user, this.event);
        this.eventDocumentEdit = this.plHelper.eventEditDocumentation(this.user, this.event, this.dateState);
        this.eventDocumentView = !this.notFoundClients.length && this.plHelper.eventViewDocumentation(this.event);
        this.canViewDocumentationDetail = true;

        // add the client's location, if any
        if (this.event.clients.length > 0) {
            const student = this.caseload.find((x: any) => x.uuid === this.event.clients[0].uuid);
            if (student && student.locations && student.locations.length > 0) {
                this.locationName = student.locations[0].name;
            }
        }

        // set the "isSelected" flag; we'll leave it "null" if event is not multi-select'able
        if (this.eventDocumentEdit) {
            if (this.event.billing_expanded &&
                CAN_MULTISELECT_BILLINGCODES.includes(this.event.billing_expanded.code)
            ) {
                this.isSelected = false;
            }
        }
    }

    formatEvent(event: PLEvent, records: PLEventRecord[]) {
        let start = moment(event.start);
        let end = moment(event.end);
        if (this.timezone) {
            start = start.tz(this.timezone);
            end = end.tz(this.timezone);
        }
        let availabilityDetails = '';
        if (this.plHelper.eventIsAvailability(event)) {
            const diffHours = moment(event.end, this.plTimezone.dateTimeFormat).diff(
                moment(event.start, this.plTimezone.dateTimeFormat), 'hours', true);
            const hoursLabel = (diffHours === 1) ? 'Hour' : 'Hours';
            availabilityDetails = `Available for ${diffHours} ${hoursLabel}`;
        }
        return {
            ...event,
            availabilityDetails,
            type: event.event.event_type,
            dateTimeDisplay: this.plTime.formatRange({ start, end }, 'timeFirst'),
            billingName: (records && records[0] && records[0].billing_expanded) ?
                records[0].billing_expanded.name : '',
        };
    }

    getRecurrencePattern(event: PLEvent) {
        if (event.event.recurrence_frequency === 'WEEKLY') {
            const params = event.event.recurrence_params.split(';');
            if (params.length === 0 || params[params.length - 1].indexOf('byweekday') === -1) {
                return '';
            }

            let everyText = '';
            if (event.event.recurrence_params.startsWith('interval:1')) {
                everyText = 'Weekly on ';
            } else if (event.event.recurrence_params.startsWith('interval:2')) {
                everyText = 'Every 2 weeks on ';
            } else if (event.event.recurrence_params.startsWith('interval:3')) {
                everyText = 'Every 3 weeks on ';
            } else if (event.event.recurrence_params.startsWith('interval:4')) {
                everyText = 'Every 4 weeks on ';
            } else {
                return 'Recurring event';
            }

            const parts = params[params.length - 1].split(':');
            const days = parts[parts.length - 1].split(',');

            if (days.length === 7) {
                return 'Recurring event';
            }

            days.sort();

            const DAY_NUM_TO_TEXT = (days.length <= 2) ? [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
            ] : [
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
                'Sun',
            ];

            const daysText: any[] = [];
            days.forEach((day: any) => {
                const numDay = Number(day);
                daysText.push(DAY_NUM_TO_TEXT[numDay]);
            });

            const finalDaysText = (daysText.length === 1) ?
                daysText[0] :
                `${daysText.slice(0, -1).join(', ')} and ${daysText.slice(-1)}`;

            return everyText + finalDaysText;
        }
        if (event.event.recurrence_frequency === 'MONTHLY' && event.event.recurrence_params.startsWith('interval:1')) {
            return 'Monthly';
        }
        if (event.event.recurrence_frequency === 'MONTHLY' && event.event.recurrence_params.startsWith('interval:2')) {
            return 'Every 2 months';
        }
        if (event.event.recurrence_frequency) {
            return 'Recurring event';
        }
        return '';
    }

    document(isReadonly = false) {
        this.plHelper.openAmendWarning(this.event, isReadonly ? false : this.isAmendable).subscribe((res: any) => {
            if (['yes', 'confirm'].includes(res)) {
                this.action.emit({
                    type: 'document',
                    value: isReadonly && this.event.locked,
                });
            }
        });
    }

    delete() {
        this.plHelper.openAmendWarning(this.event, this.isAmendable).subscribe((res: any) => {
            if (['yes', 'confirm'].includes(res)) {
                this.action.emit({ type: 'delete' });
            }
        });
    }

    edit() {
        this.plHelper.openAmendWarning(this.event, this.isAmendable).subscribe((res: any) => {
            if (['yes', 'confirm'].includes(res)) {
                this.action.emit({ type: 'edit' });
            }
        });
    }
}

const CAN_MULTISELECT_BILLINGCODES = [
    'cf_slpa_cota_sup_direct',
    'cf_slpa_cota_sup_indirect',
    'consultation',
    'direct_makeup',
    'direct_services',
    'group_bmh',
    'iep_meeting',
];