import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { User } from '@modules/user/user.model';
import { PLBillingCode } from '@common/interfaces';
import { PLConfirmDialog2Component } from '@common/components/pl-confirm-dialog/pl-confirm-dialog.component';
import { PLEvent, PLClient, PLEventRecord, PLLocation } from '../models';
import * as moment from 'moment';
import { of } from 'rxjs';

interface PLScheduleExpand {
    caseload?: PLClient[];
    billingCodes?: PLBillingCode[];
    locations?: PLLocation[];
}

@Injectable()
export class PLScheduleHelperService {

    constructor(private dialog: MatDialog) { }

    eventIsAvailability(event: PLEvent): boolean {
        return this.eventGetType(event) === 'AVAILABILITY';
    }

    eventIsAssignment(event: PLEvent): boolean {
        return this.eventGetType(event) === 'ASSIGNMENT';
    }

    eventIsBilling(event: PLEvent): boolean {
        return this.eventGetType(event) === 'BILLING';
    }

    eventIsLocked(event: PLEvent): boolean {
        return (event.locked !== undefined) ? event.locked : false;
    }

    eventGetType(event: PLEvent): string {
        const { event_type } = event.event;
        if (event.event) {
            return event_type;
        }
        return null;
    }

    eventEdit(user: User, event: PLEvent, dateState: any): boolean {
        // check if any records are signed
        let signed = false;
        const isAmendable = this.isAmendable(dateState, event, user.xProvider ? user.xProvider.timezone : '');
        const isLocked = this.eventIsLocked(event);
        if (event.records && event.records.length > 0) {
            const signedEvent = event.records.find(item => item.signed);
            if (signedEvent) {
                signed = signedEvent.signed;
            }
        }
        if (isLocked) {
            return isAmendable && !signed;
        }
        return !isLocked && event.event &&
            event.event.provider && event.event.provider === user.uuid && !signed;
    }

    eventDelete(user: User, event: PLEvent): boolean {
        return !this.eventIsLocked(event) && event.event &&
            event.event.provider && event.event.provider === user.uuid;
    }

    eventViewDocumentation(event: PLEvent): boolean {
        return !(this.eventIsAssignment(event) || this.eventIsAvailability(event));
    }

    eventEditDocumentation(user: User, event: PLEvent, dateState: any) {
        if (!this.eventViewDocumentation(event)) {
            return false;
        }
        const isAmendable = this.isAmendable(dateState, event, user.xProvider ? user.xProvider.timezone : '');
        return isAmendable ? true : this.eventEdit(user, event, dateState);
    }

    expandEvent(event: PLEvent, expand: PLScheduleExpand): PLEvent {
        const { billingCodes } = expand;
        const { event: _event } = event;
        let {
            clients,
            locations,
            billing_code,
            billing_expanded,
        } = event;
        if (_event) {
            locations = locations || _event.locations;
            clients = clients || _event.clients;
            billing_code = billing_code || _event.billing_code;
        }
        billing_expanded = billing_expanded || billingCodes.find(({ uuid }) => uuid === billing_code);
        return { ...event, billing_expanded };
    }

    expandRecord(record: PLEventRecord, expand: PLScheduleExpand): PLEventRecord {
        const { billingCodes, caseload } = expand;
        const { client, billing_code } = record;
        let { client_expanded, billing_expanded } = record;
        client_expanded = client_expanded || caseload.find(({ uuid }) => uuid === client);
        billing_expanded = billing_expanded || billingCodes.find(({ uuid }) => uuid === billing_code);
        return { ...record, billing_expanded, client_expanded };
    }

    isAmendable(dateState: any,
        appointment: { start: string; records?: PLEventRecord[]; signed?: boolean; locked?: boolean; },
        timezone?: string): boolean {
        if (!dateState) {
            return false;
        }
        const appointmentDay = moment.tz(appointment.start, timezone).format('YYYY-MM-DD');
        let isAmendableRecord = appointment.locked;
        if (!isAmendableRecord && appointment.records) {
            isAmendableRecord = appointment.records
                .map(r => r.locked)
                .reduce((p, c) => p && c, true);
        }
        const isAmendableDay =
            dateState.amendable.find((amendableDay: string) => amendableDay === appointmentDay);
        return !!isAmendableRecord && !!isAmendableDay;
    }

    openAmendWarning(event: PLEvent, isAmendable = true) {
        const default$ = of('yes');
        if (isAmendable) {
            let title = 'You are about to amend a past event';
            if (!event.event) {
                title = 'You are about to add an event to a past work period';
            }
            return this.dialog.open(PLConfirmDialog2Component, {
                data: {
                    title,
                    message: AMENDMENT,
                    options: [
                        {
                            label: 'I understand, proceed',
                            value: 'confirm',
                            color: 'accent',
                            type: 'raised',
                        },
                        { label: 'Cancel', class: 'gray-outline', value: 'cancel' },
                    ],
                },
            }).afterClosed();
        }
        return default$;
    }

    amendmentCheck(dateState: any, param: PLEvent | string, timezone?: string) {
        const event: any = typeof param === 'string' ? { start: param, locked: true } : param;
        const isAmendable = this.isAmendable(dateState, event, timezone);
        return this.openAmendWarning(event, isAmendable);
    }
}

// tslint:disable-next-line: max-line-length
const AMENDMENT = 'Warning: Changes made to past work periods may affect your pay in the next<br/>pay period after processing the amendment.<br /><br /><small>You have 90 days to amend events. All changes will be logged and submitted for review. <br/> PresenceLearning will reach out to you directly if there are any questions. You can review<br/>the status of your amendments in the <a href="/c/billing">Billing section</a>.</small>';
