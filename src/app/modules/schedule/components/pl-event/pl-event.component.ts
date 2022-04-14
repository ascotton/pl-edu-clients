import * as moment from 'moment';
import { Component, OnInit, Input, Inject, ChangeDetectionStrategy, HostListener } from '@angular/core';
// RxJs
import { combineLatest, Subject } from 'rxjs';
import { map, tap, filter, take, takeUntil, first, shareReplay } from 'rxjs/operators';
// Ng Material
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
// Models
import { Option, PLBillingCode } from '@common/interfaces';
import {
    PLEvent,
    IPLEvent,
    PLEventClient,
    PLModalEventOptions,
    PLRepeatingRuleValue,
    PLEventRepeatMode,
    PLLocation,
    PLClient,
} from '../../models';
// NgRx Store
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import {
    selectEvaluations,
    selectIsLoadingEvents,
    PLSaveEvent,
    PLLoadEvaluations,
    ScheduleEffects,
    PLDeleteEvent,
} from '../../store/schedule';
import { selectClients } from '../../store/clients';
import { selectBillingCodesCanProvide } from '@common/store/billing';
import {
    selectLocations,
} from '../../store/locations';
// Services
import { PLMayService, PLTimezoneService } from '@root/index';

import { PL_OPTIONS_FORMATTER } from '../../helpers';
import { PLBillingCodesService } from '../../services';

@Component({
    selector: 'pl-event',
    templateUrl: './pl-event.component.html',
    styleUrls: ['./pl-event.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLEventComponent implements OnInit {

    private destroyed$ = new Subject<boolean>();
    invalid = true;
    isLeadClinician = false;
    showClients = false;
    showLocations = false;
    allowBillingCodeUpdate = true;
    allowClientsUpdate = true;
    canRepeat = true;
    maxClients = 999;
    confirmingDelete: boolean;
    singleAppointment: boolean;
    editingDatetime = true;
    minHeight = 650;
    errors: { [key: string]: boolean };
    clientIDs: string[];
    locationID: string;
    workingEvent: PLEvent;
    // #region Temp Variables
    isAmendable: boolean;
    billingCodesCategories: Map<any, any>;
    selectedPendingService = '';
    selectedPending = OPTION_NEW;
    selectedBillingCategory: string;
    // //#endregion

    // #region Options
    billingCodesCategoryOpts: Option[] = [];
    billingCodesOpts: Option[] = [];
    // #endregion
    loading$ = this.store$.select(selectIsLoadingEvents);
    user$ = this.store$.select('currentUser').pipe(
        tap((user) => {
            this.isLeadClinician = this.plMay.isLead(user);
            if (this.data.isNew) {
                this.store$.dispatch(PLLoadEvaluations({
                    payload: {
                        assignedTo: user.uuid,
                        statusIn: 'not_started,in_process,idle',
                    },
                }));
            }
        }),
        shareReplay(),
    );

    dataSource$ = combineLatest([
        this.user$,
        this.store$.select(selectEvaluations),
        this.store$.select(selectBillingCodesCanProvide),
        this.store$.select(selectClients),
        this.store$.select(selectLocations),
    ]);
    data$ = this.dataSource$.pipe(map(([user, pendingServices, billingCodes, clients, locations]) => ({
        user,
        clients,
        locations,
        billingCodes,
        pendingServices,
        timezone: this.plTimezone.getUserZone(user),
        clientsOpts: PL_OPTIONS_FORMATTER.Clients(clients),
        locationOpts: PL_OPTIONS_FORMATTER.Locations(locations),
        pendingOpts: [
            { value: OPTION_NEW, label: 'New' },
            { value: OPTION_PENDING, label: `Pending Evaluations (${pendingServices.length})` },
        ],
    })));

    @Input() event: PLEvent;

    constructor(
        private store$: Store<AppStore>,
        private scheduleEffects: ScheduleEffects,
        private plTimezone: PLTimezoneService,
        private plMay: PLMayService,
        private dialogRef: MatDialogRef<PLEventComponent>,
        @Inject(MAT_DIALOG_DATA) private data: PLModalEventOptions) {}

    ngOnInit() {
        if (this.data) {
            const { isNew, start: _start, end: _end, uuid, event, repeat, isAmendable } = this.data;
            if (!isNew) {
                this.event = event;
                this.workingEvent = { ...this.event };
                this.singleAppointment = repeat === PLEventRepeatMode.One;
            } else {
                this.workingEvent = this.createEvent(_start, _end, 'BILLING');
            }
            this.isAmendable = isAmendable;
        }
        this.dataSource$.pipe(first()).subscribe((([user, pendingServices, billingCodes, clients, locations]) => {
            this.billingCodesCategories = PLBillingCodesService.groupByCreationCategory(billingCodes);
            this.billingCodesCategoryOpts =
                PL_OPTIONS_FORMATTER.SingleValue(Array.from(this.billingCodesCategories.keys()));
            let billingCode = this.isLeadClinician ?
                this.getLeadClinicianDefaultBillingCode(billingCodes) :
                this.getDefaultBillingCode(billingCodes);
            if (this.data && !this.data.isNew) {
                const _billingCode = billingCodes.find(code => code.uuid === this.data.event.billing_code);
                if (_billingCode) {
                    billingCode = _billingCode;
                }
            }
            this.changeBillingCategory(billingCode.event_creation_category, this.data.isNew);
            if (this.data && !this.data.isNew) {
                this.changeBillingCode(billingCode.uuid, billingCodes);
                if (this.showClients) {
                    this.changeClients(this.data.event.clients.map(({ uuid }) => uuid), clients);
                }
                if (this.showLocations) {
                    this.changeLocations(this.data.event.locations.map(({ uuid }) => uuid)[0], locations);
                }
            }
        }));

        this.adjustHeight();

        this.scheduleEffects.eventSaved$
            .pipe(takeUntil(this.destroyed$))
            .subscribe((payload: any) => {
                const isBlackoutDay = payload.appointment.is_blacked_out || localStorage.getItem('DEBUG_BLACKOUT_DAY')
                if (!payload.keepOpen) {
                    this.dialogRef.close(payload);
                } else {
                    this.event = payload.appointment;
                    this.workingEvent = { ...this.event };
                    if (this.selectedPending === OPTION_PENDING) {
                        this.changePendingOpt(OPTION_NEW);
                    }
                }
            });
    }

    ngOnDestroy() {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    @HostListener('window:resize', ['$event']) onResize(event: any) {
        this.adjustHeight(event.target.innerHeight);
    }

    private adjustHeight(height?: any) {
        const winHeight = (height || window.innerHeight) - 156;
        this.minHeight = winHeight < 650 ? winHeight : 650;
    }

    isNew(): boolean {
        return !this.workingEvent || !this.workingEvent.event || !this.workingEvent.event.uuid;
    }

    // #region Changes Management
    changePendingOpt(value: string) {
        if (value !== OPTION_PENDING) {
            this.changePendingService('', []);
        }
        this.selectedPending = value;
        this.editingDatetime = value !== OPTION_PENDING;
        this.checkForErrors();
    }

    changePendingService(value: any, clientServices: any[], billingCodes?: PLBillingCode[], clients?: PLEventClient[]) {
        this.selectedPendingService = value;
        const clientService = clientServices.find(({ uuid }) => uuid === value);
        if (clientService) {
            const evaluationBillingCode = billingCodes.find(({ code }) => code === 'evaluation');
            this.changeBillingCategory(evaluationBillingCode.event_creation_category);
            this.changeBillingCode(evaluationBillingCode.uuid, billingCodes);
            const clientUuid = clientService.client.uuid || clientService.client;
            this.changeClients([clientUuid], clients);
        }
        this.checkForErrors();
    }

    changeClients(value: string[], clients: PLEventClient[]) {
        this.clientIDs = value;
        this.workingEvent.clients = clients.filter(c => value.includes(c.uuid));
        if (!this.showLocations) {
            this.workingEvent.locations = [];
        }
        this.checkForErrors();
    }

    changeLocations(value: string, locations: PLLocation[]) {
        this.locationID = value;
        const _loc = locations.find(l => l.uuid === value);
        this.workingEvent.locations = _loc ? [_loc] : [];
        if (!this.showClients) {
            this.workingEvent.clients = [];
        }
        this.checkForErrors();
    }

    changeRange(value: { start: string, end: string }) {
        this.workingEvent.start = value.start;
        this.workingEvent.end = value.end;
        this.checkForErrors();
    }

    changeRepeatingRule(value: PLRepeatingRuleValue) {
        const rKeys = Object.keys(value);
        const newEvent: IPLEvent = {
            ...this.workingEvent.event,
            ...value,
            repeating: !!rKeys.length,
        };
        const keys = ['recurrence_frequency', 'recurrence_params', 'end_recurring_period'];
        keys.forEach((key) => {
            if (!value[key]) {
                // Need to set to null in case of edit; need to unset in backend.
                newEvent[key] = null;
            }
        });
        this.workingEvent.event = newEvent;
        this.checkForErrors();
    }

    repeatingRuleValid(isValid: boolean) {
        if (this.errors && this.errors.repeatingRules !== !isValid) {
            this.errors.repeatingRules = !isValid;
        }
        this.invalid = Object.keys(this.errors).findIndex(k => this.errors[k]) >= 0;
    }
    // #endregion

    // #region Billing Codes
    private getDefaultBillingCode(billingCodes: PLBillingCode[]): PLBillingCode {
        return billingCodes.find(({ name }) => name === 'Direct Services');
    }

    private getLeadClinicianDefaultBillingCode(billingCodes: PLBillingCode[]): PLBillingCode {
        return billingCodes.find(({ code }) => code === 'service_coord_billable');
    }

    private getPACDefaultBillingCode(billingCodes: PLBillingCode[]): PLBillingCode {
        return billingCodes.find(({ code }) => code === 'pa_coordination');
    }

    private getLeadBillingCodes(billingCodes: PLBillingCode[]): PLBillingCode[] {
        const SC = this.getLeadClinicianDefaultBillingCode(billingCodes);
        const PAC = this.getPACDefaultBillingCode(billingCodes);
        const leadCodes: PLBillingCode[] = [];
        if (SC) {
            leadCodes.push(SC);
        }
        if (PAC) {
            leadCodes.push(PAC);
        }
        return leadCodes;
    }

    private isLeadBillingCode(eventBillingCode: string, billingCodes: PLBillingCode[]): boolean {
        const leadCodes = this.getLeadBillingCodes(billingCodes);
        return eventBillingCode && !!leadCodes.find(({ uuid }) => uuid === eventBillingCode);
    }

    private getLeadClinicianFilteredBillingCodesOpts(billingCodes: PLBillingCode[], billingCodeOpts: Option[]) {
        const leadCodes = this.getLeadBillingCodes(billingCodes);
        return billingCodeOpts
            .filter(({ value }) => leadCodes.map(c => c.uuid)
                .includes(<string>value));
    }

    private isDocumented(event: PLEvent): boolean {
        return event.signed ? true : event.records
                .map(r => r.hasOwnProperty('signed_on'))
                .reduce((p, c) => p || c, false);
    }

    billingCategoryDisabled(isNew: boolean, billingCodes: PLBillingCode[]): boolean {
        let _disabled = false;
        if (this.isLeadClinician) {
            _disabled = isNew || this.isLeadBillingCode(this.workingEvent.billing_code, billingCodes);
        }
        return _disabled;
    }

    changeBillingCategory(category: string, setDefault = false) {
        const billingCodes: PLBillingCode[] = this.billingCodesCategories.get(category)
            .filter((code: PLBillingCode) => code.can_provide);
        this.billingCodesOpts = PL_OPTIONS_FORMATTER.BillingCodes(billingCodes);
        if (this.isLeadClinician) {
            this.billingCodesOpts = this.getLeadClinicianFilteredBillingCodesOpts(billingCodes, this.billingCodesOpts);
        }
        this.selectedBillingCategory = category;
        const defaultCode = this.isLeadClinician ?
            this.getLeadClinicianDefaultBillingCode(billingCodes) :
            this.getDefaultBillingCode(billingCodes);
        this.changeBillingCode((setDefault && defaultCode) ? defaultCode.uuid : '', billingCodes);
    }

    changeBillingCode(billingCode: string, billingCodes: PLBillingCode[], clients?: PLClient[]) {
        const billingInfo = billingCodes.find(item => item.uuid === billingCode);
        this.showLocations = false;
        this.showClients = false;
        if (billingInfo) {
            const documented = this.isDocumented(this.workingEvent);
            this.allowClientsUpdate = !(billingInfo.code === 'evaluation' && documented);
            this.allowBillingCodeUpdate = !documented;
            this.canRepeat = billingInfo.event_repeatable && !documented
                && (this.workingEvent.event.repeating ? !this.singleAppointment : true);
            if (billingInfo.client_participates !== 'NONE') {
                const maxClients = billingInfo.client_participates === 'SINGLE' ? 1 : 999;
                if (this.maxClients !== maxClients) {
                    if (clients && this.maxClients > maxClients) {
                        this.changeClients([], clients);
                    }
                    this.maxClients = maxClients;
                }
                this.showClients = true;
            } else if (billingInfo.location_participates !== 'NONE') {
                this.showLocations = true;
            }
            if (!this.showLocations) {
                this.changeLocations('', []);
            }
        }
        this.workingEvent.billing_code = billingCode;
        this.workingEvent.billing_expanded = billingInfo;
        this.workingEvent.event = { ...this.workingEvent.event, billing_code: billingCode };
        this.checkForErrors();
    }
    // #endregion

    checkForErrors() {
        const errors: { [key: string]: boolean } = {};
        const { clients, locations, billing_code, start, end, event } = this.workingEvent;
        const { repeating, recurrence_frequency, recurrence_params } = event;
        const mStart = moment(start);
        const mEnd = moment(end);
        const hourDiff: number = mEnd.diff(mStart, 'hours');
        errors.apptDuration = hourDiff >= 24;
        errors.endBefore = mEnd.isSameOrBefore(mStart);
        errors.billingCodeRequired = !billing_code;
        errors.clientsRequired = this.showClients && clients.length <= 0;
        errors.locationRequired = this.showLocations && locations.length <= 0;
        errors.repeatingRules = repeating && (!recurrence_frequency || !recurrence_params);
        // TODO: Repeating rule;
        this.invalid = Object.keys(errors).findIndex(k => errors[k]) >= 0;
        this.errors = errors;
    }

    delete() {
        this.confirmingDelete = false;
        this.store$.dispatch(
            PLDeleteEvent({
                event: this.event,
                deleteType: PLEventRepeatMode.One,
                isAmendable: this.isAmendable,
            }));
        this.loading$.pipe(
            filter(loading => !loading),
            take(1),
        ).subscribe(() => this.dialogRef.close());
    }

    save(document = false, keepOpen = false) {
        this.store$.dispatch(PLSaveEvent({
            payload: {
                document,
                keepOpen,
                event: this.workingEvent,
                prevEvent: this.event,
                repeat: this.data.repeat,
            },
        }));
    }

    createEvent(start: string, end: string, event_type: string): PLEvent {
        return {
            end,
            start,
            original_start: start,
            original_end: end,
            clients: [],
            locations: [],
            description: null,
            records: [],
            uuid: '',
            removed: false,
            locked: false,
            signed: false,
            title: '',
            billing_code: '',
            is_blacked_out: false,
            event: {
                event_type,
                billing_code: '',
                end: null,
                start: null,
            },
        };
    }
}

const OPTION_NEW = 'new';
const OPTION_PENDING = 'pending';
