import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
// NgRx
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { PLScheduleSession, PLDeleteSession } from '../../store';
// Services
import { PLModalService } from '@root/index';
import { PLTimeGridService, PL_DAY_FORMAT } from '@common/services';
import { PLLocationSchedulerService } from '../../services';
// Models
import { Option, PLReferral } from '@common/interfaces';
import { PLProviderSession, PLProvider, PLLocation } from '../../models';

@Component({
    selector: 'pl-student-schedule-editor',
    templateUrl: './pl-student-schedule-editor.component.html',
    styleUrls: ['./pl-student-schedule-editor.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLStudentScheduleEditorComponent {

    readonly daysOptions: Option[] =
        this.plTimeGridService.createWeekdays(PL_DAY_FORMAT.Full)
            .map(({ key, label }) => ({ label, value: key }));
    readonly weekOptions: Option[] = [
        { value: 1, label: '1st' },
        { value: 2, label: '2nd' },
        { value: 3, label: '3rd' },
        { value: 4, label: '4th' },
    ];
    @Input() timezone: string;
    @Input() appointment: PLProviderSession;
    @Input() provider: PLProvider;
    @Input() location: PLLocation;
    @Input() isNew: boolean; // New, Edit
    @Input() availabilityCheck: Function;
    timeErrors: string;
    canEditReferrals = false;

    constructor(
        private store$: Store<AppStore>,
        private plModal: PLModalService,
        private plTimeGridService: PLTimeGridService,
        private schedulerService: PLLocationSchedulerService) {
    }

    ngOnInit() {
        this.canEditReferrals = this.isNew && this.appointment.referrals.length > 1;
    }

    get selectedDay() {
        const { day, week } = this.appointment;
        const dayName = this.daysOptions
            .find(o => o.value === day)
            .label;
        return week ?
            `${this.weekOptions[week - 1].label} ${dayName}` :
            `${dayName}s`;
    }

    get title() {
        const newTitle = this.appointment.referrals.length > 1 ? 'Group' : 'Reserve';
        const editTitle = 'Edit';
        return `${this.isNew ? newTitle : editTitle} Therapy Session`;
    }

    removeReferral(referral: PLReferral) {
        let { referrals } = this.appointment;
        referrals = referrals
            .filter(({ id }) => id !== referral.id);
        const referralIds = referrals
            .map(({ id }) => id);
        this.appointment = { ...this.appointment, referrals, referralIds };
        this.canEditReferrals = this.isNew && this.appointment.referrals.length > 1;
    }

    dayChange(value: string) {
        // this.checkAvailability();
    }

    timeChanged(time: any, isStart: boolean) {
        console.log(isStart ? 'start' : 'end', time);
        let { start, end } = this.appointment;
        this.timeErrors = '';
        isStart ? start = time : end = time;
        this.appointment = { ...this.appointment, start, end };
        if (start > end) {
            this.timeErrors = 'Start time is after end time.';
            return;
        }
        this.checkAvailability();
    }

    checkAvailability() {
        const { start, end, day, week } = this.appointment;
        const timeFrame = this.plTimeGridService.timeObj({ start, end }, this.timezone);
        const stations = this.availabilityCheck(day, timeFrame, week);
        if (stations <= 0) {
            this.timeErrors = 'Can not reserve during this time frame.';
        }
    }

    onSave() {
        const time = this.plTimeGridService.timeObj(this.appointment, this.timezone);
        const locTime = this.plTimeGridService.toLocalTimeFrameStr(time, this.location.timezone);
        this.store$.dispatch(PLScheduleSession({ appointment: { ...this.appointment, ...locTime } }));
        this.close();
    }

    onDelete() {
        this.store$.dispatch(PLDeleteSession({ appointment: this.appointment }));
        this.close();
    }

    close() {
        this.plModal.destroyAll();
    }
}
