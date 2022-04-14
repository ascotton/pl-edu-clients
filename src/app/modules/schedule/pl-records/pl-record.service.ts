import * as moment from 'moment';

import { Injectable } from '@angular/core';
import { PLHttpService, PLTimezoneService } from '@root/index';
import { forkJoin } from 'rxjs';

import { PLTimeGridService } from '@common/services';
import { PLBillingCodesService } from '../services';

import { PLBillingCode } from '@common/interfaces';
import { PLEventRecord } from '../models';
import { User } from '../../user/user.model';

@Injectable()
export class PLRecordService {

    constructor(
        private plHttp: PLHttpService,
        private plBilling: PLBillingCodesService,
        private plTime: PLTimeGridService,
        private plTimezone: PLTimezoneService) { }

    save(record: PLEventRecord) {
        return this.plHttp.save('records', record);
    }

    saveBulk(records: PLEventRecord[]) {
        return forkJoin(records.map(record => this.save(record)));
    }

    updateAppointmentRecords(appointmentRecords: any[], records: PLEventRecord[]) {
        let index;
        let _appointmentRecords = appointmentRecords;
        if (!appointmentRecords || !appointmentRecords.length) {
            _appointmentRecords = [];
        }
        records.forEach((record) => {
            index = appointmentRecords.findIndex(({ uuid }) => uuid === record.uuid);
            if (index < 0) {
                _appointmentRecords.push(record);
            } else {
                _appointmentRecords[index] = Object.assign({}, _appointmentRecords[index], record);
            }
        });
        return _appointmentRecords;
    }

    formatForBackend(record: PLEventRecord): PLEventRecord {
        // Handle signed.
        if (!record.signed_on) {
            record.signed = false;
            record.signed_on = null;
            record.signed_by = null;
        } else {
            record.signed = true;
        }
        if (record.notes && typeof(record.notes) !== 'string') {
            record.notes = JSON.parse(<string>record.notes);
        }
        return record;
    }

    removeBlankNotes(notes: string[]): string[] {
        const _notes = (notes || []).filter(n => !!n);
        return _notes.length ?
            notes.filter(note => !!note) : null;
    }

    recordToView(record: PLEventRecord, user: User, billingCodes: PLBillingCode[] = []) {
        if (!record) { return {}; }
        const { notes } = record;
        let billingCodeClass = '';
        const signed = !!record.signed_on;
        const documented = record.hasOwnProperty('signed_on');
        const userTz = this.plTimezone.getUserZone(user);
        const format = this.plTimezone.dateTimeFormat;
        const start = this.plTimezone.toUserZone(record.start, format, userTz);
        const end = this.plTimezone.toUserZone(record.end, format, userTz);

        let signedNote = '';
        if (!record.billing_expanded) {
            const billingInfo = billingCodes.find(({ uuid }) => uuid === record.billing_code);
            record.billing_expanded = billingInfo;
        }
        if (documented) {
            if (signed) {
                const dateSigned = moment(<string>record.signed_on, format).format('M/D/YY h:mma');
                signedNote = `Signed on ${dateSigned}. Any changes require re-signing.`;
            }
            if (record.billing_expanded &&
                record.billing_expanded.event_category &&
                record.billing_expanded.event_category.name) {
                const filter = this.plBilling.getFilter(record.billing_expanded.event_category.name);
                if (filter) {
                    billingCodeClass = filter.key;
                }
            }
        }
        const hasNotes = notes && notes.length > 0;

        const title = this.formTitle(record);
        const requiredFields = this.getRequiredFields(record);
        // Do not show location if already set OR if not required.
        const showLocation = requiredFields.showLocation;
        const locationName = record.location_expanded ? record.location_expanded.name : '[no location name]';
        const billingCodeName = record.billing_expanded ?
            record.billing_expanded.name :
            record.signed ? '[not in caseload]' : '[no billing name]';
        return {
            signedNote,
            hasNotes,
            title,
            signed,
            documented,
            showLocation,
            requiredFields,
            locationName,
            billingCodeName,
            billingCodeClass,
            getLocationTracking: record.location_expanded && record.location_expanded.record_tracking_type,
            dateRange: this.plTime.formatRange({ start, end }, 'dateFirst', true, 'minutes'),
            notes: (typeof(record.notes) === 'string') ? JSON.parse(record.notes) : record.notes,
            recordClientNameHidden: (record.client_expanded && !record.client_expanded.first_name),
        };
    }

    formTitle(record: PLEventRecord): string {
        if (record.client_expanded) {
            return record.client_expanded.first_name ?
                `${record.client_expanded.first_name} ${record.client_expanded.last_name}` :
                'client name hidden';
        }
        if (record.location_expanded) {
            return record.location_expanded.name;
        }
        return record.billing_expanded ? record.billing_expanded.name : '[no billing name]';
    }

    getRequiredFields(record: PLEventRecord) {
        const required = {
            clients: true,
            location: true,
            showLocation: true,
        };
        if (record.billing_expanded) {
            const { hasLocations, hasClients } = this.plBilling.getParticipants(record.billing_expanded);
            required.clients = !!hasClients;
            // For records, location IS required if clients, even if location is not required.
            // Show location is false if location does not participate OR clients does not participate,
            // in which case we already have the location in the title and do not want to double select it.
            if (!hasClients && !hasLocations) {
                required.location = false;
                required.showLocation = false;
            }
        }
        return required;
    }
}
