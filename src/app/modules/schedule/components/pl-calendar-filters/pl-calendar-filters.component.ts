import {
    Component,
    EventEmitter,
    Output,
    OnInit,
    Input,
    OnChanges,
    SimpleChanges,
    OnDestroy,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { User } from '../../../user/user.model';
import { PLTimezoneService } from '@root/index';
import { PLBillingCode } from '@common/interfaces';
import { AppStore } from '@root/src/app/appstore.model';
import { selectScheduleView } from '../../store/schedule';

@Component({
    selector: 'pl-calendar-filters',
    templateUrl: './pl-calendar-filters.component.html',
    styleUrls: ['./pl-calendar-filters.component.less'],
})
export class PLCalendarFiltersComponent implements OnInit, OnChanges, OnDestroy {

    @Input() filterDate: any;
    @Input() user: User;
    @Input() unsigned = 'all';
    @Input() billingCodes: PLBillingCode[];
    @Input() idaData: any;
    @Input() timezone: string;
    @Input() viewOnly: boolean;

    @Output() readonly filtersChanged: EventEmitter<any> = new EventEmitter();

    calendarViewSubscription$: Subscription;

    fteInCalendarProps: { inCalendarWeekView: boolean, weekDate: string } = {
        inCalendarWeekView: false,
        weekDate: '',
    };

    isW2Provider = false;

    constructor(private plTimezone: PLTimezoneService, private store$: Store<AppStore>) { }

    ngOnInit() {
        if (!this.timezone) this.timezone = this.plTimezone.getUserZone(this.user);

        this.isW2Provider = (
            this.user.xProvider && 
            this.user.xProvider.isW2 && 
            this.user.xEnabledFeatures.find(element => element === 'timesheet')
        ) ? true : false;

        this.calendarViewSubscription$ = this.store$.select(selectScheduleView).subscribe(
            (view) => {
                this.fteInCalendarProps.inCalendarWeekView = view.type === 'timeGridWeek';
                this.setWeekDateFromFilterDate(this.filterDate);
            }
        );
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.filterDate && this.calendarViewSubscription$) {
            this.setWeekDateFromFilterDate(this.filterDate);
        }
    }

    ngOnDestroy(): void {
        if (this.calendarViewSubscription$) this.calendarViewSubscription$.unsubscribe();
    }

    dateChanged(value: any) {
        this.filterDate = value;
        this.filtersChanged.emit({ date: this.filterDate });
    }

    unsignedChanged(value: string) {
        this.unsigned = value;
        this.filtersChanged.emit({ unsigned: value });
    }

    /**
     * Only applicable for when the view of the calendar is on week view.
     * @param filterDate - The date of the week the user has selected in the calendar.
     */
    private setWeekDateFromFilterDate(filterDate: string) {
        if (this.fteInCalendarProps.inCalendarWeekView && filterDate !== this.fteInCalendarProps.weekDate) {
            this.fteInCalendarProps = {
                ... this.fteInCalendarProps,
                weekDate: filterDate,
            }
        }
    }

}
