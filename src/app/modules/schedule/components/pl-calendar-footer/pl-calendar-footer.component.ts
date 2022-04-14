import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { first } from 'rxjs/operators';
import { PL_EVENT_FILTERS } from '../../constants';
import { PLTimezoneService } from '@root/index';
import { CurrentUserService } from '@modules/user/current-user.service';

@Component({
    selector: 'pl-calendar-footer',
    templateUrl: './pl-calendar-footer.component.html',
    styleUrls: ['./pl-calendar-footer.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlCalendarFooterComponent {
    @Input() timezone: string;

    timezone_name = '';
    filters = PL_EVENT_FILTERS;

    constructor(
        private plTimezone: PLTimezoneService,
        private plCurrentUserService: CurrentUserService,
        private cdr: ChangeDetectorRef,
    ) {
    }

    ngOnInit() {
        if (this.timezone) {
            this.timezone_name = this.timezone;
        } else {
            this.plCurrentUserService
                .getCurrentUser()
                .pipe(first())
                .subscribe((user: any) => {
                    this.timezone_name = this.plTimezone.getUserZone(user);
                    this.cdr.markForCheck();
                });
        }
    }
}
