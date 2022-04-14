
import { Injectable } from '@angular/core';
import { PLBillingCodesService } from '../services';
import { PLBillingCode } from '@common/interfaces';
import { PLEvent, PLEventRecord } from '../models';

interface PLParticipant {
    uuid: string;
    billing_code: string;
    billing_expanded: PLBillingCode;
    noClientNorLocation?: boolean;
    location_expanded?: any;
    client_expanded?: any;
}

@Injectable()
export class PLRecordParticipantsService {

    constructor(private plBilling: PLBillingCodesService) { }

    allSigned(event: PLEvent) {
        const records = this.formRecords(event) || [];
        return records
            .map(r => r.signed_on)
            .reduce((p, c) => p && c, false);
    }

    // `event` is either an event or an appointment, which (may) have records,
    // and which has an event object with the participants (clients, locations).
    // We take the participants and records, match them, and use the record,
    // if it exists, or create a new record placeholder from the participant.
    formRecords(event: PLEvent): PLEventRecord[] {
        if (!event || Object.keys(event).length === 0) {
            return [];
        }
        const records = event.records || [];
        const { start, end } = event;

        // Go through each participant and use the corresponding record, if it exists.
        // There should never be a record WITHOUT a participant. There may be
        // a participant without a record.
        return this.formParticipantsFromEvent(event)
            .map((participant) => {
                const defaultRecord: PLEventRecord = { ...participant, uuid: '' };
                let record;
                // If no clients and no locations, just use the (single) record.
                if (participant.noClientNorLocation && records.length === 1) {
                    record = records[0];
                }
                // Client takes priority as there could be multiple records with the
                // same location but clients should always be unique.
                if (participant.client_expanded) {
                    record = records.find(item => item.client_expanded ?
                        item.client_expanded.uuid === participant.client_expanded.uuid :
                        item.client === participant.client_expanded.uuid);
                    if (record) {
                        record = { 
                            ...record, 
                            client_expanded: participant.client_expanded,
                        };
                    }
                }
                if (participant.location_expanded) {
                    record = records.find(item => item.location === participant.location_expanded.uuid);
                    if (record) {
                        record = { 
                            ...record, 
                            location_expanded: participant.location_expanded,
                        };
                    }
                }
                return { ...(record || defaultRecord), start, end };
            });
    }

    formParticipantsFromEvent(event: PLEvent): PLParticipant[] {
        const { billing_expanded, event: _event } = event;
        let { locations, clients, billing_code } = event;
        if (_event) {
            locations = locations || _event.locations;
            clients = clients || _event.clients;
            billing_code = billing_code || _event.billing_code;
        }
        const { hasLocations, hasClients } =  this.plBilling.getParticipants(billing_expanded);
        // If neither, create a single record stub that has no clients or locations.
        if (!hasClients && !hasLocations) {
            return [{
                billing_code,
                billing_expanded,
                uuid: billing_code,
                noClientNorLocation: true,
            }];
        }
        const buildPartcipants = (data: any[], name: string): any[] =>
            data.map(item => ({
                billing_code,
                billing_expanded,
                [`${name}_expanded`]: item,
                uuid: item.uuid,
            }));
        return [
            ...hasLocations ? buildPartcipants(locations || [], 'location') : [],
            ...hasClients ? buildPartcipants(clients || [], 'client') : [],
        ];
    }
}
