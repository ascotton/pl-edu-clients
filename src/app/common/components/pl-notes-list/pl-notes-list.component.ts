import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    SimpleChanges,
    ViewEncapsulation
} from '@angular/core';
import { uniqBy } from 'lodash';
import { TinyEditor, TinyMentionsUser } from '../pl-note-editor/pl-note-editor.component';

export interface PLNote {
    uuid: string;
    owner: PLNoteUser;
    text: string;
    created?: string;
    modified?: string;
    isEdited?: boolean;
    userMentions?: { uuid: string }[];
}

export interface PLNoteUser {
    uuid: string;
    username: string;
    firstName: string;
    lastName: string;
}

enum PLNotesStates {
    Viewing = 'VIEWING',
    Editing = 'EDITING',
    Deleting = 'DELETING',
    Saving = 'SAVING',
}

@Component({
    selector: 'pl-notes-list',
    templateUrl: './pl-notes-list.component.html',
    styleUrls: ['./pl-notes-list.component.less'],
    encapsulation: ViewEncapsulation.None,
})
export class PLNotesListComponent implements OnInit {
    @Input() currentUser: PLNoteUser;
    @Input() notes: PLNote[] = [];
    @Input() mentionableUsers: PLNoteUser[] = [];
    @Input() isStandaloneEditor: boolean;
    @Input() viewMode: boolean;
    @Input() openInEditMode: boolean;

    @Output() readonly noteDelete = new EventEmitter<PLNote>();
    @Output() readonly noteSave = new EventEmitter<PLNote>();
    @Output() readonly noteEditing = new EventEmitter<boolean>();
    @Output() readonly noteChange = new EventEmitter<PLNote>();

    currentState: PLNotesStates = PLNotesStates.Viewing;
    currentNote: PLNote;
    editor: TinyEditor = { text: '' };
    tinyMentionableUsers: TinyMentionsUser[] = [];

    get isAddingNewNote() {
        return this.currentState === PLNotesStates.Editing && !this.currentNote.uuid;
    }

    constructor() { }

    ngOnInit(): void {
        this.tinyMentionableUsers = this.mapToTinyMentionableUsers();
        if (this.isStandaloneEditor || this.openInEditMode) {
            this.onAddNotesClick();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.notes) {
            this.checkIfCurrentNoteExists();
        }
    }

    checkIfCurrentNoteExists() {
        const notesIds = this.notes.map(note => note.uuid);
        if (this.currentNote && this.currentNote.uuid && !notesIds.includes(this.currentNote.uuid)) {
            this.changeState(PLNotesStates.Viewing);
        }
    }

    changeState(newState: PLNotesStates) {
        if (this.currentState !== newState) {
            this.currentState = newState;
        }
    }

    cancelNoteEditing() {
        this.changeState(PLNotesStates.Viewing);
        this.noteEditing.emit(false);
        this.noteChange.emit(null);
    }

    isNoteOwner(note: PLNote) {
        return note.owner.uuid === this.currentUser.uuid;
    }

    isSaveNoteDisabled() {
        return !this.editor.text
            || !this.editor.text.trim().length;
    }

    isEditingNote(note: PLNote): boolean {
        return this.currentState === PLNotesStates.Editing && note.uuid === this.currentNote.uuid;
    }

    shouldShowAddNotesButton() {
        return this.currentState !== PLNotesStates.Editing && !this.viewMode;
    }

    mapToTinyMentionableUsers(): TinyMentionsUser[] {
        return this.mentionableUsers.map(user => {
            return {
                id: user.uuid,
                username: user.username,
                name: `${user.firstName} ${user.lastName}`,
                fullName: `${user.firstName} ${user.lastName}`
            };
        });
    }

    onAddNotesClick() {
        this.currentNote = {
            uuid: '',
            owner: this.currentUser,
            text: '',
        };
        this.editor.text = '';
        this.changeState(PLNotesStates.Editing);
        this.noteEditing.emit(true);
    }

    onEditNoteClick(event: PLNote) {
        this.currentNote = event;
        this.editor.text = this.currentNote.text;
        this.changeState(PLNotesStates.Editing);
        this.noteEditing.emit(true);
    }

    onCancelEditingNotesClick() {
        this.cancelNoteEditing();
    }

    onDeleteNoteClick() {
        this.noteDelete.emit(this.currentNote);
        this.cancelNoteEditing();
    }

    onSaveNoteClick() {
        this.currentNote.text = this.editor.text;
        this.currentNote.userMentions = this.mergeUserMentions(this.editor);
        this.noteSave.emit(this.currentNote);
        this.cancelNoteEditing();
    }

    onEditorChange(editor: TinyEditor) {
        setTimeout(() => {
            this.currentNote.text = this.editor.text;
            this.currentNote.userMentions = this.mergeUserMentions(editor);
            this.noteChange.emit(this.currentNote);
        }, 0);
    }

    mergeUserMentions(editor: TinyEditor): { uuid: string }[] {
        const currentMentions = this.currentNote.userMentions || [];
        const incommingMentions = this.getUserMentionsIds(editor);

        return uniqBy(currentMentions.concat(incommingMentions), 'uuid');
    }

    getUserMentionsIds(editor: TinyEditor): { uuid: string }[] {
        const userMentions: TinyMentionsUser[] = editor.mentions.getUsers();
        return userMentions.map(mention => {
            return { uuid: mention.id };
        });
    }
}
