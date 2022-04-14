import { Injectable } from '@angular/core';
import { PLHttpService, PLUrlsService } from '@root/index';
import { PLNote, PLNoteUser } from '@root/src/app/common/components/pl-notes-list/pl-notes-list.component';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { User } from '../../modules/user/user.model';

export interface PLReferralNote {
    uuid?: string;
    referral?: string;
    note_number?: number;
    provider?: string;
    provider_expanded?: PLNoteUser;
    text?: string;
    is_edited?: boolean;
    modified?: string;
    modified_by?: string;
    created?: string;
    created_by?: string;
    user_mention?: { uuid: string }[];
}

@Injectable()
export class PLReferralNotesService {
    mentionableUsers: PLNoteUser[] = [];

    constructor(private plHttp: PLHttpService, private plUrls: PLUrlsService) {}

    getAllMentionableUsersLocation(locationId: string): Observable<PLNoteUser[]> {
        const URL = this.plUrls.urls.locationMentionableUsers.replace(':location_uuid', locationId);
        const params = {
            location_uuid: locationId,
            limit: 1000,
        };
        return this.plHttp.get('', params, URL).pipe(
            map((res: any) => {
                return res.map((userRes: any) => this.mapMentionableUserToPLNoteUser(userRes));
            }),
            catchError(() => of([])),
        );
    }

    getAllReferralNotes(referralId: string): Observable<PLNote[]> {
        const URL = `${this.plUrls.urls.referralNotes.replace(':referral_uuid', referralId)}`;
        const params = {
            referral_uuid: referralId,
            limit: 1000,
            expand: 'provider',
        };
        return this.plHttp.get('', params, URL).pipe(
            map((res: any) => {
                return res.results.map((referralNoteRes: PLReferralNote) => {
                    return this.mapReferralNotesResponseToPLNote(referralNoteRes);
                });
            }),
        );
    }

    createNewNote(newNote: PLReferralNote): Observable<PLNote[]> {
        const URL = this.plUrls.urls.referralNotes.replace(':referral_uuid', newNote.referral);
        const payload = {
            referral_id: newNote.referral,
            text: newNote.text,
            user_mention: newNote.user_mention,
        };
        return this.plHttp.save('', payload, URL).pipe(
            switchMap((res: any) => this.getAllReferralNotes(newNote.referral)),
        );
    }

    updateNote(note: PLReferralNote): Observable<PLNote[]> {
        const URL = `${this.plUrls.urls.referralNotes.replace(':referral_uuid', note.referral)}${note.uuid}/`;
        const payload = {
            text: note.text,
            user_mention: note.user_mention,
        };
        return this.plHttp.put('', payload, URL).pipe(
            switchMap((res: any) => this.getAllReferralNotes(note.referral)),
        );
    }

    deleteNote(note: PLReferralNote) {
        const URL = `${this.plUrls.urls.referralNotes.replace(':referral_uuid', note.referral)}${note.uuid}/`;
        const payload = {
            uuid: note.uuid,
            referral_uuid: note.referral,
        };
        return this.plHttp.delete('', payload, URL);
    }

    mapReferralNotesResponseToPLNote(referralNotesRes: PLReferralNote): PLNote {
        return {
            uuid: referralNotesRes.uuid,
            owner: this.getNoteOwner(referralNotesRes.provider)
                || this.mapMentionableUserToPLNoteUser(referralNotesRes.provider_expanded),
            text: referralNotesRes.text,
            created: referralNotesRes.created,
            modified: referralNotesRes.modified,
            isEdited: referralNotesRes.is_edited,
            userMentions: referralNotesRes.user_mention.map(mention => {
                return { uuid: mention.uuid };
            }),
        };
    }

    mapMentionableUserToPLNoteUser(userRes: User): PLNoteUser {
        return {
            uuid: userRes.uuid,
            firstName: userRes.first_name,
            lastName: userRes.last_name,
            username: userRes.username,
        };
    }

    getNoteOwner(username: string): PLNoteUser {
        return this.mentionableUsers.find(user => user.username === username);
    }
}
