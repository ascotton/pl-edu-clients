
import * as moment from 'moment';
import {
    ChangeDetectionStrategy,
    ViewEncapsulation,
    Component,
    Renderer2,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    OnInit,
    OnChanges,
    SimpleChanges,
    ComponentRef,
    ElementRef,
    OnDestroy,
    ComponentFactoryResolver,
    Injector,
    EmbeddedViewRef,
    ChangeDetectorRef,
} from '@angular/core';
// Ng Material
import { MatDialog } from '@angular/material/dialog';
import { ComponentPortal } from '@angular/cdk/portal';
import { OverlayRef, Overlay, OverlayPositionBuilder } from '@angular/cdk/overlay';
// Full Calendar
import { FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
// Models
import { User } from '@modules/user/user.model';
import { PLBillingCode } from '@common/interfaces';
import {
    PLEvent,
    PLClient,
    PLLocation,
    PLModalEventOptions,
    PL_CALENDAR_VIEW,
    PL_CALENDAR_VIEW_CONVERTER_USER,
} from '../../models';
import { PL_EVENT_FILTERS } from '../../constants';
// Services
import { PLTimezoneService, PLModalService } from '@root/index';
import { PLTimeGridService } from '@root/src/app/common/services/pl-time-grid.service';
import { PLScheduleHelperService } from '../../services/pl-schedule-helper.service';
import { PLInvoiceDocumentationService } from '@modules/workflow-manager/workflows/invoice-documentation';
// Modal
import { PLEventPreviewComponent } from '../pl-event-preview/pl-event-preview.component';
import { PLExportCalendarComponent } from '../pl-export-calendar/pl-export-calendar.component';
import { PLSelectBillingCodeComponent } from '../pl-select-billing-code/pl-select-billing-code.component';
import { SvgInlineNgPluginService } from '@root/src/build/svg-inline-ng-plugin.service';

interface PreviewModalAxisX {
    originX: "start" | "end" | "center",
    overlayX: "start" | "end" | "center",
}

enum RenderedCalendar {
    Rendered = 'RENDERED',
    Destroyed = 'DESTROYED'
}

@Component({
    selector: 'pl-calendar',
    templateUrl: './pl-calendar.component.html',
    styleUrls: ['./pl-calendar.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
})
export class PLCalendarComponent implements OnInit, OnDestroy, OnChanges {

    private overlayRef: OverlayRef;
    private isCalendarRendered: boolean;
    private listPreviewComponents: ComponentRef<PLEventPreviewComponent>[] = [];

    private clearModalsTimeout: any;
    private previewModalTimeout: any;

    private plEventPreviewComponentRef: any = null; // For having a picture across the class of the preview modal

    private WEEK_DAYS = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
    };

    arePLEventsBuilt = false;
    firstDay: number;
    now: any;

    calendarEvents: any[];
    calendarPlugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin];
    
    buttonText = {
        day: 'Day',
        month: 'Month',
        week: 'Week',
        list: 'List',
    };
    customButtons = {
        addEvent: {
            text: '+ Add Event',
            click: () => {
                this.clearModals();
                let addDate: moment.Moment;
                const now = moment();
                if (this.selectedDate) {
                    const _selected = moment.tz(this.selectedDate, this.timezone).set({ h: 9, m: 0 });
                    if (!_selected.isSame(now, 'day')) {
                        addDate = _selected.clone();
                    }
                }
                if (!addDate) {
                    const remainder = 30 - (now.minute() % 30);
                    addDate = now.clone().add(remainder, 'm');
                }
                addDate.set({ s: 0 });
                const start = this.plTimezone.toUserZone(addDate, null, this.timezone)
                    .format(this.plTimezone.formatDateTime);
                const end = this.plTimezone.toUserZone(addDate.clone().add(30, 'm'), null, this.timezone)
                    .format(this.plTimezone.formatDateTime);
                this.openEventDialog(start, end);
            },
        },
        selectAll: {
            text: 'Select All',
            click: () => {
                this.listPreviewComponents.forEach((item: any) => {
                    if (item.instance.isSelected === false) {
                        item.instance.isSelected = true;
                    }
                });
            },
        },
        bulkUpdate: {
            text: 'Bulk Change Billing Code',
            click: () => {
                let modalRef: any;
                const params = {
                    selectedItems: this.getBulkEditSelectItems(),
                    billingCodes: this.billingCodes,
                    onCancel: () => {
                        modalRef._component.destroy();
                    },
                    onSaveComplete: () => {
                        modalRef._component.destroy();

                        this.getBulkEditSelectItems().forEach((item: any) => {
                            item.instance.isSelected = false;
                        });

                        this.setBulkEditButtonVisibility();
                    },
                };
                this.plModal.create(PLSelectBillingCodeComponent, params)
                    .subscribe((ref: any) => {
                        modalRef = ref;
                    });
            },
        },
        hideWeekends: {
            text: `Hide weekends`,
            click: () => {
                this.weekends = false;
                this.header.right = this.buildRightHeader();
                this.cdr.detectChanges();
            },
        },
        showWeekends: {
            text: `Show weekends`,
            click: () => {
                this.weekends = true;
                this.header.right = this.buildRightHeader();
                this.cdr.detectChanges();
            },
        },
        exportCalendar: {
            text: 'Export Calendar',
            click: () => {
                this.clearModals();
                this.dialog.open(PLExportCalendarComponent, {
                    width: '500px',
                    data: {
                        provider: this.provider,
                    },
                });
            },
        },
        today: {
            text: 'Today',
            disabled: true,
            click: () => this.today.emit(),
        },
    };
    header = {
        left: 'today prev,next title',
        right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek',
    };
    listDayFormat = {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    };


    renderedCalendarEnumReference = RenderedCalendar; // Var for usage in the HTML only.

    weekends = true;
    weekendsToggle: boolean;

    @Input() user: User;
    @Input() providerProfile: any;
    @Input() provider: string;
    @Input() timezone: string;
    @Input() events: PLEvent[];
    @Input() defaultView: PL_CALENDAR_VIEW;
    @Input() defaultDate: Date;
    @Input() view: { type: PL_CALENDAR_VIEW, date?: Date, unsigned?: boolean };
    @Input() readonly: boolean;
    // calendar
    @Input() billingCodes: PLBillingCode[];
    @Input() caseload: PLClient[] = [];
    @Input() locations: PLLocation[] = [];
    @Input() selectedDate: Date;
    @Input() lastKnownDate: Date;
    @Input() dateState: any;
    @Output() readonly today: EventEmitter<void> = new EventEmitter();
    @Output() readonly openModal: EventEmitter<PLModalEventOptions> = new EventEmitter();
    @Output() readonly delete: EventEmitter<PLEvent> = new EventEmitter();
    @Output() readonly editTime: EventEmitter<
        { event: PLEvent, start: string; end: string; onCancel: any }> = new EventEmitter();
    @Output() readonly document: EventEmitter<{
        appointment: PLEvent,
        readonly?: boolean,
        isModal?: boolean,
    }> = new EventEmitter();
    @Output() readonly dateChanged: EventEmitter<{
        end: string,
        start: string,
        viewEnd?: string,
        viewStart?: string,
        type: string,
        unsigned: boolean,
        selectedDate?: string,
    }> = new EventEmitter();

    @ViewChild('calendar', { static: true }) calendar: FullCalendarComponent;
    @ViewChild('calendar', { static: false }) calendarElementsRef: any;

    constructor(
        private cdr: ChangeDetectorRef,
        private renderer: Renderer2,
        private injector: Injector,
        private componentFactoryResolver: ComponentFactoryResolver,
        private helper: PLScheduleHelperService,
        private overlay: Overlay,
        private dialog: MatDialog,
        private plModal: PLModalService,
        private plTimezone: PLTimezoneService,
        private plTimeGridSvc: PLTimeGridService,
        private svgService: SvgInlineNgPluginService,
        private overlayPositionBuilder: OverlayPositionBuilder,
        private idaService: PLInvoiceDocumentationService,
    ) { }

    ngOnInit() {
        this.firstDay = localStorage.getItem('woody_monday') ? 1 : 0;
        this.weekendsToggle = !!localStorage.getItem('woody_weekends');
        this.defaultDate = this.view.date;
        this.overlayRef = this.overlay.create({
            scrollStrategy: this.overlay.scrollStrategies.block(),
        });
        this.overlayRef.backdropClick().subscribe(() => this.clearModals());
        this.defaultView = this.view.type;
        if (!this.timezone) this.timezone = this.plTimezone.getUserZone(this.user);
        this.now = this.plTimezone.getUserToday(this.user, this.plTimezone.formatDateTime);
        this.lastKnownDate = this.now;
        this.header.left = this.buildLeftHeader();
        this.header.right = this.buildRightHeader();
        this.setSelectAllButtonVisibility();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!this.isCalendarRendered) return;

        const { events, view, selectedDate } = changes;

        if (events) this.buildEvents();
        if (view && !view.firstChange) this.updateView(view.currentValue.type === view.previousValue.type);

        if (selectedDate) this.selectDayColumn();
        if (selectedDate && selectedDate.currentValue) localStorage.setItem('LAST_SELECTED_DATE', selectedDate.currentValue);
    }

    ngOnDestroy() {
        this.destroyListComponents();
        this.clearModals();
    }

    private buildLeftHeader() {
        let headerBtns = `today prev,next title`;
        if (this.user.xEnabledFeatures.includes('calendar-sync')) {
            headerBtns = `exportCalendar ${headerBtns}`;
        }

        headerBtns = `bulkUpdate ${headerBtns}`;

        // rg: can't get the checkbox to check :( // headerBtns = `selectAll ${headerBtns}`;

        if (!this.readonly) {
            headerBtns = `addEvent ${headerBtns}`;
        }

        return headerBtns;
    }

    private buildRightHeader() {
        let _weekends = '';
        if (this.weekendsToggle) {
            _weekends = this.weekends ? 'hideWeekends' : 'showWeekends';
        }
        return `${_weekends} timeGridDay,timeGridWeek,dayGridMonth,listWeek`;
    }

    private buildEvents() {
        this.calendarEvents = this.events.map((event: PLEvent) => this.buildEvent(event));
        this.resizeAllCalendarEvents();
        this.arePLEventsBuilt = true;
    }

    /**
     * Removes the event preview modal from the UI.
     * Sets to false the property of the event preview snapshot regarding the display of the buttons.
     *   - `plEventPreviewComponentRef` property is used on mouse hover/leaves for performing some actions
     */
    private clearModals() {
        this.clearTimeoutOfClearModals();
        this.clearTimeoutOfPreviewModal();

        if (this.overlayRef.hasAttached()) this.overlayRef.detach();
        
        if (this.plEventPreviewComponentRef && this.plEventPreviewComponentRef.instance) {
            this.plEventPreviewComponentRef.instance.displayActionButtonsInPreview = false;
        }
    }

    /**
     * Prepares the preview to display in the modal when hovering the calendar events.
     * Sets a snapshot on `plEventPreviewComponentRef` for knowing the props set on the modal across the class.
     * 
     * @param displayActionButtonsInPreview - Whether or not to display some of the clickable buttons in the preview modal
     */
    private preparePreview(
        componentRef: ComponentRef<PLEventPreviewComponent>,
        event: PLEvent, isModal = true, uuid?: string, displayActionButtonsInPreview = false
    ) {
        this.plEventPreviewComponentRef = null;

        componentRef.instance.event = event;
        componentRef.instance.user = this.user;
        componentRef.instance.isModal = isModal;
        componentRef.instance.caseload = this.caseload;
        componentRef.instance.timezone = this.timezone;
        componentRef.instance.readOnly = this.readonly;
        componentRef.instance.dateState = this.dateState;
        componentRef.instance.billingCodes = this.billingCodes;
        componentRef.instance.displayActionButtonsInPreview = displayActionButtonsInPreview;

        // TODO Add Listeners
        componentRef.instance.action.subscribe((action: any) => {
            const updatedEvent = this.events
                .find(evt => evt.uuid === event.uuid &&
                    evt.event.uuid === event.event.uuid &&
                    evt.original_start === event.original_start);
            if (action.type === 'edit') {
                this.openModal.emit({
                    uuid,
                    isNew: false,
                    event: updatedEvent || event,
                });
            }
            if (action.type === 'delete') {
                this.setBulkEditUnchecked();
                this.delete.emit(event);
            }
            if (action.type === 'document') {
                const appointment = updatedEvent || event;
                if (!isModal) {
                    this.preloadDocumentation(appointment);
                }
                this.document.emit({
                    appointment: updatedEvent || event,
                    isModal: true,
                    readonly: action.value,
                });
            }
            if (isModal) this.clearModals();
            if (action.type === 'close') this.clearModals();
            if (action.type === 'edit_bulk_check_changed') this.setBulkEditButtonVisibility();
        });

        this.plEventPreviewComponentRef = componentRef;
    }

    private getBulkEditSelectItems() {
        return this.listPreviewComponents.filter(
            (comp: ComponentRef<PLEventPreviewComponent>) => comp.instance.isSelected);
    }

    private setBulkEditButtonVisibility() {
        const isAnySelected = this.getBulkEditSelectItems().length > 0;

        const ele = document.querySelector('.fc-bulkUpdate-button');
        (ele as any).style.display = (isAnySelected) ? 'inline-block' : 'none';
    }

    private setBulkEditUnchecked() {
        this.listPreviewComponents.forEach((comp: ComponentRef<PLEventPreviewComponent>) => {
            comp.instance.deselectCheckbox();
        });

        this.setBulkEditButtonVisibility();
    }

    private setSelectAllButtonVisibility() {
        const ele = document.querySelector('.fc-selectAll-button');
        if (!ele) return;

        (ele as any).style.display = (this.view.type === PL_CALENDAR_VIEW.List) ? 'inline-block' : 'none';
    }

    private updateView(notCheck?: boolean) {
        this.clearModals();

        const fullCallendar = this.calendar.getApi();
        const { type: currentViewType, currentStart, currentEnd } = fullCallendar.view;
        const isSameViewType = (currentViewType === this.view.type);
        const isMonthGridView = (currentViewType === 'dayGridMonth');
        const isDateInCurrentTimeframe = moment(this.view.date).isBetween(moment(currentStart), moment(currentEnd), 'day');

        if (!isMonthGridView && isSameViewType && isDateInCurrentTimeframe) {
            fullCallendar.rerenderEvents();
            return;
        }

        let viewDate = this.view.date;
        fullCallendar.scrollToTime('06:00:00');

        if (!notCheck && [PL_CALENDAR_VIEW.Day, PL_CALENDAR_VIEW.Week].includes(this.view.type) && this.lastKnownDate) {
            viewDate = this.lastKnownDate;
        }

        fullCallendar.changeView(this.view.type, viewDate);
    }

    private navigateThroughCalendar(currentStart: string) {
        let newCalendarDate;
        let calendarDateToEmit;

        switch (this.view.type) {
            case PL_CALENDAR_VIEW.Day:
                newCalendarDate = moment(currentStart).add(1, 'days').toDate();
                calendarDateToEmit = moment(newCalendarDate).format('YYYY-MM-DD');
                break;

            case PL_CALENDAR_VIEW.Month:
                newCalendarDate = moment(currentStart).add(1, 'days').toDate();
                calendarDateToEmit = moment(newCalendarDate).format('YYYY-MM-DD');
                break;

            default: // For week and list view
                const weekDay = moment(this.lastKnownDate).format('dddd');
                const weekDayNumber = this.WEEK_DAYS[weekDay.toLowerCase()];

                newCalendarDate = moment(currentStart).add(weekDayNumber + 1, 'days').toDate();
                calendarDateToEmit = moment(newCalendarDate).format('YYYY-MM-DD');
                break;
        }

        return calendarDateToEmit;
    }

    private getPLEventFromEvent(event: any): PLEvent {
        const startStr = moment.utc(event.start).format('YYYY-MM-DD HH:mm:ss');
        const start = moment.tz(startStr, this.timezone);
        const events = this.events.filter(ev => (ev.event.uuid || ev.uuid) === event.id);
        let plEvent = events.length === 1 ? events[0] :
            events.find(ev => start.isSame(ev.start, 'day'));
        if (!plEvent) {
            console.warn(`Event [${event.id}] does not exists`);
            return;
        }
        plEvent = this.helper.expandEvent(plEvent, {
            billingCodes: this.billingCodes,
            caseload: this.caseload,
            locations: this.locations,
        });
        return plEvent;
    }

    private buildEvent(data: PLEvent) {
        const { start, end, clients, locations, signed, event, records, uuid, modified } = data;
        let { billing_code } = data;
        let classes: string[] = [];
        if (this.view.type !== PL_CALENDAR_VIEW.List) {
            classes = [...classes, 'record-billing-code'];
        }
        if (localStorage.getItem('PL_DEBUG_EVENT') && data.uuid) {
            classes = [...classes, 'pl-debug-event'];
        }
        let clientNames = '';
        const namedClients = clients.filter(c => c.first_name && c.last_name);
        if (namedClients.length < clients.length) {
            clientNames = 'Not in caseload';
        }
        clientNames = `${clientNames} ${namedClients
            .map(c => `${c.first_name} ${c.last_name[0]}.`)
            .join(', ')}`;
        const locationNames: string = locations
            .map(l => l.name)
            .join(', ');
        let title = '';
        if (billing_code) {
            if (records && records.length === 1) {
                billing_code = records[0].billing_code;
            }
            const billingInfo = this.billingCodes.find(bc => bc.uuid === billing_code);
            if (billingInfo) {
                const eventFilter = PL_EVENT_FILTERS
                    .find(item => item.backend.includes(billingInfo.event_category.name));
                classes = [...classes, eventFilter.key];
                title = billingInfo.name;
            }
        }
        if (clientNames) {
            title = `${clientNames} - ${title}`;
        }
        if (locationNames) {
            title = `${locationNames} - ${title}`;
        }
        const numClients = clients.length || 1;
        const numRecordsSigned = records.reduce((result, item) => result + (!!item.signed_on ? 1 : 0), 0);

        let durationEditable = false;
        let startEditable = false;

        const isRecurringOK = !data.event.recurrence_frequency || (
            data.event.recurrence_frequency === 'WEEKLY'
        );

        if (isRecurringOK && !signed && numRecordsSigned === 0) {
            durationEditable = true;
            startEditable = true;
        }

        return {
            end, start, title,
            durationEditable,
            startEditable,
            id: event.uuid || uuid,
            className: classes.join(' '),
            data: {
                numRecordsSigned,
                billing_code,
                numClients,
                modified,
                signed,
            },
        };
    }

    private buildBillingIndicator(data: any, element: Element, appointment: PLEvent) {
        const { numRecordsSigned, numClients, signed } = data;
        const parent = element.firstChild;
        const isBlackoutDay = appointment.is_blacked_out || localStorage.getItem('DEBUG_BLACKOUT_DAY');

        const billingIndicatorContainer = this.renderer.createElement('div');
        this.renderer.addClass(billingIndicatorContainer, 'pl-billing-indicator-container');


        // show unsigned count when not signed and not blackout day
        if (!signed && !isBlackoutDay) {
            const unsignedCountText = this.renderer.createText(`${numRecordsSigned}/${numClients || 1}`);
            const divElement: Element = this.renderer.createElement('div');
            this.renderer.addClass(divElement, 'pl-event-billing-indicator');
            this.renderer.addClass(divElement, 'unsigned-count');
            this.renderer.appendChild(divElement, unsignedCountText);
            this.renderer.appendChild(billingIndicatorContainer, divElement);
        }

        if (signed) {
            const divElement: Element = this.renderer.createElement('div');
            this.renderer.addClass(divElement, 'pl-event-billing-indicator');
            this.renderer.addClass(divElement, 'signed');
            if (this.view.unsigned) {
                this.renderer.addClass(element, 'disabled');
            }
            this.renderer.appendChild(billingIndicatorContainer, divElement);
            let htmlContent = `<span class="pl-icon-content">${this.svgService.svgs.check.html}</span>`;
            divElement.innerHTML = htmlContent;
        }
        if (isBlackoutDay) {
            const divElement: Element = this.renderer.createElement('div');
            this.renderer.addClass(divElement, 'pl-event-billing-indicator');
            this.renderer.addClass(divElement, 'blackout-day');
            this.renderer.appendChild(billingIndicatorContainer, divElement);
            let htmlContent = `<span class="pl-icon-content">${this.svgService.svgs['warning-alert-white'].html}</span>`;
            divElement.innerHTML = htmlContent;
        }

        this.renderer.listen(element, 'dblclick', () => {
            this.document.emit({ appointment, isModal: true });
            this.clearModals();
        });

        this.renderer.insertBefore(parent, billingIndicatorContainer, parent.firstChild);
    }

    private list(element: Element, event: PLEvent, data: any) {
        if (!event || !element) return;

        const fcItem = 'fc-list-item';
        const titleElement = element.querySelector(`.${fcItem}-title`);

        if (!titleElement) return;
        if (this.view.unsigned && data.signed) this.renderer.addClass(element, 'disabled');

        // Clear
        this.renderer.removeChild(titleElement, titleElement.firstChild);
        // Create Components
        const componentRef = this.componentFactoryResolver
            .resolveComponentFactory(PLEventPreviewComponent)
            .create(this.injector);
        this.preparePreview(componentRef, event, false, data.uuid, true);
        // Update Component DOM
        componentRef.changeDetectorRef.detectChanges();
        this.listPreviewComponents.push(componentRef);
        const componentHTML = (componentRef.hostView as EmbeddedViewRef<any>)
            .rootNodes[0] as HTMLElement;
        // Append Component
        this.renderer.appendChild(titleElement, componentHTML);
    }

    private destroyListComponents() {
        if (this.listPreviewComponents.length) {
            this.listPreviewComponents
                .forEach(c => c.destroy());
            this.listPreviewComponents = [];
        }
    }

    private translateCalendarTime(time: Date): string {
        const noTZtime = moment.utc(time).format(this.plTimezone.formatDateTimeNoTz);
        const providerTime = moment.tz(noTZtime, this.timezone);
        return providerTime.format(this.plTimezone.formatDateTime);
    }

    private preloadDocumentation(appointment: PLEvent) {
        let user: any = this.user;
        if (this.readonly) {
            user = {
                uuid: this.providerProfile.user.id,
                groups: [],
                xProvider: this.providerProfile,
                isViewOnly: this.readonly,
            };
        }
        this.idaService.entryPoint(user, () => {
            this.idaService.setStandaloneAppointment(appointment);
        });
    }

    private selectDayColumn() {
        if (!this.selectedDate) return;

        const selectClass = 'selected';
        const fullCallendar = this.calendar.getApi();
        const calendarEl = fullCallendar.el;
        const prevSelectedEl = calendarEl.querySelector(`td.fc-day.${selectClass}[data-date]`);
        if (prevSelectedEl) {
            this.renderer.removeClass(prevSelectedEl, selectClass);
        }
        const selectedEl = calendarEl.querySelector(`td.fc-day[data-date="${this.selectedDate}"]`);
        if (selectedEl && !selectedEl.classList.contains('fc-today')) {
            this.renderer.addClass(selectedEl, 'selected');
        }
    }

    /**
     * Calendar built in "replacement" for the `ngAfterViewInit`.
     * Calendar built in "add-on" for the `ngOnDestroy`.
     * 
     * When a view of the calendar is changed we can hear it from here.
     * When a calendar view is destroyed the events have to be rebuild.
     *  -> Therefore a flag for the `areEventsBuilt` is set to false.
     * 
     * @param renderedOrDestroyed - Enum telling whether the view is being `RENDERED` or `DESTROYED`.
     */
    onCalendarSkeletonRender(renderedOrDestroyed: RenderedCalendar) {
        this.isCalendarRendered = (renderedOrDestroyed === RenderedCalendar.Rendered);
        if (!this.isCalendarRendered) this.arePLEventsBuilt = false;
    }

    /**
      * Displays a preview of the event the user is hovering on the calendar.
      * The preview includes the action button for making the preview do something.
      */
    onEventClick(e: any) {
        this.clearTimeoutOfPreviewModal();
        this.displayEventPreviewOnCalendar(e, true);
    }

    onEventTimeUpdated(e: any) {
        const { event, oldEvent } = e;
        const { start, end } = event;
        const plEvent = this.getPLEventFromEvent(oldEvent || event);
        this.helper
            .amendmentCheck(this.dateState, {
                ...plEvent,
                start: this.translateCalendarTime(start),
            }, this.timezone)
            .subscribe((res: any) => {
                if (['yes', 'confirm'].includes(res)) {
                    if (!plEvent) {
                        e.revert();
                        return;
                    }
                    this.editTime.emit({
                        start: this.translateCalendarTime(start),
                        end: this.translateCalendarTime(end),
                        event: plEvent,
                        onCancel: () => {
                            e.revert();
                        },
                    });
                } else {
                    e.revert();
                }
            });
    }

    /**
     * Triggers the necessary for rendering an `event` as a `PL Event`.
     * When a new view is selected the event render is trigerred before the `PL Events` are properly set.
     *  -> Therefore the first condition:
     *   --> Hides any event before the `PL Event` is built.
     *   --> Doesn't allow to call anything else from the function.
     *   --> This allows a clean render withouth flashing colors and flashing events. 
     * 
     * @param e - The event emitted by the calendar.
     */
    onEventRender(e: any) {
        if (!this.isCalendarRendered || !this.arePLEventsBuilt) {
            e.el.className = 'pl-event-visibility-hidden'
            return;
        }

        this.clearModals();

        const { el, event } = e;
        const data = event.extendedProps.data;
        const appointment = this.getPLEventFromEvent(event);

        this.view.type === PL_CALENDAR_VIEW.List
            ? this.list(el, appointment, { ...data, uuid: event.id })
            : this.buildBillingIndicator(data, el, appointment);
    }

    onEventDragStart() {
        this.clearModals();
    }

    /**
     * If the user hovers an event; clear any previous preview and display the new event preview after 1 sec.
     * 
     * Don't display preview when the calendar is on the `list` view or when the preview is displaying the action buttons.
     * `displayActionButtonsInPreview` tells whether the preview is displaying the action buttons.
     */
    onEventMouseEnter(e: any) {
        const inListView = this.view.type === PL_CALENDAR_VIEW.List;
        const buttonsDisplayedInPreview = (
            this.plEventPreviewComponentRef
            && this.plEventPreviewComponentRef.instance
            && this.plEventPreviewComponentRef.instance.displayActionButtonsInPreview
        );

        if (!inListView && !buttonsDisplayedInPreview) this.previewModalOnTimeout(e);
    }

    /**
     * If the user stops hovering the event; clear anything after 500 ms.
     * 
     * Don't clear anything if:
     *   - The scheduler is on the list view 
     *   - The event preview is displaying its action buttons.
     * Clear the timeout preview if user hovers in and out in less than 1 sec.
     *   - This is for not displaying previews when the user hovers in and then moves to a blank area.
     */
    onEventMouseLeave() {
        const inListView = this.view.type === PL_CALENDAR_VIEW.List;
        const buttonsDisplayedInPreview = (this.plEventPreviewComponentRef && this.plEventPreviewComponentRef.instance.displayActionButtonsInPreview);
        const setNewPreviewTimeout = (!this.clearModalsTimeout && this.overlayRef.hasAttached() && !buttonsDisplayedInPreview);

        this.clearTimeoutOfPreviewModal();
        if (!inListView && setNewPreviewTimeout) this.clearModalsOnTimeout();
    }

    onDateTimeSelected(event: any) {
        if (!this.readonly) {
            const { view, startStr, endStr } = event;
            let _start = moment.tz(startStr, this.timezone).utc();
            let _end = moment.tz(endStr, this.timezone).utc();
            const defaultStart = `${_start.format(this.plTimezone.formatDate)} 09:00:00`;
            if (view.type === PL_CALENDAR_VIEW.Month) {
                _start = moment.tz(defaultStart, this.timezone).utc();
                _end = _start.clone().add(30, 'minute');
            }
            const start = `${_start.format(this.plTimezone.formatDateTime)}`;
            const end = `${_end.format(this.plTimezone.formatDateTime)}`;
            this.openEventDialog(start, end);
            this.clearModals();
        }
    }

    private openEventDialog(start: string, end: string) {
        this.helper.amendmentCheck(this.dateState, start, this.timezone).subscribe((res: any) => {
            if (['yes', 'confirm'].includes(res)) {
                this.openModal.emit({
                    end,
                    start,
                    isAmendable: res === 'confirm',
                });
            }
        });
    }

    onViewOrDatesChanged(event: any): void {
        const { view } = event;
        const unsigned = this.view.unsigned;
        const type = PL_CALENDAR_VIEW_CONVERTER_USER[view.type];

        let { currentStart, currentEnd } = view;

        // When the calendar isn't rendered/initialized; set the selected date to the last selected date.
        // If the last selected date ain't defined set the default date (usually the first day of the week, month and so on).
        if (!this.isCalendarRendered && this.defaultDate) {
            let lastSelectedDate = localStorage.getItem('LAST_SELECTED_DATE');
            if (!lastSelectedDate) {
                lastSelectedDate = this.defaultDate.toString();
            }

            this.dateChanged.emit({
                type,
                unsigned,
                selectedDate: lastSelectedDate,
                end: this.plTimezone.toUTC(currentEnd),
                start: this.plTimezone.toUTC(currentStart),
            });
            return;
        }

        let selectedDateToEmit;
        const { activeStart, activeEnd } = view;
        const lastKnownViews = [PL_CALENDAR_VIEW.Day, PL_CALENDAR_VIEW.Week];

        currentEnd = this.plTimezone.toUTC(currentEnd);
        currentStart = this.buildCurrentStartForView(view);

        this.clearModals();
        this.selectDayColumn();
        this.destroyListComponents();

        if (view.type === this.view.type) {
            // When moving through the same calendar view.
            selectedDateToEmit = this.navigateThroughCalendar(currentStart);

            if (lastKnownViews.includes(view.type)) {
                this.view = { ...this.view, date: this.lastKnownDate };
            }
            if ([view.type, this.view.type].includes(PL_CALENDAR_VIEW.List)) {
                this.calendarEvents = [];
                this.view = { ...this.view, type: view.type };
            }
        } else {
            // When moving from one calendar view to another.
            // The `currentEnd` and `currentStart` has to be recalculated.
            if (view.type === 'timeGridWeek' || view.type === 'listWeek') {
                const weekDay = moment(this.lastKnownDate).format('dddd');
                const weekDayNumber = this.WEEK_DAYS[weekDay.toLowerCase()];

                const newEndDate = moment(this.lastKnownDate).add(6 - weekDayNumber, 'days').toDate();
                const newStartDate = moment(this.lastKnownDate).subtract(weekDayNumber, 'days').toDate();

                currentEnd = moment(newEndDate).format('YYYY-MM-DD');
                currentStart = moment(newStartDate).format('YYYY-MM-DD');
            }
        }

        this.setSelectAllButtonVisibility();

        this.dateChanged.emit({
            type,
            unsigned,
            end: currentEnd,
            start: currentStart,
            ...(view.type === PL_CALENDAR_VIEW.Month ? {
                viewStart: this.plTimezone.toUTC(activeStart),
                viewEnd: this.plTimezone.toUTC(activeEnd),
            } : {}),
            selectedDate: selectedDateToEmit,
        });
    }

    onWindowResize() {
        this.resizeAllCalendarEvents();
    }

    /**
     * Displays a modal on the calendar with an event preview inside of it.
     * The display is done only if the view is different than the list view
     * 
     * @param e - The event emmitted
     * @param displayWithActionButtons - Whether or not to display buttons in the preview.
     */
    private displayEventPreviewOnCalendar(e: any, displayWithActionButtons) {
        if (this.view.type === PL_CALENDAR_VIEW.List) return;

        const { event, el } = e;
        const appointment = this.getPLEventFromEvent(event);
        const previewModalAxisX: PreviewModalAxisX = this.getAxisesForThePreviewModal(appointment);

        const positionStrategy = this.overlayPositionBuilder
            .flexibleConnectedTo(new ElementRef(el))
            .withPositions([{
                originX: previewModalAxisX.originX,
                originY: 'top',
                overlayX: previewModalAxisX.overlayX,
                overlayY: 'top',
            }]);

        this.clearModals();

        // For secureity purposes in regards of documenting the right client; the calls are splitted in two.
        // One for the previews displayed on hover and another for the previews displayed on clicked event.
        if (displayWithActionButtons) {
            this.displayEventPreviewWithButtons(positionStrategy, appointment, event.id);
        } else {
            this.displayEventPreviewWithNoButtons(positionStrategy, appointment, event.id);
        }
    }

    /**
     * DO NOT CALL THIS DIRECTLY; CALL IT THROUGH `displayEventPreview()`
     */
    private displayEventPreviewWithNoButtons(positionStrategy, appointment, eventId) {
        this.overlayRef.updatePositionStrategy(positionStrategy);
        const previewPortal = new ComponentPortal(PLEventPreviewComponent);
        const previewRef: ComponentRef<PLEventPreviewComponent> = this.overlayRef.attach(previewPortal);
        this.preparePreview(previewRef, appointment, true, eventId, false);
    }

    /**
     * DO NOT CALL THIS DIRECTLY; CALL IT THROUGH `displayEventPreview()`
     * A clicked event is very likely to be documented; therefore the documentation is preloaded.
     */
    private displayEventPreviewWithButtons(positionStrategy, appointment, eventId) {
        this.preloadDocumentation(appointment);
        this.overlayRef.updatePositionStrategy(positionStrategy);
        const previewPortal = new ComponentPortal(PLEventPreviewComponent);
        const previewRef: ComponentRef<PLEventPreviewComponent> = this.overlayRef.attach(previewPortal);
        this.preparePreview(previewRef, appointment, true, eventId, true);
    }

    /**
    * As of now; specifically used by `onViewOrDatesChanged`
    * Tells the date and time to use as starting point for the calendar view that the user is viewing.
    *
    * Built for handling the scenario when the user moves from `Month` to `Week` or `List` view.
    * The specific scenario will:
    *   * Display the current week to the user when being on `Week/List` view and in the current month.
    *   * Display the first week of the month to the user when being on `Week/List` view and in a month different than the current one.
    *   * Build a new `currentStart` based on the `this.now` data.
    * Any scenario different than the above will use the `view.currentStart` data and return it.
    *
    * Nice to Knows:
    *   `currentStaticMonth` - The current month regardless of the navigation made by the user.
    *   `renderedMovingMonth` - The changing month according to the navigation of the user throught the calendar.
    *   `this.view.type` Tells what the previous view of the calendar was.
    *   `view.type` Tells what the current view of the calendar is.
    *
    * @param view - Object with info from the main calendar
    * @returns A string telling the date and time to use as start time for the calendar
    */
    private buildCurrentStartForView(view: { currentStart: any, title: string, type: string }) {
        const currentStaticMonth = moment(this.now).format('M');
        let renderedMovingMonth = moment(view.title).format('M');
        const comingFromMonthView = this.view.type === PL_CALENDAR_VIEW.Month;
        const isCalendarInWeekOrListView = view.type === PL_CALENDAR_VIEW.Week || view.type === PL_CALENDAR_VIEW.List;

        if (isCalendarInWeekOrListView) {
            const viewTitleSplitted = view.title.split(' – '); // e.g. `Aug 29 – Sep 4, 2021`
            const monthNameWithinViewTitle = viewTitleSplitted[viewTitleSplitted.length - 1];
            renderedMovingMonth = moment(monthNameWithinViewTitle).format('M');
        }

        if (comingFromMonthView && (currentStaticMonth === renderedMovingMonth)) {
            const startWithinCurrentWeek = `${this.now.split(' ')[0]} 00:00:00-00:00`;
            return startWithinCurrentWeek;
        } else {
            return this.plTimezone.toUTC(view.currentStart);
        }
    }

    /**
     * Clears the timeout in charge of clearing any preview event modal.
     */
    private clearTimeoutOfClearModals() {
        if (this.clearModalsTimeout) {
            clearTimeout(this.clearModalsTimeout);
            this.clearModalsTimeout = null;
        }
    }

    /**
     * Clears the timeout in charge of displaying the event preview modal.
     */
    private clearTimeoutOfPreviewModal() {
        if (this.previewModalTimeout) {
            clearTimeout(this.previewModalTimeout);
            this.previewModalTimeout = null;
        }
    }

    /**
     * Clear modals after 500 msec.
     * Allows the user to have a sneak preview when moving from the event to a blank area.
     */
    private clearModalsOnTimeout() {
        this.clearModalsTimeout = setTimeout(() => {
            this.clearModals();
        }, 250);
    }

    /**
     * The preview modal which is the preview event needs two type of X axis.
     * All the previews are to be displayed on the left of the event except Sunday events.
     * Sunday previews have to be displayed in the right.
     */
    private getAxisesForThePreviewModal(appointment: any): PreviewModalAxisX {
        const previewModalAxisX: PreviewModalAxisX = {
            originX: 'start',
            overlayX: 'end',
        }

        if (appointment) {
            const end = moment(appointment.end);
            const start = moment(appointment.start);
            const appointmentDateFormatted = this.plTimeGridSvc.formatRange({ start, end }, 'timeFirst');

            if (appointmentDateFormatted.indexOf('Sun,') > -1) {
                previewModalAxisX.originX = 'end';
                previewModalAxisX.overlayX = 'start';
            }
        }

        return previewModalAxisX;
    }

    /**
     * Displays the preview of the event after 1 sec.
     * If the user moves from one event to another:
     *   - The previous event preview is removed immediately.
     *   - The new event is displayed immediately
     * Otherwise wait for 1 sec to display the event preview
     */
    private previewModalOnTimeout(e: any) {
        
        if (this.clearModalsTimeout) {
            this.clearModals();
            this.displayEventPreviewOnCalendar(e, false);
        } else {
            if (this.clearModalsTimeout) this.clearModals();
            this.previewModalTimeout = setTimeout(() => {
                this.displayEventPreviewOnCalendar(e, false);
            }, 1000);
        }

    }

    /**
     * All calendar events must be more narrow; this function does that.
     * There are several scenarios on how the events are arranged by default.
     * Based on those scenarios the logic in this function was written.
     * 
     * The resizing is only applicable when the user is in the week view.
     * First `for loop` arranges all overlapping events into a single array.
     *   - Therefore a multidimensional array is created.
     * Second `forEach loop` sets the width of each event.
     *   - Inline `right` style is updated for re-setting the event width.
     *   - The 100% of the column width gets divided into the number of non-repeating events (based on z-index).
     *   - From first to last (left to right) event more space is removed from the event width.
     *   - The wider event gets more space removed; the lesser width; the less is removed.
     *   - Last event is prefixed to 3% so that any (all) last event ends up at the same width (`right` style).
     */
    private resizeAllCalendarEvents() {
        if (this.calendarEvents.length > 0 && this.defaultView === PL_CALENDAR_VIEW.Week) {
            setTimeout(() => {
                const calendarEventsReference = this.calendarElementsRef.element.nativeElement.getElementsByClassName('fc-time-grid-event');
                const blocksOfOverlappedEvents = []; // Contains the blocks of events
                let blockWithOverlappedEvents: any[] = []; // Creates the block with events

                // Creates an array with blocks of overlapped events to modify.
                for (let index = 0; index <= calendarEventsReference.length; index++) {
                    const eventReference = calendarEventsReference[index];

                    // First condition is met in the last cycle only.
                    if (index === calendarEventsReference.length && !eventReference) {
                        blocksOfOverlappedEvents.push(blockWithOverlappedEvents);
                        blockWithOverlappedEvents = [];
                        break;
                    } else if (index > 0 && eventReference.style['z-index'] === '1') {
                        blocksOfOverlappedEvents.push(blockWithOverlappedEvents);
                        blockWithOverlappedEvents = [];
                    }

                    blockWithOverlappedEvents.push(eventReference);
                }

                // Modify the events width within the overlapped blocks.
                blocksOfOverlappedEvents.forEach((eventsBlock: any) => {
                    const zetaIndexSet = new Set();

                    eventsBlock.forEach((event: any) => zetaIndexSet.add(event.style['z-index']));

                    let numberOfEvents = zetaIndexSet.size;
                    const evenPercentage = 100 / numberOfEvents;

                    for (let index = 0; index < eventsBlock.length; index++) {
                        let newPercentageWidth: number = 3;
                        const currentEvent = eventsBlock[index];

                        if (
                            numberOfEvents !== 1
                            && eventsBlock[index + 1]
                            && (currentEvent.style['z-index'] !== eventsBlock[index + 1].style['z-index'])
                        ) {
                            const eventStyleRight = parseFloat(currentEvent.style.right);
                            const widthToIncrement = (numberOfEvents * 100) / evenPercentage;

                            numberOfEvents--;
                            newPercentageWidth = eventStyleRight + widthToIncrement;
                        }

                        currentEvent.style.right = `${newPercentageWidth}%`;
                    }
                });
            }, 10);
        }
    }
}