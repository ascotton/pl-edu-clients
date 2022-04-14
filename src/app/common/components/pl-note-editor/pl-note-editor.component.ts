import { Component, EventEmitter, Input, Output } from '@angular/core';
import { environment } from '@root/src/environments/environment';

export interface TinyConfig {
    height: number;
    menubar: boolean;
    plugins: string[] | string;
    toolbar: string;
    statusbar: boolean;
    mentions_fetch?: Function;
    auto_focus?: boolean;
}

export interface TinyMentionsUser {
    id: string;
    username: string;
    name: string;
    fullName: string;
}

export interface TinyEditor {
    text: string;
    mentions?: { getUsers() };
}

@Component({
    selector: 'pl-note-editor',
    templateUrl: './pl-note-editor.component.html',
})
export class PLNoteEditorComponent {
    @Input() editor: TinyEditor = { text: '' };
    @Input() mentionableUsers: TinyMentionsUser[] = [];

    @Output() editorChange = new EventEmitter<TinyEditor>();

    TINY_MCE_KEY = environment.TINY_MCE_KEY;
    tinyConfiguration: TinyConfig = {
        height: 180,
        menubar: false,
        plugins: 'paste lists link mentions',
        toolbar: 'formatselect | bold italic underline | numlist bullist link | outdent indent',
        statusbar: false,
        mentions_fetch: (query, success) => {
            let usersMatch: TinyMentionsUser[] = [];
            usersMatch = this.mentionableUsers.filter((user: TinyMentionsUser) => {
              return user.name.toLowerCase().indexOf(query.term.toLowerCase()) > -1;
            });
            window.setTimeout(function () {
              success(usersMatch);
            }, 0);
        },
        auto_focus: true
    };

    onEditorInit(event: any) {
        this.editor.mentions = event.editor.plugins.mentions;
    }

    onEditorChange(event: any) {
        this.editorChange.emit(this.editor);
    }
}
