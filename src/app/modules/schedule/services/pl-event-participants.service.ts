import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { switchMap, defaultIfEmpty, map } from 'rxjs/operators';
import { PLHttpService } from '@root/index';
import { PLEventResponse, PLEvent } from '../models';

interface PLParticipant {
    [key: string]: { uuid?: string } | string;
}

@Injectable()
export class PLEventParticipantsService {

    constructor(private plHttp: PLHttpService) { }

    private getHttpUrl(participant: PLParticipant): string {
        let httpUrl;
        const urlBase = participant.appointment ?
         `${this.plHttp.formUrl('appointments')}${participant.appointment}` :
         `${this.plHttp.formUrl('events')}${participant.event}`;
        if (participant.location) {
            httpUrl = `${urlBase}/locations/`;
        } else if (participant.client) {
            httpUrl = `${urlBase}/clients/`;
        }
        return httpUrl;
    }

    buildParticipants(appointment: PLEvent): PLParticipant[] {
        let participants: PLParticipant[] = [];
        if (!appointment) {
            return participants;
        }
        const { locations, clients } = appointment;
        // Save appointment (instead of / in addition to event uuid) if have it.
        const participantBase: PLParticipant = {};
        if (appointment.uuid) {
            participantBase.appointment = appointment.uuid;
        } else {
            participantBase.event = appointment.event.uuid;
        }
        if (locations) {
            participants = [
                ...participants,
                ...locations.map(({ uuid }) => ({
                    ...participantBase,
                    location: uuid,
                })),
            ];
        }
        if (clients) {
            participants = [
                ...participants,
                ...clients.map(({ uuid }) => ({
                    ...participantBase,
                    client: uuid,
                })),
            ];
        }
        return participants;
    }

    get(appointment: PLEvent, existingParticipants?: PLParticipant[]) {
        let type = 'appointment';
        let uuid = appointment.uuid;
        if (!uuid) {
            type = 'event';
            uuid = appointment.event.uuid;
        }
        // Form new participants (to match structure of existingParticipants).
        let newLocationIds: string[] = [];
        let newClientIds: string[] = [];
        const addParticipants: PLParticipant[] = [];
        const removeParticipants: PLParticipant[] = [];
        if (appointment.locations && appointment.locations.length) {
            newLocationIds = appointment.locations.map(({ uuid: id }) => id);
        }
        if (appointment.clients && appointment.clients.length) {
            newClientIds = appointment.clients.map(({ uuid: id }) => id);
        }

        // Go through existing participants and if not in new participants, mark for removal.
        const oldLocationIds: string[] = [];
        const oldClientIds: string[] = [];
        if (existingParticipants && existingParticipants.length) {
            existingParticipants.forEach(({ location, client }) => {
                const particicipant = location || client;
                const id = (<{ uuid: string }>particicipant).uuid || <string>particicipant;
                if (location) {
                    oldLocationIds.push(id);
                    if (!newLocationIds.length || newLocationIds.indexOf(id) < 0) {
                        removeParticipants.push({ location: id, [type]: uuid });
                    }
                }
                if (client) {
                    oldClientIds.push(id);
                    if (!newClientIds.length || newClientIds.indexOf(id) < 0) {
                        removeParticipants.push({ client: id, [type]: uuid });
                    }
                }
            });
        }

        // Go through new participants and if not in existing participants, mark for creation.
        newLocationIds.forEach((locationId) => {
            if (!oldLocationIds.length || oldLocationIds.indexOf(locationId) < 0) {
                addParticipants.push({ location: locationId, [type]: uuid });
            }
        });
        newClientIds.forEach((clientId) => {
            if (!oldClientIds.length || oldClientIds.indexOf(clientId) < 0) {
                addParticipants.push({ client: clientId, [type]: uuid });
            }
        });
        return { addParticipants, removeParticipants };
    }

    save(participant: PLParticipant): Observable<PLEventResponse> {
        const url = this.getHttpUrl(participant);
        const httpOpts = {
            url,
            method: 'PUT',
            body: participant,
        };
        return this.plHttp.go(httpOpts);
    }

    remove(participant: PLParticipant): Observable<any> {
        const url = this.getHttpUrl(participant);
        const { location, client } = participant;
        const httpOpts = {
            url,
            method: 'DELETE',
            body: location ? { location } : { client },
        };
        return this.plHttp.go(httpOpts);
    }

    removeAll(participants: PLParticipant[]): Observable<any> {
        return forkJoin((participants || [])
                .map(participant => this.remove(participant)))
            .pipe(defaultIfEmpty([]));
    }

    // The existingParticipants are used to clear out existing ones as we'll
    // save new ones now. We can't really edit existing participants since
    // they could all be different.
    saveAll(appointment: PLEvent, existingParticipants: PLParticipant[]): Observable<PLEvent> {
        const { addParticipants, removeParticipants } = this.get(appointment, existingParticipants);
        // If an appointment, the participants are automatically copied over on
        // the backend so we need to delete them, even if this is an event that
        // is being converted to an appointment and we haven't actually saved
        // the participants on the appointment on the frontend.
        return this.removeAll(removeParticipants).pipe(
            switchMap(() =>
                forkJoin(addParticipants
                    .map(participant => this.save(participant))),
            ),
            defaultIfEmpty([]),
            // Remove any record of a removed participant
            map((fromEventClients: PLEvent[]) => {
                const isBlackedOut = !!(fromEventClients.find((event: PLEvent) => event.is_blacked_out) || appointment.is_blacked_out);
                if (localStorage.getItem('DEV_DEBUG_BLACKOUT_DAY')) {
                    console.log('---- save event', {fromEventClients, appointment, isBlackedOut})
                }
                let { records } = appointment;
                if (records && records.length) {
                    const locationsRemoved = removeParticipants
                        .filter(p => !!p.location)
                        .map(p => p.location);
                    records = records.filter(rec => !locationsRemoved.includes(rec.location));
                    const clientsRemoved = removeParticipants
                        .filter(p => !!p.client)
                        .map(p => p.client);
                    records = records.filter(rec => !locationsRemoved.includes(rec.location));
                    records = records.filter(rec => !clientsRemoved.includes(rec.client));
                }
                return { ...appointment, is_blacked_out: isBlackedOut, records };
            }),
        );
    }
}
