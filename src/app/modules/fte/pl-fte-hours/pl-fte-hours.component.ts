import * as moment from 'moment';
import { Store } from '@ngrx/store';
import { first } from 'rxjs/operators';
import { AppStore } from '@app/appstore.model';
import { PLUrlsService, PLGraphQLService, PLTimezoneService } from '@root/index';
import { PLAppointmentService } from '../../schedule/services/pl-appointment.service';
import { Component, Output, EventEmitter, Input, OnChanges, OnInit, OnDestroy, SimpleChanges } from '@angular/core';


const fteHoursQuery = require('../queries/fte-hours.graphql');
const fteHoursReasonWeeklyMutation = require('../queries/fte-hours-reason-weekly.graphql');
const fteHoursReasonPeriodMutation = require('../queries/fte-hours-reason-period.graphql');

@Component({
    selector: 'pl-fte-hours',
    templateUrl: './pl-fte-hours.component.html',
    styleUrls: ['./pl-fte-hours.component.less'],
})
export class PLFTEHoursComponent implements OnInit, OnChanges, OnDestroy {
    @Input() fteInCalendarProps: { inCalendarWeekView: boolean, weekDate: string } = {
        inCalendarWeekView: false,
        weekDate: '',
    };

    @Output() readonly displayFTEHours = new EventEmitter<any>();

    currentUser: any = {};
    headerDateString = '';
    view = 'weekly';
    date = '';
    minDateMonthly = '';
    maxDateMonthly = '';
    minDateWeekly = '';
    maxDateWeekly = '';
    urls: any;
    schools: any[] = [];
    schoolsData: any = {};
    dateFormat = 'YYYY-MM-DD';
    dateTimeFormat = 'YYYY-MM-DD HH:mm:ss';
    classes: any = {
        toggle: {
            weekly: '',
            monthly: '',
        },
        next: '',
        prev: '',
    };
    showInfoMonthly = false;

    private fteSchoolVarsForGQL: any = {}
    private isComponentRefreshing = false; // Change this from `isComponentRefreshingSetter()`
    private subscriptions: any = {};

    constructor(
        private plUrls: PLUrlsService,
        private store: Store<AppStore>,
        private plGraphQL: PLGraphQLService,
        private plTimezone: PLTimezoneService,
        private plAppointmentSvc: PLAppointmentService,
    ) {}

    get componentRefreshing() {
        return this.isComponentRefreshing;
    }

    ngOnInit() {
        this.urls = this.plUrls.urls;
        
        if (this.fteInCalendarProps.inCalendarWeekView && this.fteInCalendarProps.weekDate) {
            this.date = this.fteInCalendarProps.weekDate;
        } else {
            this.date = moment().format(this.dateFormat);
        }

        this.subscriptions.user = this.store.select('currentUser').subscribe(
            (user: any) => {
                this.currentUser = user;
                this.getSchools();
            }
        );

        if (this.fteInCalendarProps.inCalendarWeekView) {
            this.subscriptions.fteContractSvc = this.plAppointmentSvc.fteContractServiceSubject.subscribe(
                () => {
                    this.isComponentRefreshingSetter(true);
                    setTimeout(()=> { this.getSchools() }, 5000);
                }
            );
        }
    }

    ngOnChanges(): void {
        if(this.fteInCalendarProps.inCalendarWeekView) {
            // The logic in this condition is used only for the scenario of a user on the calendar in a week view.
            const isWeekDateUpdated = this.fteInCalendarProps.weekDate !== this.fteSchoolVarsForGQL.weeklyDate
            const validFTEWeeklyDate = (!!this.fteSchoolVarsForGQL && !!this.fteSchoolVarsForGQL.weeklyDate);

            if (validFTEWeeklyDate && isWeekDateUpdated) {
                this.date = this.fteInCalendarProps.weekDate;
                this.getSchools();
            }
        }
    }

    ngOnDestroy() {
        if (this.subscriptions && this.subscriptions.user) this.subscriptions.user.unsubscribe();
        if (this.subscriptions && this.subscriptions.fteContractSvc) this.subscriptions.fteContractSvc.unsubscribe();
    }

    toggleInterval(view: string) {
        this.showInfoMonthly = false;
        this.view = view;

        for (const key in this.classes.toggle) {
            if (this.view === key) {
                this.classes.toggle[key] = 'selected';
            } else {
                this.classes.toggle[key] = '';
            }
        }
        // First error check.
        if (this.minDateMonthly && this.minDateWeekly) {
            if (this.view === 'monthly') {
                if (this.date > this.maxDateMonthly) {
                    while (this.date > this.maxDateMonthly) {
                        this.goPrev(false);
                    }
                } else if (this.date < this.minDateMonthly) {
                    while (this.date < this.minDateMonthly) {
                        this.goNext(false);
                    }
                }
            } else if (this.view === 'weekly' && !this.fteInCalendarProps.inCalendarWeekView) {
                if (this.date > this.maxDateWeekly) {
                    while (this.date > this.maxDateWeekly) {
                        this.goPrev(false);
                    }
                } else if (this.date < this.minDateWeekly) {
                    while (this.date < this.minDateWeekly) {
                        this.goNext(false);
                    }
                }
            }
        }

        this.setCurrentView();
    }

    refresh() {
        this.getSchools();
    }

    updatePrevNextClasses() {
        const retHavePrev = this.havePrev();
        this.classes.prev = retHavePrev['havePrev'] ? '' : 'disabled';
        const retHaveNext = this.haveNext();
        this.classes.next = retHaveNext['haveNext'] ? '' : 'disabled';
    }

    havePrev() {
        let newDate;
        if (this.view === 'weekly') {
            newDate = moment(this.date, this.dateFormat).subtract(7, 'days').format(this.dateFormat);
            if (newDate >= this.minDateWeekly) {
                return {
                    newDate,
                    havePrev: true,
                };
            }
        } else if (this.view === 'monthly') {
            newDate = moment(this.date, this.dateFormat).subtract(1, 'month').format(this.dateFormat);
            if (newDate >= this.minDateMonthly) {
                return {
                    newDate,
                    havePrev: true,
                };
            }
        }
        return {
            havePrev: false,
        };
    }

    haveNext() {
        let newDate;
        if (this.view === 'weekly') {
            newDate = moment(this.date, this.dateFormat).add(7, 'days').format(this.dateFormat);
            if (newDate <= this.maxDateWeekly) {
                return {
                    newDate,
                    haveNext: true,
                };
            }
        } else if (this.view === 'monthly') {
            newDate = moment(this.date, this.dateFormat).add(1, 'month').format(this.dateFormat);
            if (newDate <= this.maxDateMonthly) {
                return {
                    newDate,
                    haveNext: true,
                };
            }
        }
        return {
            haveNext: false,
        };
    }

    goPrev(setView=true) {
        const retHavePrev = this.havePrev();
        if (retHavePrev['havePrev']) {
            this.date = retHavePrev['newDate'];
            if (setView) {
                this.setCurrentView();
            }
        }
    }

    goNext(setView=true) {
        const retHaveNext = this.haveNext();
        if (retHaveNext['haveNext']) {
            this.date = retHaveNext['newDate'];
            if (setView) {
                this.setCurrentView();
            }
        }
    }

    surveyDone(evt: any) {
        if (evt.reason) {
            const vars: any = {
                providerUserId: this.currentUser.uuid,
                date: this.date,
                clinicalCoordinatorId: evt.school.clinicalCoordinatorId,
                reason: evt.reason,
            };
            if (this.view === 'weekly') {
                this.plGraphQL.mutate(fteHoursReasonWeeklyMutation, vars, {}).pipe(first()).subscribe((res: any) => {
                    // Need to update reason for next time. Could be more performant and update local
                    // copy of schools data AND local copy of school instead.
                    this.getSchools();
                });
            } else if (this.view === 'monthly') {
                this.plGraphQL.mutate(fteHoursReasonPeriodMutation, vars, {}).pipe(first()).subscribe((res: any) => {
                    // Need to update reason for next time. Could be more performant and update local
                    // copy of schools data AND local copy of school instead.
                    this.getSchools();
                });
            }
        }
        evt.school.xShowOverForm = !evt.school.xShowOverForm;
    }

    getSchools() {
        this.isComponentRefreshingSetter(true);
        this.fteSchoolVarsForGQL.providerUserId= this.currentUser.uuid;
        
        if (this.fteInCalendarProps.inCalendarWeekView && this.fteInCalendarProps.weekDate) {
            this.fteSchoolVarsForGQL.weeklyDate = this.fteInCalendarProps.weekDate;
            this.fteSchoolVarsForGQL.periodDate = this.fteInCalendarProps.weekDate;
            this.fteSchoolVarsForGQL.weeklyBefore = 1;
            this.fteSchoolVarsForGQL.weeklyAfter = 1;
        } else {
            const userTimezone = this.plTimezone.getUserZone(this.currentUser);
            const nowString = moment().tz(userTimezone).format(this.dateFormat);
            
            this.fteSchoolVarsForGQL.weeklyDate = nowString;
            this.fteSchoolVarsForGQL.periodDate = nowString;
            this.fteSchoolVarsForGQL.periodBefore = 1;
            this.fteSchoolVarsForGQL.periodAfter = 1;
            this.fteSchoolVarsForGQL.weeklyBefore = 5;
            this.fteSchoolVarsForGQL.weeklyAfter = 5;
        }
        
        this.plGraphQL.query(fteHoursQuery, this.fteSchoolVarsForGQL, { suppressError: true }).pipe(first()).subscribe((res: any) => {
            // If no hours, hide FTE.
            let atLeastOneNotEmpty = false;

            if (res && res.billingPeriods && res.billingPeriods.length) {
                // Should be first and last items BUT in case have no values, want to skip.
                let minDate = '';
                let maxDate = '';

                res.billingPeriods.forEach((billingPeriod: any) => {
                    if (billingPeriod.periodHours && billingPeriod.periodHours.length) {
                        atLeastOneNotEmpty = true;
                        if (!minDate || billingPeriod.start < minDate) {
                            minDate = billingPeriod.start;
                        }
                        if (!maxDate || billingPeriod.end > maxDate) {
                            maxDate = billingPeriod.end;
                        }
                    }
                });

                this.minDateMonthly = minDate;
                this.maxDateMonthly = maxDate;
            }

            if (res && res.weeklyHours && res.weeklyHours.length) {
                this.minDateWeekly = res.weeklyHours[0].start;
                this.maxDateWeekly = res.weeklyHours[(res.weeklyHours.length - 1)].end;
            }

            if (atLeastOneNotEmpty) {
                this.schoolsData = res;
                this.toggleInterval(this.view);
                this.displayFTEHours.emit({ showFTE: atLeastOneNotEmpty });
            }
            
            this.isComponentRefreshingSetter(false);
            this.displayFTEHours.emit({ showFTE: atLeastOneNotEmpty });
        }, 
        () => {
            this.isComponentRefreshingSetter(false);
            this.displayFTEHours.emit({ showFTE: false });
        });
    }

    // Go through the schools data and pick out the ones that match the current date range.
    setCurrentView() {
        let school;
        const schools: any[] = [];

        if (this.view === 'weekly' && this.schoolsData.weeklyHours) {
            this.schoolsData.weeklyHours.forEach((weeklyHours: any) => {
                if (this.date >= weeklyHours.start && this.date <= weeklyHours.end) {
                    school = {
                        name: weeklyHours.clinicalCoordinator.name,
                        clinicalCoordinatorId: weeklyHours.clinicalCoordinator.id,
                        reason: weeklyHours.reason,
                        scheduledMinutes: weeklyHours.scheduled,
                        assignedMinutes: weeklyHours.assigned,
                        start: moment(weeklyHours.start, this.dateFormat).format(this.dateTimeFormat),
                        end: moment(weeklyHours.end, this.dateFormat).format(this.dateTimeFormat),
                    };
                    schools.push(this.formatSchool(school));
                }
            });
        } else if (this.view === 'monthly' && this.schoolsData.billingPeriods) {
            this.schoolsData.billingPeriods.forEach((periodData: any) => {
                if (this.date >= periodData.start && this.date <= periodData.end) {
                    periodData.periodHours.forEach((periodHours: any) => {
                        school = {
                            name: periodHours.clinicalCoordinator.name,
                            clinicalCoordinatorId: periodHours.clinicalCoordinator.id,
                            reason: periodHours.reason,
                            scheduledMinutes: periodHours.scheduled,
                            assignedMinutes: periodHours.assigned,
                            start: moment(periodData.start, this.dateFormat).format(this.dateTimeFormat),
                            end: moment(periodData.end, this.dateFormat).format(this.dateTimeFormat),
                        };
                        schools.push(this.formatSchool(school));
                    });
                }
            });
        }

        this.formHeaderDate(schools);
        this.schools = schools;
        if (!this.fteInCalendarProps.inCalendarWeekView) this.updatePrevNextClasses();
    }

    /**
     * First condition is for the scenario of a user being on the calendar on a week view.
     * Second condition is for when the widget is displayed on the main dashboard.
     * Sets the title thw widget must have regarding date range e.g. "Oct 31 - Nov 6"
     * 
     * @param schools - An array of objects with the school info to display.
     */
    formHeaderDate(schools: any[]) {
        // Calendar on week view scenario:
        if (this.fteInCalendarProps.inCalendarWeekView) {
            if (!schools.length) {
                this.headerDateString = 'There\'s no FTE info for the current week.';
                return;
            } 

            const school = schools[0];
            const schoolEndHardCoded = moment(school.end, this.dateFormat).subtract(1, 'days').format(this.dateFormat);
            const schoolStartHardCoded = moment(school.start, this.dateFormat).subtract(1, 'days').format(this.dateFormat);

            this.headerDateString = this.shortRange(schoolStartHardCoded, schoolEndHardCoded);
            return;
        }

        // Main Dashboard scenario:
        if (schools.length) {
            const school = schools[0];

            if (this.view === 'weekly') {
                this.headerDateString = this.shortRange(school.start, school.end);
            } else {
                this.headerDateString = `${moment(school.start, this.dateTimeFormat).format('MMMM')} Billing Period`;
            }
        }
    }

    shortRange(startString:string, endString:string) {
        const now = moment();
        let start;
        let end;
        start = moment(startString, this.dateTimeFormat);
        end = moment(endString, this.dateTimeFormat);
        let formatStart;
        let formatEnd;
        // if (now.year() !== start.year() || start.year() !== end.year()) {
        //     formatStart = 'MMM D, YYYY';
        //     formatEnd = 'MMM D, YYYY';
        // } else {
        //     formatStart = 'MMM D';
        //     formatEnd = 'MMM D, YYYY';
        // }
        formatStart = 'MMM D';
        formatEnd = 'MMM D';
        return `${start.format(formatStart)} - ${end.format(formatEnd)}`;
    }

    formatSchool(school: any) {
        school.xClasses = {
            status: '',
        };
        school.xStyles = {
            bar: {
                width: '100%',
            },
        };
        school.xTitle = '';
        school.xShowOverForm = false;

        school.xHoursDisplay = this.minutesToHoursHtml(school.scheduledMinutes);
        school.xTargetHoursDisplay = this.minutesToHoursHtml(school.assignedMinutes);
        let minutesDiff;
        if (school.scheduledMinutes === 0) {
            school.xStatusDisplay = `${school.xTargetHoursDisplay} REMAINING`;
            school.xClasses.bar = 'percent0';
            school.xTitle = 'You have not scheduled hours';
        }
        else if (school.scheduledMinutes > school.assignedMinutes) {
            minutesDiff = school.scheduledMinutes - school.assignedMinutes;
            school.xStatusDisplay = `${this.minutesToHoursHtml(minutesDiff)} OVER`;
            school.xClasses.status = 'over';
            school.xClasses.bar = 'percent101';
            school.xTitle = 'You have over scheduled hours';
        } else {
            minutesDiff = school.assignedMinutes - school.scheduledMinutes;
            school.xStatusDisplay = `${this.minutesToHoursHtml(minutesDiff)} REMAINING`;
            if (minutesDiff === 0) {
                school.xClasses.bar = 'percent100';
                school.xTitle = 'You have scheduled your target hours';
            } else {
                let percent = school.scheduledMinutes / school.assignedMinutes * 100;
                school.xStyles.bar.width = `${percent}%`;
                if (percent >= 90) {
                    school.xClasses.bar = 'percent90';
                    school.xTitle = 'You are nearing your target hours';
                } else {
                    school.xClasses.bar = 'percent89';
                }
            }
        }

        const now: any = moment();
        if (moment(school.end, this.dateTimeFormat).format(this.dateFormat) < now.format(this.dateFormat)) {
            school.xClasses.wrapper = 'past'
        }

        return school;
    }

    minutesToHoursHtml(totalMinutes: number) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        let html = `<b>${hours}</b>hrs`;
        if (minutes !== 0) {
            html += ` <b>${minutes}</b>min`;
        }
        return html;
    }

    /**
     * @param isRefreshing - Boolean for telling whther the component is refreshing or not
     */
    private isComponentRefreshingSetter(isRefreshing: boolean) {
        this.isComponentRefreshing = isRefreshing;
    }
};
