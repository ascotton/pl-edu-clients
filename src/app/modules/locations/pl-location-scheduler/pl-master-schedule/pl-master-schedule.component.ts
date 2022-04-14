import {
    Input,
    Output,
    Component,
    ComponentRef,
    EventEmitter,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    SimpleChanges,
    OnChanges,
} from '@angular/core';
// Services
import { PLTimeGridService } from '@common/services';
import { PLModalService } from '@root/index';
import { PLLocationSchedulerService } from '../../services';
// Modals
import { PLStudentScheduleEditorComponent } from '../pl-student-schedule-editor/pl-student-schedule-editor.component';
// Models
import {
    PLProviderSession,
    PLLocation,
} from '../../models';
import {
    PL_INTERVAL,
    PLReferral,
    PLAvailability,
    PLTimeGridBlock,
    PLDayTimeFrame,
    PLTimeGridBlockConfiguration,
    PLTimeFrame,
    PLTimeGridBlockSize,
    PLTimeGridColumnActions,
    PLTimeGridBlockEvent,
    PLTimeGridBlockAction,
    PLProviderProfile,
    PLLocationAvailability,
    Option,
    PLDrawMode,
} from '@common/interfaces';
import { PL_REFERRAL_STATE } from '@common/enums';

enum BlockType {
    Provider = 1,
    Location = 2,
    OpenTherapyTime = 101,
    Computer = 103,
    Appointment = 104,
    Working = 105,
}

@Component({
    selector: 'pl-master-schedule',
    templateUrl: './pl-master-schedule.component.html',
    styleUrls: ['./pl-master-schedule.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLMasterScheduleComponent implements OnChanges {

    private readonly openTimeConfiguration: PLTimeGridBlockConfiguration = {
        priority: BlockType.OpenTherapyTime,
        className: 'open-time',
        viewTime: true,
        drawable: true,
        clickable: true,
    };

    private readonly providerConfiguration: PLTimeGridBlockConfiguration = {
        priority: BlockType.Provider,
        className: 'provider-availability',
        viewTime: false,
    };

    private readonly locationConfiguration: PLTimeGridBlockConfiguration = {
        priority: BlockType.Location,
        className: 'location-availability',
        viewTime: false,
    };

    // Drawing Options
    mode: PLDrawMode = PLDrawMode.None;
    blockDuration = 0;
    allWeeks = true;

    blocks: PLTimeGridBlock[] = [];

    @Input() providerView = false;
    @Input() selectionAllow = false;
    @Input() timezone: string;
    @Input() providerOpts: Option[];
    @Input() location: PLLocation;
    @Input() locationsAssigned: string[];
    @Input() referrals: PLReferral[];
    @Input() selectedReferrals: PLReferral[];
    @Input() allProviders: PLProviderProfile[];
    @Input() providers: PLProviderProfile[];
    @Input() locationCalendar: PLProviderSession[];
    @Input() locationAvailability: PLLocationAvailability[] = [];
    @Input() providersAvailability: { [key: string]: PLAvailability[] } = {};

    @Output() readonly selectionAllowChange: EventEmitter<boolean> = new EventEmitter();

    constructor(
        private timeGridService: PLTimeGridService,
        private schedulerService: PLLocationSchedulerService,
        private plModal: PLModalService,
        private cdr: ChangeDetectorRef) {
        this.timeGridService.groupWidth = 210;
    }

    getTimezoneHTML() {
        return this.timezone
            ? this.timezone.replace('/', '/<br />').replace('_', ' ')
            : '/';
    }

    ngOnChanges(changes: SimpleChanges) {
        const {
            providers,
            providersAvailability,
            locationAvailability,
            locationCalendar,
            selectedReferrals,
            selectionAllow,
        } = changes;
        const updateLocationAvailability = locationAvailability && this.locationAvailability;
        const updateProviderAvailability = (providersAvailability || selectedReferrals) &&
            Object.keys(this.providersAvailability || {}).length > 0;
        if (selectedReferrals || selectionAllow) {
            let mode = PLDrawMode.None;
            if (this.selectedReferrals.length > 0) {
                mode = PLDrawMode.Blocks;
            }
            if (this.selectionAllow) {
                mode = PLDrawMode.Any;
            }
            this.mode = mode;
            this.setBlockDuration();
        }
        if (providers) {
            this.timeGridService.numberOfGroups = this.providers.length || 1;
            if (!this.providers.length) {
                // To remove provider availability
                this.blocks = [
                    ...this.blocks.filter(b => ![
                        BlockType.OpenTherapyTime,
                        BlockType.Provider,
                    ].includes(b.configuration.priority)),
                ];
            }
        }
        if (updateLocationAvailability) {
            const { timezone } = this.location;
            this.blocks = [
                ...this.blocks.filter(b => b.configuration.priority !== BlockType.Location),
                ...this.createAvailabilityBlocks(this.locationAvailability, timezone, this.locationConfiguration),
            ];
        }
        if (updateProviderAvailability) {
            this.blocks = [
                ...this.blocks.filter(b => ![
                    BlockType.OpenTherapyTime,
                    BlockType.Provider,
                ].includes(b.configuration.priority)),
                ...this.buildProviderBlocks(),
            ];
        }
        if (providers || locationCalendar || updateProviderAvailability || updateLocationAvailability) {
            this.setCalendar();
        }
    }

    private setCalendar() {
        let newBlocks: PLTimeGridBlock[] = [];
        if (this.locationCalendar
            && this.providers.length
            && this.providers.map(p => !!this.providersAvailability[p.user.id]).reduce((p, c) => p && c, true)) {
            newBlocks = [
                ...this.buildAppointmentBlocks(),
                ...this.buildNotAvailableBlocks(),
            ];
        }
        this.blocks = [
            ...this.blocks.filter(b => ![
                BlockType.Appointment,
                BlockType.Computer,
            ].includes(b.configuration.priority)),
            ...newBlocks,
        ];
    }

    private createAvailabilityBlocks(
        availabilityBlocks: PLAvailability[],
        timezone: string,
        configuration: PLTimeGridBlockConfiguration): PLTimeGridBlock[] {
        return availabilityBlocks
            .map(({ uuid, day, start, end }) =>
                this.timeGridService.buildBlock(uuid, '', day, { start, end }, configuration, timezone));
    }

    private buildProviderBlocks(): PLTimeGridBlock[] {
        const { timezone: locationTimezone } = this.location;
        let openTime: PLTimeGridBlock[] = [];
        let providersAvailability: PLTimeGridBlock[] = [];
        const selectedReferralsProviderIds = [...new Set(this.selectedReferrals.map(r => r.provider.id))];
        this.providers.forEach(({ timezone: providerTimezone, user }, idx) => {
            const size = this.timeGridService.getBlockSize(idx);
            const providerAvailability = this.providersAvailability[user.id] || [];

            //#region Availability Blocks
            providersAvailability = [
                ...providersAvailability,
                ...this.createAvailabilityBlocks(
                    providerAvailability,
                    providerTimezone,
                    { ...this.providerConfiguration, size }),
            ];
            //#endregion
            //#region Open Therapy Time Blocks
            this.timeGridService.days.forEach(({ key: day }) => {
                const dayProviderAvailability = providerAvailability.filter(pa => pa.day === day);
                const dayLocationAvailability = this.locationAvailability.filter(la => la.day === day);

                dayLocationAvailability.forEach((la: PLLocationAvailability) => {
                    const locationSlot = this.timeGridService.timeObj(la, locationTimezone);
                    dayProviderAvailability.forEach((pa: PLAvailability) => {
                        const providerSlot = this.timeGridService.timeObj(pa, providerTimezone);
                        const { overlap, slot } = this.timeGridService.overlap(locationSlot, providerSlot);
                        if (overlap) {
                            let { className } = this.openTimeConfiguration;
                            if (selectedReferralsProviderIds.length &&
                                !selectedReferralsProviderIds.includes(user.id)) {
                                className = `${className} not-allow`;
                            }
                            const tooltip = `Available Stations: ${la.availableStations}`;
                            // tslint:disable-next-line: max-line-length
                            const _block = this.timeGridService.buildBlock(
                                `ot__${user.id}__${la.uuid}__${pa.uuid}`,
                                tooltip, day,
                                this.timeGridService.timeBlock(slot),
                                { ...this.openTimeConfiguration,
                                    size,
                                    className,
                                    tooltip,
                                },
                                this.timezone);
                            openTime = [...openTime, _block];
                        }
                    });
                });
            });
            //#endregion
        });
        return [...openTime, ...providersAvailability];
    }

    private buildNotAvailableBlocks(): PLTimeGridBlock[]  {
        let blocks: PLTimeGridBlock[] = [];
        if (this.allProviders) {
            this.locationCalendar
                .filter(({ referralIds, locationId }) => referralIds.length > 0 && locationId === this.location.id)
                .forEach(({ day, start, end, week }) => {
                    const time = this.timeGridService.timeObj({ start, end }, this.location.timezone);
                    if (this.getAvailableStations(day, time, week, false) <= 0) {
                        // Clone for the other providers
                        blocks = [
                            ...blocks,
                            ...this.allProviders
                                .map(({ user }) => this.buildAppointmentBlock({
                                    day,
                                    week,
                                    start,
                                    end,
                                    providerId: user.id,
                                    referralIds: [],
                                    locationId: this.location.id,
                                    id: `NA-${user.id}-${day}${week}-${start}-${end}`,
                                }, '', false, 'computer-not-available', BlockType.Computer, this.location.timezone)),
                        ];
                    }
                });
        }
        return blocks;
    }

    private buildAppointmentBlocks(): PLTimeGridBlock[] {
        let calendarBlocks: PLTimeGridBlock[] = [];
        this.providers.forEach((provider) => {
            calendarBlocks = [
                ...calendarBlocks,
                ...this.locationCalendar
                    .filter(a => a.providerId === provider.user.id)
                    .map((appointment) => {
                        let className = 'scheduled-other-school';
                        let editable = false;
                        let title = '';
                        let tooltip = '';
                        const { locationId, referrals, referralIds, location } = appointment;
                        const timezone = location ? location.timezone : this.location.timezone;
                        if (locationId === this.location.id) {
                            className = 'reserved';
                            editable = true;
                            if (referralIds.length > 0) {
                                const useFullName =
                                    (!appointment.week && appointment.referrals && appointment.referrals.length <= 1);
                                const proposed: boolean = this.providerView
                                    && referrals.find(r => r.state === PL_REFERRAL_STATE.Proposed);
                                editable = !proposed;
                                tooltip = proposed ? 'TBD' : (referrals || [])
                                    .map(({ client }) => `${client.firstName} ${client.lastName}`).join('\n');
                                title = tooltip;
                                if (!useFullName && !proposed) {
                                    title = (referrals || []).map(({ client }) =>
                                        `${client.firstName[0]}${client.lastName[0]}`).join(', ');
                                }
                                className = 'scheduled';
                            }
                        } else if (this.locationsAssigned.includes(locationId)) {
                            const { organizationName, name: locationName } = appointment.location;
                            title = `${locationName} - ${organizationName}`;
                        }
                        return this.buildAppointmentBlock(
                            appointment,
                            title,
                            editable,
                            className,
                            BlockType.Appointment,
                            timezone,
                            tooltip);
                    }),
            ];
        });
        return calendarBlocks;
    }

    private buildAppointmentBlock(
        appointment: PLProviderSession,
        title: string,
        clickable = false,
        className: string,
        priority: BlockType,
        timezone: string,
        tooltip?: string): PLTimeGridBlock {
        const { id, start, end, providerId, week, day } = appointment;
        const providerIndex = this.providers.findIndex(p => p.user.id === providerId);
        let size = this.timeGridService.getBlockSize(providerIndex);
        if (week) {
            const nWeeks = 4;
            const weekWidth = size.width / nWeeks;
            const weekX = size.x + (weekWidth * (week - 1));
            size = { x: weekX, width: weekWidth };
        }
        return this.timeGridService.buildBlock(
            id,
            title,
            day, { start, end },
            { size, clickable, className, priority, tooltip, viewTime: priority === BlockType.Appointment },
            timezone);
    }

    private availableStations(day: string, time: PLTimeFrame, provider?: PLProviderProfile, warn = true) {
        return this.schedulerService.getAvailableStations(day, time,
            {
                availability: this.locationAvailability,
                timezone: this.location.timezone,
            },
            provider ?
                {
                    availability: this.providersAvailability[provider.user.id],
                    timezone: provider.timezone,
                } : null, warn);
    }

    private getAvailableStations(
        day: string,
        time: PLTimeFrame,
        week: number,
        warn = true,
        provider?: PLProviderProfile,
        apptId?: string): number {
        const stations = this.availableStations(day, time, provider, warn);
        // TODO: Check where they overlap
        const appointments = this.locationCalendar
            .filter((a) => {
                return a.id !== apptId
                    && a.day === day
                    && (!week || !a.week || a.week === week)
                    && this.timeGridService.overlap(
                        this.timeGridService.timeObj(a, a.location ?
                            a.location.timezone : this.location.timezone), time).overlap;
            });
        let nAppts = appointments.filter(({ hasReferrals }) => hasReferrals).length;
        // If is the 4 weeks
        if (!week) {
            // Get min appoinments per week
            const _appts = Array.from(Array(4), (_, i) =>
                appointments.filter(({ week: w }) => !w || w === (i + 1)).length)
                .filter(n => n > 0);
            nAppts = _appts.length > 0 ? Math.min(..._appts) : 0;
        }
        // If provider has an appointmet at same time should not allow
        if (provider && appointments.filter(a => a.providerId === provider.user.id).length) {
            if (warn) {
                this.schedulerService.toastError(this.schedulerService.toastTitles.ReserveError,
                    'Provider has been already scheduled during this time');
            }
            return 0;
        }
        const result = stations - nAppts;
        if (warn && result <= 0) {
            this.schedulerService.toastError(this.schedulerService.toastTitles.ReserveError, 'There are no computers available');
        }
        return result;
    }

    toggleTZ() {
        this.timezone = this.location.timezone === this.timezone ?
            this.providers[0].timezone :
            this.location.timezone;
        this.timeGridService.timezone = this.timezone;
    }

    //#region Time Drawing Handlers
    private openSessionEditor(provider: PLProviderProfile, appointment: PLProviderSession, isNew = true) {
        this.plModal.create(PLStudentScheduleEditorComponent, {
            isNew,
            provider,
            appointment,
            location: this.location,
            timezone: this.timezone,
            availabilityCheck: (day: any, time: any, week: any) =>
                this.getAvailableStations(day, time, week, false, provider),
        }).subscribe((dialogRef: ComponentRef<PLStudentScheduleEditorComponent>) => dialogRef.onDestroy(() => {
            // In order to turn "off" the reserve block
            this.selectionAllowChange.emit(false);
            this.cdr.detectChanges();
        }));
    }

    setBlockDuration() {
        let allWeeks = true;
        let duration = 0;
        if (this.selectedReferrals.length > 0) {
            const rIntervals: PL_INTERVAL[] = [];
            const rDuration: number[] = [];
            this.selectedReferrals.forEach(({ interval, duration: d }) => {
                rDuration.push(d);
                if (!rIntervals.includes(interval)) {
                    rIntervals.push(interval);
                }
            });
            duration = Math.min(...rDuration);
            allWeeks = rIntervals.length === 1 && rIntervals.includes(PL_INTERVAL.Week);
        }
        this.blockDuration = duration;
        this.allWeeks = allWeeks;
    }

    manageBlockAdded(event: {
        eventName: string;
        dayTime: PLDayTimeFrame;
        group?: number;
        week?: number;
    }) {
        const { eventName, dayTime, group, week } = event;
        const { day, time } = dayTime;
        if (this.mode !== PLDrawMode.None && eventName === PLTimeGridColumnActions.added) {
            const provider = this.providers[group];
            const appointment = {
                day,
                week,
                id: '',
                locationId: this.location.id,
                providerId: provider.user.id,
                referrals: this.selectedReferrals,
                referralIds: this.selectedReferrals.map(r => r.id),
                ...this.timeGridService.timeBlock(time),
            };
            if (this.selectedReferrals.length > 0 && this.getAvailableStations(day, time, week, true, provider) <= 0) {
                return;
            }
            this.openSessionEditor(provider, appointment);
        }
    }

    blockReaction(event: PLTimeGridBlockEvent) {
        const { action, uuid } = event;
        if (action === PLTimeGridBlockAction.click) {
            // Open Editor
            const appointment = this.locationCalendar.find(a => a.id === uuid);
            const provider = this.allProviders.find(p => p.user.id === appointment.providerId);
            this.openSessionEditor(provider, appointment, false);
            return;
        }
    }
    //#endregion
}
