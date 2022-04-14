import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Store } from '@ngrx/store';

import * as moment from 'moment';

import {
    PLHttpService,
    PLUrlsService,
    PLToastService,
    PLApiContactTypesService,
    PLApiLanguagesService,
    PLMayService,
    PLConfirmDialogService,
} from '@root/index';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLClientContactsService } from '../pl-client-contacts.service';

@Component({
    selector: 'pl-client-contacts',
    templateUrl: './pl-client-contacts.component.html',
    styleUrls: ['./pl-client-contacts.component.less'],
})
export class PLClientContactsComponent {
    @Output() readonly editing: EventEmitter<any> = new EventEmitter();
    @Input() client: any = {};

    loading = false;
    currentUser: User;

    contacts: any[] = [];
    dataInfo: any = {
        count: 0,
        queryId: '',
    };

    contactTypes: any[] = [];
    languages: any[] = [];
    contactSave: any = {};
    saveContactVisible = false;

    mayAddContact = false;
    private mayEditContact = false;
    isHomeworkAppEnabled = false;

    constructor(
        private plHttp: PLHttpService,
        private plUrls: PLUrlsService,
        private store: Store<AppStore>,
        private plClientContactsService: PLClientContactsService,
        private plToast: PLToastService,
        private plLanguages: PLApiLanguagesService,
        private plContactTypes: PLApiContactTypesService,
        private plMay: PLMayService,
        private plConfirm: PLConfirmDialogService,
    ) {
        store.select('currentUser')
            .subscribe((user: any) => {
                this.currentUser = user;
                this.checkPrivileges();
            });
    }

    ngOnInit() {
        this.getContactTypes();
        this.getLanguages();
        this.getContacts();
    }

    ngOnChanges(changes: any) {
        if (
            changes.client && (
                changes.client.firstChange || (
                    changes.client.currentValue && changes.client.previousValue && (
                        this.client &&
                        this.client.id &&
                        changes.client.currentValue.id !== changes.client.previousValue.id
                    )
                )
            )) {
            this.checkPrivileges();
            this.getContacts(true);
        }
    }

    checkPrivileges() {
        if (this.currentUser && this.client) {
            this.mayAddContact = this.plMay.addContact(this.currentUser, this.client);
            this.mayEditContact = this.plMay.editContact(this.currentUser, this.client);
            this.isHomeworkAppEnabled = this.currentUser.xEnabledUiFlags.includes('homework-app');
        }
    }

    toggleSaveContactVisible() {
        this.saveContactVisible = !this.saveContactVisible;
        if (!this.saveContactVisible) {
            this.contactSave = null;
            this.editing.emit(false);
        } else {
            this.editing.emit(true);
        }
    }

    getContactTypes() {
        this.plContactTypes.get()
            .subscribe((res: any) => {
                this.contactTypes = res;
            });
    }

    getLanguages() {
        this.plLanguages.get()
            .subscribe((res: any) => {
                this.languages = res;
            });
    }

    getContacts(reQuery: boolean = false) {
        if (this.client.id) {
            this.plClientContactsService.getClientContacts(this.client.id, {}, reQuery).subscribe((res: any) => {
                this.contacts = res.results ? res.results : [];
                this.dataInfo.count = res.count;

                this.contacts.forEach((c: any) => {
                    if (c.sms_requested_on) {
                        c.sms_requested_on = moment(c.sms_requested_on).format('MM/DD/YYYY');
                    }
                    if (c.sms_enabled_on) {
                        c.sms_enabled_on = moment(c.sms_enabled_on).format('MM/DD/YYYY');
                    }
                    if (c.login_requested_on) {
                        c.login_requested_on = moment(c.login_requested_on).format('MM/DD/YYYY');
                    }
                    if (c.login_enabled_on) {
                        c.login_enabled_on = moment(c.login_enabled_on).format('MM/DD/YYYY');
                    }
                });
            });
        }
    }

    getContactTypesDisplay(contact: any = {}) {
        if (contact.is_emergency) {
            if (contact.is_responsible_party) {
                return 'Emergency Contact & Learning Coach';
            }
            return 'Emergency Contact';
        }

        if (contact.is_responsible_party) {
            return 'Learning Coach';
        }

        return '';
    }

    onContactClick(contact: any = {}) {
        this.contactSave = { ...contact };
        this.toggleSaveContactVisible();
    }

    addContact() {
        this.contactSave = {};
        this.toggleSaveContactVisible();
    }

    onSaveContact() {
        this.getContacts(true);
        this.contactSave = null;
        this.toggleSaveContactVisible();
    }

    onClickSendSMSEnableEmail(contact: any) {
        this.plConfirm.show({
            header: 'Request SMS Consent',
            content: `Do you want to send an email to ${contact.first_name} to request SMS consent?`,
            primaryLabel: 'Yes',
            secondaryLabel: 'No',
            primaryCallback: () => {
                this.loading = true;
                const url = `${this.plUrls.urls.contacts}${contact.uuid}/request_sms/`;
                this.plHttp.save(null, { }, url)
                    .subscribe((res: any) => {
                        this.loading = false;
                        contact.sms_requested_on = moment().format('MM/DD/YYYY');
                        this.plToast.show('success', 'Request sent!', -1, true);
                    });
            },
            secondaryCallback: () => { },
            closeCallback: () => { },
        });
    }

    isValidPhoneNumber(phone: any) {
        if (!phone) return false;

        return (phone.replace(/\D/g, '').length === 10);
    }

    onClickSendLoginEnableEmail(contact: any) {
        this.plConfirm.show({
            header: 'Request Account Login',
            content: `Do you want to send an email to ${contact.first_name} to set up PL App access for this student?`,
            primaryLabel: 'Yes',
            secondaryLabel: 'No',
            primaryCallback: () => {
                this.loading = true;
                const url = `${this.plUrls.urls.contacts}${contact.uuid}/request_login/`;
                this.plHttp.save(null, { }, url)
                    .subscribe((res: any) => {
                        this.loading = false;
                        contact.login_requested_on = moment().format('MM/DD/YYYY');
                        this.plToast.show('success', 'Request sent!', -1, true);
                    });
            },
            secondaryCallback: () => { },
            closeCallback: () => { },
        });
    }
}
