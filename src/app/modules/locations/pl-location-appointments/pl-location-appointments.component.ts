import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { first } from 'rxjs/operators'

import { PLLocationService } from '../pl-location.service';

import { PLUtilService, PLComponentStateInterface } from '@common/services/';

import { PLGraphQLService, PLLodashService, PLTimezoneService, PLHttpService,
    PLClientStudentDisplayService, PLMayService } from '@root/index';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

import { CLINICAL_PRODUCT_TYPE } from '../../../common/constants/index';

const locationAppointmentsQuery = require('../queries/location-appointments.graphql');
const providersQuery = require('../queries/provider-profiles.graphql');
const clientsQuery = require('../queries/clients.graphql');

@Component({
    selector: 'pl-location-appointments',
    templateUrl: './pl-location-appointments.component.html',
    styleUrls: ['./pl-location-appointments.component.less'],
})
export class PLLocationAppointmentsComponent {

    CLINICAL_PRODUCT = CLINICAL_PRODUCT_TYPE;

    _state: PLComponentStateInterface;
    componentName: string = 'PLLocationAppointmentsComponent';
    currentUser: User;

    location: any = {};
    mayView: boolean = true;
    mayPickDate: boolean = false;

    groupedAppointments: any[] = [];
    totalAppointments: number = 0;
    weekStart: string = '';
    weekEnd: string = '';
    timezone: string = '';
    start: string = '';
    end: string = '';
    dateOverride: boolean = false;
    currentYear = moment().year().toString();
    startPicked: string = moment().format('YYYY-MM-DD');

    filters: any = {
        weekDays: [],
        providerIds: [],
        clientIds: [],
        billingCodes: [],
    };
    readonly weekDaysOpts: any[] = [
        // { value: 0, label: 'Sunday', },
        { value: 1, label: 'Monday', },
        { value: 2, label: 'Tuesday', },
        { value: 3, label: 'Wednesday', },
        { value: 4, label: 'Thursday', },
        { value: 5, label: 'Friday', },
        // { value: 6, label: 'Saturday', },
    ];
    providersOpts: any[] = [];
    clientsOpts: any[] = [];
    billingCodesOpts: any[] = [];
    clientFilterLabel: string = '';

    // ? cf_slpa_cota_sup_indirect, cf_slpa_cota_sup_direct, supervision
    // No:
    // 'collab_school_staff',
    // 'consultation',
    // 'documentation_and_planning',
    // 'service_coord_billable',
    // 'service_coord_not_billable',
    // 'supervisionDirect',
    // 'supervisionIndirect',
    // 'cancelled_insufficient_notice', (inactive)
    billingCodesList: string[] = [
        'canceled_24_notice',        // "Student Absence - With 24 Hours Notice"
        'canceled_by_provider',        // "Cancelled - By Provider"
        'canceled_tech_issue',        // "Cancelled - Tech Issue"
        'student_absence_no_notice',        // "Student Absence - No Notice"
        'unplanned_student_absence',        // "Student Absence - Less Than 24 Hours Notice"
        'canceled_holiday',        // "Cancelled - School Closure With 24 Hours Notice"
        'unplanned_school_closure',        // "Cancelled - School Closure Less Than 24 Hours Notice"
        'direct_makeup',        // "Direct - Makeup"
        'direct_services',        // "Direct Services"
        'evaluation',        // "Evaluation"
        'iep_meeting',        // "IEP Meeting"
        this.CLINICAL_PRODUCT.CODE.BMH_GROUP, // BMH = Bigs and TGs
        'cf_slpa_cota_sup_direct', // Supervision Direct
    ];

    constructor(
        public util: PLUtilService,
        private plLocation: PLLocationService,
        private plGraphQL: PLGraphQLService,
        private store: Store<AppStore>,
        private plLodash: PLLodashService,
        private plTimezone: PLTimezoneService,
        private plHttp: PLHttpService,
        private plMay: PLMayService)
    {}

    ngOnInit() {
        this._state = this.util.initComponent({
            name: this.componentName,
            params: {
                flags: {
                    //COMPONENT_INIT: 1,
                    //SHOW_DIVS: 1,
                    //SHOW_TIMEZONE: 1,
                },
            },
            fn: (state: PLComponentStateInterface, done) => {
                state.asyncCount = 4;
                this.currentUser = state.currentUser;
                this.clientFilterLabel = PLClientStudentDisplayService.get(this.currentUser, { capitalize: true });
                this.mayPickDate = (
                    this.plMay.isAdminType(this.currentUser) ||
                    this.plMay.isCustomerAdmin(this.currentUser) ||
                    this.plMay.isCustomerBasic(this.currentUser)
                );
                this.plLocation.getFromRoute().pipe(first()).subscribe((res: any) => {
                    this.location = res.location;
                    this.location.timezone = this.util.flagLocalStorage('SET_TIMEZONE') || this.location.timezone;
                    if (this.location.locationType === 'VIRTUAL') {
                        this.mayView = false;
                        state.asyncCount = 1;
                    }
                    if (this.mayView) {
                        this.getWeekInfo();
                        this.getAppointments(done);
                        this.getProviders(done);
                        this.getClients(done);
                    }
                    this.getBillingCodes(done);
                });
            }
        });
    }

    ngOnDestroy() {
        this.util.destroyComponent(this._state);
    }

    getBillingCodes(done: Function) {
        // Currently no graphQL version.
        return this.plHttp.get('billingCodes', {}).subscribe((res: any) => {
            // Backend does not seem to have an active filter so we need to filter here.
            let billingCodes = res.results.filter((code: any) => {
                return code.is_active && this.billingCodesList.includes(code.code);
            });
            billingCodes = billingCodes.map((code: any) => {
                return { value: code.code, label: code.name };
            });
            this.billingCodesOpts = this.plLodash.sort2d(billingCodes, 'label');
            done && done();
        });
    }

    getClients(done: Function) {
        if (this.location.id) {
            const vars: any = {
                locationId: this.location.id,
            };
            this.plGraphQL.query(clientsQuery, vars, {}).pipe(first()).subscribe((res: any) => {
                const clientOpts = res.clients.map((client: any) => {
                    return { value: client.id, label: `${client.firstName} ${client.lastName}` };
                });
                this.clientsOpts = this.plLodash.sort2d(clientOpts, 'label');
                done && done();
            });
        }
    }

    getProviders(done: Function) {
        const vars: any = {
            isActive: true,
            user_IsActive: true,
            locationId: this.location.id,
        };
        this.plGraphQL.query(providersQuery, vars, {}).pipe(first()).subscribe((res: any) => {
            const providerOpts = res.providerProfiles.map((provider: any) => {
                return { value: provider.user.id, label: `${provider.user.firstName} ${provider.user.lastName}` };
            });
            this.providersOpts = this.plLodash.sort2d(providerOpts, 'label');
            done && done();
        });
    }

    changeDate() {
        this.getWeekDates();
        this.getAppointments();
    }

    getWeekInfo() {
        this.timezone = this.location.timezone || this.plTimezone.getUserZone(this.currentUser);
        this.getWeekDates();
    }

    getWeekDates() {
        const startDateOverride = this.util.flagLocalStorage('START_DATE');
        startDateOverride && (this.dateOverride = true);
        const now = moment.tz(startDateOverride || this.startPicked, this.timezone);
        const nowDay: number = parseInt(now.format('d'), 10);
        // Monday is day 1.
        const daysFromMonday = 1 - nowDay;
        const mondayDay = (daysFromMonday >= 0) ? now.clone().add(daysFromMonday, 'days') : now.clone().subtract((daysFromMonday * -1), 'days');
        this.weekStart = mondayDay.format('MMMM Do, YYYY');
        const fridayDay = mondayDay.clone().add(4, 'days');
        this.weekEnd = fridayDay.format('MMMM Do, YYYY');
        const start = mondayDay.clone().subtract(1, 'days');
        // Set to 0 hours and minutes.
        this.start = `${start.format('YYYY-MM-DD')}T00:00:00`;
        this.end = `${start.clone().add(7, 'days').format('YYYY-MM-DD')}T00:00:00`;
    }

    changeFilters() {
        // Not getting updated values immediately so need timeout.
        setTimeout(() => {
            this.getAppointments();
        }, 1);
    }

    getAppointments(done?: Function) {
        if (this.location.id) {
            const vars: any = {
                clientLocationId: this.location.id,
                billingCodeCodeWithRecords_In: this.billingCodesList.join(','),
                start: this.start,
                end: this.end,
                timezone: this.timezone,
            };

            this.plGraphQL.query(locationAppointmentsQuery, vars, {}).pipe(first()).subscribe((res: any) => {
                this.filterAppointments(res.appointments);
                done && done();
            });
        }
    }

    filterAppointments(resAppointments: any) {
        // Filter by filters (not currently available on backend).
        // Do `and` instead of `or` to match backend - must match ALL filters to show up.
        const appointments: any[] = resAppointments.filter((appointment: any) => {
            let keepIt: boolean = true;
            let atLeastOne;
            // Now we want to NOT show any appointments if the appointment billing code is not
            // in the approved list (even if a record billing code IS approved). This is not
            // a filter per se since we want to remove the appointment regardless of if UI filters
            // are used or not.
            if (keepIt) {
                // Show if at least one billing code matches.
                atLeastOne = false;
                if (this.billingCodesList.includes(appointment.billingCode.code)) {
                    atLeastOne = true;
                }
                // Only set keepIt to false, never true, so do not do a simple assignment to atLeastOne.
                if (!atLeastOne) {
                    keepIt = false;
                }
            }

            // Provider and 1 or more clients may be null if do not have permission.
            if (keepIt && this.filters.providerIds.length > 0 && (!appointment.provider || !this.filters.providerIds.includes(appointment.provider.id))) {
                keepIt = false
            }
            if (keepIt && this.filters.clientIds.length > 0) {
                atLeastOne = false;
                appointment.clients.forEach((client: any) => {
                    if (client && this.filters.clientIds.includes(client.id)) {
                        atLeastOne = true;
                    }
                });
                // Only set keepIt to false, never true, so do not do a simple assignment to atLeastOne.
                if (!atLeastOne) {
                    keepIt = false;
                }
            }
            if (keepIt && this.filters.billingCodes.length > 0) {
                // Show if at least one billing code matches.
                atLeastOne = false;
                if (this.filters.billingCodes.includes(appointment.billingCode.code)) {
                    atLeastOne = true;
                }
                // Records
                if (!atLeastOne) {
                    atLeastOne = appointment.records.some((record: any) => {
                        return this.filters.billingCodes.includes(record.billingCode.code)
                    });
                }
                // Only set keepIt to false, never true, so do not do a simple assignment to atLeastOne.
                if (!atLeastOne) {
                    keepIt = false;
                }
            }
            let day = parseInt(moment(appointment.start, 'YYYY-MM-DDTHH:mm:ss').format('d'), 10);
            if (keepIt && this.filters.weekDays.length && !this.filters.weekDays.includes(day)) {
                keepIt = false;
            }
            return keepIt;
        });
        this.groupedAppointments = this.formatAppointments(this.plLodash.sort2d(appointments, 'start'))
    }

    // Group appointments by day.
    formatAppointments(appointments: any[]) {
        // Angular can't iterate through objects, so we have to break into arrays by day.
        // We'll use moment.js built in `d` format which gives us 0 to 6.
        const groupedAppointments: any[] = [
            { appointments: [] },
            { appointments: [] },
            { appointments: [] },
            { appointments: [] },
            { appointments: [] },
            { appointments: [] },
            { appointments: [] },
        ];
        let totalAppointments = 0;
        const clientStudentText = PLClientStudentDisplayService.get(this.currentUser);
        appointments.forEach((appointment: any) => {
            let start = moment(appointment.start, 'YYYY-MM-DDTHH:mm:ss');
            let end = moment(appointment.end, 'YYYY-MM-DDTHH:mm:ss');
            let day = parseInt(start.format('d'), 10);
            let clientsLength = appointment.clients.length;
            let clients = appointment.clients;
            let totalClients = appointment.clientsTotalCount;
            // Not showing Sat or Sun at all.
            if (day !== 0 && day !== 6) {
                appointment.xTimeRange = `${start.format('h:mma')} - ${end.format('h:mma')}`;
                appointment.xDuration = `${end.diff(start, 'minutes')} min`;
                appointment.xMissingClientsText = '';
                let countMissing = totalClients - clientsLength;
                if (countMissing > 0) {
                    if (clientsLength == 0) {
                        appointment.xMissingClientsText = (countMissing == 1) ? `1 ${clientStudentText}` :
                            `${countMissing} ${clientStudentText}s`;
                    } else {
                        appointment.xMissingClientsText = (countMissing == 1) ? `1 other ${clientStudentText}` :
                            `${countMissing} other ${clientStudentText}s`;
                    }
                }
                const retBillingCodesClients = this.getAppointmentBillingCodesClients(appointment);
                appointment.xBillingCodesClients = retBillingCodesClients.billingCodesClients;
                appointment.classes = retBillingCodesClients.allCancelled ? 'cancelled cancelled-red' : '';
                groupedAppointments[day].visible = true;
                groupedAppointments[day].title = start.format('dddd, MMMM Do');
                groupedAppointments[day].appointments.push(appointment);
                totalAppointments++;
            }
        });
        this.totalAppointments = totalAppointments;
        return groupedAppointments;
    }

    // Use record billing codes if we have them. Match the billing code to the client
    // and preserve the order so they are on the same line.
    // If no record billing code, use the appointment billing code for all clients.
    // If all billing codes are the same, just show it once (with the first client).
    getAppointmentBillingCodesClients(appointment: any) {
        const cancelledCodes = [
            'canceled_24_notice',        // "Student Absence - With 24 Hours Notice"
            'canceled_by_provider',        // "Cancelled - By Provider"
            'canceled_tech_issue',        // "Cancelled - Tech Issue"
            'student_absence_no_notice',        // "Student Absence - No Notice"
            'unplanned_student_absence',        // "Student Absence - Less Than 24 Hours Notice"
            'canceled_holiday',        // "Cancelled - School Closure With 24 Hours Notice"
            'unplanned_school_closure',        // "Cancelled - School Closure Less Than 24 Hours Notice"
        ];

        let billingCodesClients: any[] = []
        // We go through by clients first for ordering (matching), but
        // there could be more records (e.g. location appointments), so
        // track which ones we have already used.
        const recordIdsUsed: string[] = []
        let allSameCode = true;
        let firstCodeId: string = '';
        let allCancelled = true;
        let cancelled;
        appointment.clients.forEach((client: any) => {
            // Want to create an item for each client no matter what.
            let clientItem: any = {
                client: client,
                billingCode: null,
            };
            appointment.records.forEach((record: any) => {
                if (record.client && record.client.id === client.id) {
                    cancelled = cancelledCodes.includes(record.billingCode.code);
                    if (!cancelled) {
                        allCancelled = false;
                    }
                    clientItem.billingCode = record.billingCode;
                    clientItem.classes = cancelled ? 'cancelled' : '';
                    recordIdsUsed.push(record.id);

                    if (!firstCodeId) {
                        firstCodeId = record.billingCode.id;
                    } else if (record.billingCode.id !== firstCodeId) {
                        allSameCode = false;
                    }
                }
            });
            // Want to give a billing code to each client no matter what.
            // Otherwise adding one record would result in no other clients
            // showing a (potentially different) billing code. This also
            // addresses vertical alignment issues (ensures client and billing
            // columns line up).
            if (!clientItem.billingCode) {
                cancelled = cancelledCodes.includes(appointment.billingCode.code)
                if (!cancelled) {
                    allCancelled = false;
                }
                clientItem.billingCode = appointment.billingCode;
                clientItem.classes = cancelled ? 'cancelled' : '';

                if (!firstCodeId) {
                    firstCodeId = appointment.billingCode.id;
                } else if (appointment.billingCode.id !== firstCodeId) {
                    allSameCode = false;
                }
            }
            billingCodesClients.push(clientItem);
        });

        // Removing since the current UI only focuses on client appointments.
        // Go through any remaining billing codes. These will just be added to the end.
        // appointment.records.forEach((record: any) => {
        //     if (!recordIdsUsed.includes(record.id)) {
        //         billingCodes.push(record.billingCode);
        //     }
        // });

        // Sort by client name. Must do this BEFORE setting first item in case
        // of all same code.
        billingCodesClients = this.plLodash.sort2d(billingCodesClients, 'client.firstName');

        // If all same code, just show it once, in first item.
        if (allSameCode) {
            for (let cc = 0; cc < billingCodesClients.length; cc++) {
                if (cc > 0) {
                    billingCodesClients[cc].billingCode = {}
                }
            }
        }

        // // If no billing code, use appointment code (set it to the first (0 index) item).
        // if (recordIdsUsed.length < 1 && billingCodesClients.length) {
        //     cancelled = cancelledCodes.includes(appointment.billingCode.code)
        //     if (!cancelled) {
        //         allCancelled = false;
        //     }
        //     billingCodesClients[0].billingCode = appointment.billingCode;
        //     billingCodesClients[0].classes = cancelled ? 'cancelled' : '';
        // }

        return {
            allCancelled: (allCancelled && billingCodesClients.length) ? true : false,
            billingCodesClients,
        };
    }

    toggleDayVisible(groupedAppointment: any) {
        groupedAppointment.visible = !groupedAppointment.visible;
    }

    print() {
        window.print();
    }

    clearAllFilters() {
        this.filters = {
            weekDays: [],
            providerIds: [],
            clientIds: [],
            billingCodes: [],
        };
        this.changeFilters();
    }
};
