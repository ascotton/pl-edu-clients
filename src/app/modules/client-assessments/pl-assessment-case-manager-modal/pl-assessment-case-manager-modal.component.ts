import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fadeInOnEnterAnimation } from 'angular-animations';

@Component({
    selector: 'pl-assessment-case-manager-modal',
    templateUrl: './pl-assessment-case-manager-modal.component.html',
    styleUrls: ['./pl-assessment-case-manager-modal.component.less'],
    animations: [
        fadeInOnEnterAnimation({ anchor: 'animateIn', duration: 1000 }),
    ],
})
export class PLAssessmentCaseManagerModalComponent implements OnInit {
    @Output() contactSave = new EventEmitter<any>();

    client: string;
    contact: any;
    contactRef: any;
    contactTypes: any[];
    languages: any[];

    constructor(
        private dialogRef: MatDialogRef<PLAssessmentCaseManagerModalComponent>,
        @Inject(MAT_DIALOG_DATA) public modalInput: {
            client: string,
            contact: any,
            contactTypes: any[],
            languages: any[]
        },
    ) { }

    ngOnInit(): void {
        const { client, contact, contactTypes, languages } = this.modalInput;
        this.client = client;
        this.contact = contact ? { ...contact } : { is_responsible_party: true };
        this.contactTypes = contactTypes.filter((contactType: any) => contactType.name === 'Case Manager');
        this.languages = languages;
    }

    onClickCloseButton(): void {
        this.dialogRef.close();
    }

    onSaveContact(event: any): void {
        this.contact = event;
        this.dialogRef.close({ save: this.contact });
    }

    onDeleteContact(event: any): void {
        this.dialogRef.close({ delete: this.contact });
    }
}
