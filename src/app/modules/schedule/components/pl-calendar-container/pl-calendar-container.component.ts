import * as moment from 'moment';
import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    OnDestroy,
    HostListener,
    ViewChild,
    ElementRef,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
// RxJs
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { map, distinctUntilChanged, tap, takeUntil } from 'rxjs/operators';
// Ng Material
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
// NgRx Store
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import {
    selectEvents,
    selectScheduleView,
    PLGetEvents,
    selectIsLoadingEvents,
    PLSetCalendarView,
    PLDeleteEvent,
    PLSaveEvent,
} from '../../store/schedule';
import {
    selectCaseload,
} from '../../store/clients';
import {
    PLFetchDocumentationAssistant,
    selectDocumentationData,
} from '../../store/documentation';
import {
    selectLocations,
    PLLoadAllLocations,
} from '../../store/locations';
import { selectBillingCodes } from '@common/store/billing';
import { PLFetchTimesheetPreview, selectTimesheetPreview } from '@common/store/timesheet';
// Services
import { PLMayService } from '@root/index';
import { PLProviderAvailabilityService } from '@app/modules/locations/services';
// Models
import {
    PLEvent,
    PLEventRepeatMode,
    PLModalEventOptions,
    PL_EVENT_SOURCE,
    PL_CALENDAR_VIEW,
    PL_CALENDAR_VIEW_CONVERTER,
} from '../../models';
// Dialog Components
import { PLEventComponent } from '../pl-event/pl-event.component';
// Common
import { PLConfirmDialog2Component } from '@common/components';
import { PLFetchInvoicePreview } from '@common/store/invoice/invoice.store';
import { PLStandaloneDocumentationContainerComponent } from '@modules/workflow-manager/workflows/invoice-documentation';
import { PLAppointmentService, PLScheduleHelperService } from '../../services';

// tslint:disable-next-line: enforce-component-selector
@Component({
    templateUrl: './pl-calendar-container.component.html',
    styleUrls: ['./pl-calendar-container.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [PLProviderAvailabilityService],
})
export class PLCalendarContainerComponent implements OnInit, OnDestroy {
    @ViewChild('filtersContainer') filtersContainer: ElementRef;
    @ViewChild('calendarContainer') calendarContainer: ElementRef;

    private destroyed$ = new Subject<boolean>();
    private availabilityWarningOpen = false;
    private didAvailabilityCheck = false;
    private lastUserDataLoaded = '';
    private isW2Provider = false;

    availability: any;

    events$ = this.store$.select(selectEvents);
    billingCodes$ = this.store$.select(selectBillingCodes);
    caseload$ = this.store$.select(selectCaseload);
    locations$ = this.store$.select(selectLocations);
    selectedDate: any;

    queryParams$ = this.route.queryParams.pipe(
        tap(({ view, start, unsigned }) => {
            // TODO: Should Update View and Events at same time
            const viewType = view ? PL_CALENDAR_VIEW_CONVERTER[view] : PL_CALENDAR_VIEW.Week;
            this.store$.dispatch(PLSetCalendarView({
                viewType,
                // provider: providerUuid,
                unsigned: !!unsigned,
                date: start,
            }));
        }),
        distinctUntilChanged((prev, curr) =>
            prev.view === curr.view &&
            prev.end === curr.end &&
            prev.start === curr.start),
    );

    params$ = combineLatest([
        this.queryParams$,
        this.route.params,
        this.route.data,
    ]).pipe(
        map(([{ start, end, unsigned, view, vs, ve }, { provider: providerUuid }, { provider, amendmentDate }]) => ({
            vs,
            ve,
            end,
            view,
            start,
            unsigned,
            provider,
            providerUuid,
            amendmentDate,
        })));

    isLoading$ = this.store$.select(selectIsLoadingEvents);

    data$ = combineLatest([
        this.params$,
        this.store$.select(selectScheduleView),
        this.store$.select(selectTimesheetPreview),
        this.store$.select(selectDocumentationData),
    ]).pipe(
        map(([params, view, timesheetData, invoiceData]) => {
            const { amendmentDate } = params;
            const {
                provider,
                currentUser: user,
            } = params.provider;
            const isViewOnlyUser = params.providerUuid && params.providerUuid !== user.uuid;
            const isAdmin = this.plMay.isAdmin(user);
            const isLead = this.plMay.isLead(user);
            const isCAM = this.plMay.isClinicalAccountManager(user);
            let tabs: any = [
                {
                    href: `/schedule/calendar${isViewOnlyUser ? `/${params.providerUuid}` : ''}`,
                    label: 'Calendar',
                    replaceHistory: true,
                },
            ];
            let idaData: any;
            if (!isViewOnlyUser) {
                tabs = [
                    ...tabs,
                    { href: `/availability`, label: 'Availability', replaceHistory: true },
                    { href: `/assignments`, label: 'Assignments', replaceHistory: true },
                ];
                // If the user is a W2Provider; use the timesheetData
                this.isW2Provider = user.xProvider.isW2;
                idaData = user.xProvider.isW2 &&
                    user.xEnabledFeatures.find((element: string) => element === 'timesheet')
                        ? timesheetData : invoiceData;
            }

            // TODO: locations should be handled by resolver (like we do for PLLoadCaseload)
            const userBeingViewed = params.providerUuid ? params.providerUuid : user.uuid;
            if (this.lastUserDataLoaded !== userBeingViewed) {
                this.lastUserDataLoaded = userBeingViewed;

                this.store$.dispatch(PLLoadAllLocations({ payload: { checkLead: true } }));
            }

            // check availability once, and only for yourself
            if (!this.didAvailabilityCheck
                && !isViewOnlyUser
                && !isAdmin
                && !isCAM
                && !params.providerUuid
            ) {
                this.didAvailabilityCheck = true;

                this.plProviderAvailability
                    .fetch(user.uuid)
                    .subscribe((providerAvailability) => {
                        this.availability = this.plProviderAvailability.getFreshnessInfo(providerAvailability);
                        if (this.availability.status.code === 'FORCE') {
                            this.showAvailabilityWarning(
                                this.availability.isFirstTime,
                                this.availability.status.value,
                            );
                        }
                    });
            }

            return {
                view,
                user,
                tabs,
                params,
                idaData,
                provider,
                amendmentDate,
                providerUuid: isViewOnlyUser ? params.providerUuid : user.uuid,
                permissions: {
                    isCAM,
                    isLead,
                    isAdmin,
                    isViewOnlyUser: !!isViewOnlyUser,
                    provideServices: user.xGlobalPermissions && user.xGlobalPermissions.provideServices,
                },
            };
        }));

    constructor(
        private store$: Store<AppStore>,
        private dialog: MatDialog,
        private plMay: PLMayService,
        private plProviderAvailability: PLProviderAvailabilityService,
        private plAppointment: PLAppointmentService,
        private route: ActivatedRoute,
        private router: Router,
        private helper: PLScheduleHelperService,
    ) { }

    ngOnInit() {
        setTimeout(() => { this.setLeftRailHeight(); }, 100);
        this.params$
            .pipe(takeUntil(this.destroyed$))
            .subscribe(({ start: pStart, end: pEnd, vs, ve, unsigned, view, providerUuid, provider }) => {
                let start = pStart;
                let end = pEnd;
                if (vs && ve) {
                    start = vs;
                    end = ve;
                }
                if (start) {
                    let timezone;
                    if (provider && provider.provider) {
                        timezone = provider.provider.timezone;
                    }
                    this.store$.dispatch(PLGetEvents({
                        end,
                        start,
                        timezone,
                        provider: providerUuid,
                        source: PL_EVENT_SOURCE.Calendar,
                    }));
                }
            });
    }

    ngOnDestroy() {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    private isDocumented(appointment: PLEvent): boolean {
        return appointment.signed ? true :
            appointment.records
                .map(r => r.hasOwnProperty('signed_on'))
                .reduce((p, c) => p || c, false);
    }

    openEventModal(amendmentDate: any, options?: PLModalEventOptions, isReadOnly?: boolean) {
        const _data: PLModalEventOptions = {
            isNew: true,
            repeat: PLEventRepeatMode.All,
            ...options,
        };
        const open = (data: PLModalEventOptions) => {
            const dialogRef = this.dialog
                .open(PLEventComponent, {
                    data,
                    maxHeight: '100vh',
                    minWidth: '950px',
                    disableClose: true,
                });
            this.closeDialogsOnEscape(dialogRef);
            dialogRef.afterClosed()
                .subscribe((res) => {
                    if (res && res.document) {
                        this.openDocumentEvent({
                            appointment: res.appointment,
                            isModal: false,
                            readonly: false,
                        }, isReadOnly);
                    }
                });
        };
        if (!_data.isNew && _data.event.event.repeating) {
            const allowFuture = !this.isDocumented(_data.event);
            this.showEventConfirmation(_data.event.event.repeating, true, allowFuture)
                .subscribe((repeat: PLEventRepeatMode) => {
                    if (!repeat) {
                        return;
                    }
                    const onSuccess = () => { open({ ..._data, repeat }); };
                    this.checkToConfirmRepeatingEventChange(repeat, _data.event, onSuccess, null);
                });
            return;
        }
        open(_data);
    }

    private checkToConfirmRepeatingEventChange(
        repeat: PLEventRepeatMode,
        event: PLEvent,
        onSuccess: any,
        onCancel: any,
    ) {
        repeat === PLEventRepeatMode.Following ?
            this.confirmRepeatingEventChange(event, onSuccess, onCancel) :
            onSuccess();
    }

    private confirmRepeatingEventChange(event: PLEvent, onSuccess: any, onCancel: any) {
        this.plAppointment
            .getCountOfPersistedFutureAppointmentsInRecurringSeries(event)
            .subscribe((count: any) => {
                if (count === 0) {
                    onSuccess();
                } else {
                    const dialogRef = this.dialog.open(PLConfirmDialog2Component, {
                        data: {
                            title: 'Confirm',
                            message: KILL_FUTURE_PERSISTED,
                            options: [
                                {
                                    label: 'Continue',
                                    color: 'accent',
                                    type: 'raised',
                                },
                                { label: 'Cancel', class: 'gray-outline' },
                            ],
                        },
                    });
                    dialogRef.afterClosed()
                        .subscribe((res) => {
                            if (res === 'Continue') {
                                onSuccess();
                            } else if (onCancel) {
                                onCancel();
                            }
                        });
                }
            });
    }

    openDocumentEvent($event: { appointment: PLEvent, readonly: boolean, isModal?: boolean }, isReadOnly?: boolean) {
        const preloaded = !!$event.isModal;
        const dialogRef = this.dialog
            .open(PLStandaloneDocumentationContainerComponent, {
                data: {
                    preloaded,
                    readOnly: $event.readonly,
                    appointment: $event.appointment,
                },
                maxHeight: '100vh',
                panelClass: 'standalone-documentation',
                disableClose: true,
            });
        this.closeDialogsOnEscape(dialogRef);
        if (!isReadOnly) {
            dialogRef.afterClosed()
                .subscribe(() => {
                    if (this.isW2Provider) {
                        this.store$.dispatch(PLFetchTimesheetPreview());
                    } else {
                        this.store$.dispatch(PLFetchInvoicePreview({ source: 'schedule' }));
                    }
                    // TODO: Have a flag to know when user hit save to update only if needed
                    this.store$.dispatch(PLFetchDocumentationAssistant({}));
                });
        }
    }

    editTime(e: { event: PLEvent, start: string; end: string; onCancel: any }) {
        const { event: prevEvent, start, end } = e;

        if (!prevEvent) {
            return;
        }

        const onSuccess = (repeatMode: PLEventRepeatMode) => {
            const event = {
                ...prevEvent,
                start,
                end,
            };

            // adjust the recurrence pattern if necessary
            // TODO: refactor all logic regarding recurrence_params to common component
            if (repeatMode === PLEventRepeatMode.Following) {
                if (event.event.recurrence_frequency === 'WEEKLY') {
                    // get rrule day for pre- and post-edit
                    let prevDay = moment(prevEvent.start).weekday();
                    prevDay = prevDay === 0 ? 6 : prevDay - 1;

                    let newDay = moment(start).weekday();
                    newDay = newDay === 0 ? 6 : newDay - 1;

                    // remove the day the event was coming from and add the new day

                    // last param is always "byweekday", e.g. interval:1,byweekday:0 or interval:1,byweekday:4,5
                    const params = event.event.recurrence_params.split(';');
                    if (params.length === 0 || params[params.length - 1].indexOf('byweekday') === -1) {
                        if (onCancel) {
                            onCancel();
                        }
                        return;
                    }

                    // split on ":"
                    const parts = params[params.length - 1].split(':');
                    const days = parts[parts.length - 1].split(',');

                    const finalDays = [newDay];
                    days.forEach((day: any) => {
                        const numDay = Number(day);
                        if (numDay !== prevDay && numDay !== newDay) {
                            finalDays.push(day);
                        }
                    });

                    finalDays.sort();

                    // rejoin string
                    params.pop();
                    const finalByWeekDay = `${parts[0]}:${finalDays.join(',')}`;

                    const recurrenceParams = `${params.join(';')};${finalByWeekDay}`;
                    event.event = {
                        ...event.event,
                        recurrence_params: recurrenceParams
                    };
                }
            }

            this.store$.dispatch(PLSaveEvent({
                payload: {
                    prevEvent,
                    event,
                    document: false,
                    keepOpen: false,
                    repeat: repeatMode,
                    runCancel: onCancel,
                },
            }));
        };

        const onCancel = () => {
            if (e.onCancel) {
                e.onCancel();
            }
        };

        if (e.event && e.event.event && e.event.event.repeating) {
            this.showEventConfirmation(true, true, true)
                .subscribe((repeatMode: PLEventRepeatMode) => {
                    if (!repeatMode) {
                        if (e.onCancel) {
                            onCancel();
                        }
                        return;
                    }

                    this.checkToConfirmRepeatingEventChange(
                        repeatMode,
                        e.event,
                        () => { onSuccess(repeatMode); },
                        () => { onCancel(); },
                    );
                });
        } else {
            onSuccess(PLEventRepeatMode.One);
        }
    }

    onDateChange(data: any) {
        const { type, viewStart, viewEnd, unsigned } = data;
        const { start, end } = data;
        const _start = moment.utc(start);
        let _end = moment.utc(end);
        if (type === 'day') {
            _end = _start.clone().add(1, 'day');
        }
        let queryParams: any = {
            view: type,
            start: _start.format('YYYY-MM-DD'),
            end: _end.format('YYYY-MM-DD'),
        };
        if (type === 'month') {
            const { vs, ve } = this.route.snapshot.queryParams;
            queryParams = { ...queryParams, vs, ve };
        }
        if (viewStart && viewEnd) {
            queryParams = {
                ...queryParams,
                vs: moment.utc(viewStart).format('YYYY-MM-DD'),
                ve: moment.utc(viewEnd).format('YYYY-MM-DD'),
            };
        }
        if (unsigned) {
            queryParams = {
                ...queryParams,
                unsigned,
            };
        }
        if (data.selectedDate) {
            this.selectedDate = data.selectedDate;
        }

        this.router.navigate([], { queryParams });
    }

    goToday(params: any, timezone: string) {
        this.selectedDate = moment().format('YYYY-MM-DD');
        this.onFiltersChanged(params);
    }

    onFiltersChanged(params: any, event?: any) {
        const data: any = {
            date: params.start,
            viewType: params.view ? PL_CALENDAR_VIEW_CONVERTER[params.view] : PL_CALENDAR_VIEW.Week,
        };
        if (params.unsigned) {
            data.unsigned = true;
        }
        if (event) {
            if (event.date) {
                data.date = event.date;
                this.selectedDate = event.date;
            }
            if (event.unsigned) {
                data.unsigned = event.unsigned === 'unsigned';
            }
        } else {
            data.date = new Date();
        }
        this.store$.dispatch(PLSetCalendarView(data));
        // this.onDateChange(data);
    }

    deleteEvent(event: PLEvent, amendmentDate: any) {
        const allowFuture = !this.isDocumented(event);
        this.showEventConfirmation(event.event.repeating, false, allowFuture)
            .subscribe((deleteType: any) => {
                if (!deleteType) {
                    return;
                }
                const onSuccess = () => {
                    const isAmendable = this.helper.isAmendable(amendmentDate, event);
                    this.store$.dispatch(PLDeleteEvent({ event, deleteType, isAmendable }));
                };
                if (deleteType === PLEventRepeatMode.Following) {
                    this.confirmRepeatingEventChange(event, onSuccess, null);
                } else {
                    onSuccess();
                }
            });
    }

    showEventConfirmation(repeating = false, edit = true, allowFuture = true): Observable<string> {
        const title = `${edit ? 'Edit' : 'Delete'}${repeating ? ' Repeating' : ''} Event`;
        let message = 'Are you sure you want to permanently delete this event?';
        let options: any[] = [{
            label: 'Delete',
            color: 'accent',
            type: 'raised',
            value: PLEventRepeatMode.One,
        }];
        if (repeating && edit && !allowFuture) {
            return of(PLEventRepeatMode.One);
        }
        if (repeating && allowFuture) {
            message = `Do you want to ${edit ? 'edit' : 'delete'} only this event or all future events?`;
            options = [
                {
                    label: 'Only This Event',
                    value: PLEventRepeatMode.One,
                    color: 'accent',
                    type: 'raised',
                },
                { label: 'All Future Events', class: 'gray-outline', value: PLEventRepeatMode.Following },
            ];
        }
        const dialogRef = this.dialog.open(PLConfirmDialog2Component, {
            data: { title, message, options },
        });
        return dialogRef.afterClosed();
    }

    showAvailabilityWarning(isFirstTime: boolean, s: number) {
        if (this.availabilityWarningOpen) {
            return;
        }
        this.availabilityWarningOpen = true;
        const title = `Availability ${!isFirstTime ? 'Update' : ''}`;
        const message =
            `<div>
                Before you view the schedule,
                ${isFirstTime ?
                'please fill out and confirm your <br/> availability so we know' :
                'confirm your availability so we know <br/>'}
                when you're available to work.
            </div>
            <div>&nbsp;</div>
            <div>
                ${isFirstTime ?
                'This information helps us set you up with assignments with <br/> customers that best fit your schedule.' :
                'We need to make sure our information is up to date.'}
            </div>
            <div>&nbsp;</div>`;

        const options: any[] = [{
            label: 'Continue to Availability',
            color: 'accent',
            type: 'raised',
            value: 'continue',
        }];
        const dialogRef = this.dialog.open(PLConfirmDialog2Component, {
            data: { title, message, options, disableClose: true },
            disableClose: true,
        });
        dialogRef.afterClosed().subscribe((value) => {
            if (value === 'continue') {
                this.router.navigate(['./availability'], { queryParams: { s } });
                this.availabilityWarningOpen = false;
            }
        });
    }

    private closeDialogsOnEscape(dialogRef: MatDialogRef<any>) {
        dialogRef.keydownEvents()
            .subscribe(({ key }) => {
                if (key === 'Escape') {
                    dialogRef.close();
                }
            });
    }

    private setLeftRailHeight() {
        if (!this.filtersContainer.nativeElement || !this.calendarContainer.nativeElement) return;

        const height = this.calendarContainer.nativeElement.offsetHeight;
        this.filtersContainer.nativeElement.style.height = height + 'px';
    }

    @HostListener('window:resize', ['$event']) onResize(event: any) {
        this.setLeftRailHeight();
    }
}

// tslint:disable-next-line: max-line-length
const KILL_FUTURE_PERSISTED = 'If you continue, documentation or changes to future events in the series will be lost.<br /><br />Are you sure you want to continue?';
