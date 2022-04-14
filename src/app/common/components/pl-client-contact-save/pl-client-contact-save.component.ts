import { Component, Output, EventEmitter, Input } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';

import {Store} from '@ngrx/store';
import { Observable } from 'rxjs';

import {
      PLHttpService,
      PLToastService,
      PLApiContactTypesService,
      PLApiLanguagesService,
      PLApiUsStatesService,
      PLFormService,
} from '@root/index';
import {AppStore} from '@app/appstore.model';
import {User} from '@modules/user/user.model';

@Component({
    selector: 'pl-client-contact-save',
    templateUrl: './pl-client-contact-save.component.html',
    styleUrls: ['./pl-client-contact-save.component.less'],
})
export class PLClientContactSaveComponent {
    @Output() onSave = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<any>();
    @Output() onDelete = new EventEmitter<any>();

    @Input() client: any = {};
    @Input() contact: any = {};
    @Input() contactTypes: any[] = [];
    @Input() languages: any[] = [];
    @Input() showToastOnSave = true;

    private readonly contactEmergencyContactValue = 'emergency_contact';
    private readonly contactLearningCoachValue = 'learning_coach';
    contactRelationship: any[] = [];
    contactRelationshipOpts: any[] = [
        { value: this.contactEmergencyContactValue, label: 'Emergency Contact' },
        { value: this.contactLearningCoachValue, label: 'Learning Coach' },
    ];

    user: User;
    selectOptsStates: any[] = [];

    contactSaveForm: FormGroup = new FormGroup({});
    savingContact: boolean = false;
    selectOptsRelationship: any[] = [];
    selectOptsLanguage: any[] = [];
    selectOptsContactPreference: any[] = [
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' },
    ];

    constructor(private plHttp: PLHttpService, private store: Store<AppStore>,
     private plToast: PLToastService,
     private plContactTypes: PLApiContactTypesService,
     private plLanguages: PLApiLanguagesService,
     private plStates: PLApiUsStatesService) {
        store.select('currentUser')
            .subscribe((user) => {
                this.user = user;
            });
    }

    getContactRelationship(): any[] {
        let arr = [];

        if(this.contact.is_emergency) {
            arr.push(this.contactEmergencyContactValue);
        }

        if(this.contact.is_responsible_party) {
            arr.push(this.contactLearningCoachValue);
        }

        return arr;
    }

    ngOnInit() {
        this.formLanguageOpts();
        this.formContactTypeOpts();
        this.formStatesOpts();
    }

    ngOnChanges(changes: any) {
        if (changes.languages) {
            this.formLanguageOpts();
        } else if (changes.contactTypes) {
            this.formContactTypeOpts();
        }

        this.contactRelationship = this.getContactRelationship();
    }

    formStatesOpts() {
        this.selectOptsStates = this.plStates.getOptsGQL();
    }

    formContactTypeOpts() {
        const contactTypes = this.contactTypes.length ? this.contactTypes : null;
        this.selectOptsRelationship = this.plContactTypes.formOpts(contactTypes);
        if (contactTypes.length === 1) {
            this.contact.contact_type = contactTypes[0].uuid;
        }
    }

    formLanguageOpts() {
        this.selectOptsLanguage = this.plLanguages.formOpts();
    }

    private saveParams() {
        return Object.assign({}, this.contact, {
            client: this.client.id,
            is_emergency: this.contactRelationship.includes(this.contactEmergencyContactValue),
            is_responsible_party: this.contactRelationship.includes(this.contactLearningCoachValue),
        });
    }

    save(form: any) {
        PLFormService.markAllAsTouched(form);

        if (form.valid) {
            this.savingContact = true;

            this.plHttp.save('contacts', this.saveParams())
                .subscribe((res: any) => {
                    if (this.showToastOnSave) {
                        this.plToast.show('success', 'Contact saved.', -1, true);
                    }
                    this.savingContact = false;
                    form.reset();
                    this.onSave.emit(res);
                }, (err: any) => {
                    this.savingContact = false;
                });
        }
    }

    cancel(form: any) {
        this.onCancel.emit();
    }

    delete(form: any) {
        this.savingContact = true;
        const params = {
            uuid: this.contact.uuid,
        };
        this.plHttp.delete('contacts', params)
            .subscribe((res: any) => {
                if (this.showToastOnSave) {
                    this.plToast.show('success', 'Contact removed.', 2000, true);
                }
                this.savingContact = false;
                form.reset();
                this.onDelete.emit();
            }, (err: any) => {
                this.savingContact = false;
            });
    }
};
