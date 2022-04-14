import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { PLConfirmDialogService } from '@root/index';
import { User } from '@root/src/app/modules/user/user.model';
import { first, takeUntil } from 'rxjs/operators';
import { PLReferralNotesService } from '../../services/pl-referral-notes.service';
import { PLDestroyComponent } from '../pl-destroy.component';
import { PLNote, PLNoteUser } from '../pl-notes-list/pl-notes-list.component';

@Component({
    selector: 'pl-referral-notes',
    templateUrl: './pl-referral-notes.component.html',
})
export class PLReferralNotesComponent extends PLDestroyComponent implements OnInit, OnChanges {
    @Input() currentUser: User;
    @Input() referralId: string;
    @Input() clientId: string;
    @Input() mayEditNotes = true;
    @Input() locationId: string;
    @Input() openInEditMode = false;

    @Output() readonly noteEditing = new EventEmitter<boolean>();
    @Output() readonly noteChange = new EventEmitter<PLNote>();
    @Output() readonly noteCreated = new EventEmitter<PLNote>();
    @Output() readonly notesListUpdated = new EventEmitter<PLNote[]>();

    referralNotes: PLNote[] = [];
    mentionableUsers: PLNoteUser[] = [];
    currentNoteUser: PLNoteUser;
    loading = false;
    notesLoaded = false;
    mentionableUsersLoaded = false;

    constructor(
        private clientReferralNotesService: PLReferralNotesService,
        private plConfirm: PLConfirmDialogService,
    ) {
        super();
    }

    ngOnInit(): void {
        this.init();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.referralId && changes.referralId.currentValue) {
            this.initReferralNotes();
        }

        if (this.currentUser && this.currentUser.uuid) {
            this.initCurrentUser();
        }
    }

    init(): void {
        this.loading = true;
        this.initMentionableUsers();
        this.initReferralNotes();
        this.initCurrentUser();
    }

    initMentionableUsers(): void {
        this.loading = true;
        if (!this.mentionableUsersLoaded && this.locationId) {
            this.mentionableUsersLoaded = true;
            this.clientReferralNotesService.getAllMentionableUsersLocation(this.locationId)
                .pipe(first())
                .subscribe((users: PLNoteUser[]) => {
                    this.mentionableUsers = users;
                    this.clientReferralNotesService.mentionableUsers = this.mentionableUsers;
                    this.loading = false;
                });
        }
    }

    initReferralNotes(): void {
        if (this.referralId && !this.notesLoaded) {
            this.fetchReferralNotes();
        }
    }

    initCurrentUser() {
        this.currentNoteUser = this.clientReferralNotesService.mapMentionableUserToPLNoteUser(this.currentUser);
    }

    fetchReferralNotes() {
        this.loading = true;
        this.notesLoaded = true;
        this.clientReferralNotesService.getAllReferralNotes(this.referralId)
            .pipe(takeUntil(this.destroyed$))
            .subscribe((referralNotes: PLNote[]) => {
                this.referralNotes = referralNotes;
                this.sortReferralNotesByCreated();
                this.loading = false;
            });
    }

    onNoteDelete(note: PLNote) {
        this.plConfirm.show({
            header: 'Delete Referral Note',
            content: `<div>Are you sure you want to delete this note?</div>`,
            primaryLabel: 'Delete',
            secondaryLabel: 'Cancel',
            primaryCallback: () => {
                this.clientReferralNotesService.deleteNote({
                    uuid: note.uuid,
                    referral: this.referralId,
                }).subscribe((res: any) => {
                    this.referralNotes = this.referralNotes.filter(referralNote => referralNote.uuid !== note.uuid);
                    this.notesListUpdated.emit(this.referralNotes);
                });
            },
            secondaryCallback: () => {},
        });
    }

    onNoteSave(note: PLNote) {
        if (!note.uuid) {
            this.createNewNote(note);
        } else {
            this.updateNote(note);
        }
    }

    onNoteEditing(isEditing: boolean) {
        this.noteEditing.emit(isEditing);
    }

    onNoteChange(note: PLNote) {
        this.noteChange.emit(note);
    }

    createNewNote(note: PLNote) {
        this.clientReferralNotesService.createNewNote({
            referral: this.referralId,
            text: note.text,
            user_mention: note.userMentions,
        }).subscribe((notesRes: PLNote[]) => {
            this.referralNotes = notesRes;
            this.sortReferralNotesByCreated();
            this.noteCreated.emit(note);
            this.notesListUpdated.emit(this.referralNotes);
        });
    }

    updateNote(note: PLNote) {
        this.clientReferralNotesService.updateNote({
            uuid: note.uuid,
            referral: this.referralId,
            text: note.text,
            user_mention: note.userMentions,
        }).subscribe((notesRes: PLNote[]) => {
            this.referralNotes = notesRes;
            this.sortReferralNotesByCreated();
        });
    }

    sortReferralNotesByCreated() {
        const unSorted = [...this.referralNotes];
        this.referralNotes = unSorted.sort((a, b) => Date.parse(a.created) - Date.parse(b.created));
    }
}
