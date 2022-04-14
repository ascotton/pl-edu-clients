import { Component, Output, EventEmitter, OnInit, OnDestroy, OnChanges, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as moment from 'moment';
import { Store } from '@ngrx/store';

import { PLApiLanguagesService, PLMayService } from '@root/index';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLClientContactsService } from "../pl-client-contacts.service";

@Component({
    selector: 'pl-client-profile',
    templateUrl: './pl-client-profile.component.html',
    styleUrls: ['./pl-client-profile.component.less'],
    inputs: ['client'],
})
export class PLClientProfileComponent  implements OnInit, OnDestroy, OnChanges {
    @Output() onReQueryClient = new EventEmitter<any>();
    @Output() editing: EventEmitter<any> = new EventEmitter();

    client: any = {};
    currentUser: User;
    editTarget: string = null;

    saveProfileVisible: boolean = false;
    scheduleEdit = false;
    displayData: any[] = [];
    private languages: any[] = [];

    mayEditClient: boolean = false;

    private routeParamsSub: any;

    setupUrl: string = "";

    constructor(private store: Store<AppStore>,
                private router: Router,
                private plLanguages: PLApiLanguagesService, private plMay: PLMayService,
                private route: ActivatedRoute, private plClientContactsService: PLClientContactsService,
                private myElement: ElementRef) {
        store.select('currentUser')
            .subscribe((user) => {
                this.currentUser = user;
                this.checkPrivileges();
                if (this.currentUser.uuid && this.scheduleEdit) {
                    this.startEdit();
                }
            });

        this.routeParamsSub = this.route.params.subscribe( (params) => {
            if (params.mode && params.mode === 'edit') {
                if (this.currentUser.uuid) {
                    this.startEdit();
                } else {
                    this.scheduleEdit = true;
                }
                this.editTarget = params.target;
            }
        });
    }

    startEdit() {
        setTimeout( () => {
            this.toggleSaveProfileVisible();
        }, 1);
        try {
            setTimeout( () => {
                this.myElement.nativeElement.scrollIntoView();
            }, 500);
        } catch (err) {
            console.log('failed to scroll to editor: ', err);
        }
    }

    ngOnInit() {
        this.formDisplayFields();
        this.getLanguages();
    }

    ngOnChanges(changes: any) {
        if (changes.client) {
            this.checkPrivileges();
            this.formDisplayFields();
        }
    }

    ngOnDestroy() {
        this.routeParamsSub.unsubscribe();
    }

    checkPrivileges() {
        if (this.currentUser && this.client) {
            this.mayEditClient = this.plMay.editClient(this.currentUser, this.client);
        }
    }

    getLanguages() {
        this.plLanguages.get()
            .subscribe((res: any) => {
                this.languages = res;
            });
    }

    toggleSaveProfileVisible() {
        this.saveProfileVisible = !this.saveProfileVisible;
        if (!this.saveProfileVisible) {
            this.editing.emit(false);
        } else {
            this.editing.emit(true);
        }
    }

    formDisplayFields() {
        const client = this.client;
        if (client) {
            this.plClientContactsService.getClientContacts(this.client.id).subscribe( (contacts) => {
                if (contacts) {
                    for (let contact of contacts['results']) {
                        if (contact.computer_setup_url) {
                            this.setupUrl = contact.computer_setup_url;
                            break;
                        }
                    }
                }
                this.displayData = [
                    {  header: "Details",
                        data : [
                            { value: (client.birthday ? moment(client.birthday, 'YYYY-MM-DD').format('MM/DD/YYYY') : ''),
                                label: 'Birth Date' },
                            { value: client.age, label: 'Age' },
                            { value: client.gradeDisplay, label: 'Grade' },
                            { value: this.formSex(client), label: 'Sex' },
                            { value: (client.primaryLanguage) ? client.primaryLanguage.name : '',
                                label: 'Primary Language' },
                            { value: (client.secondaryLanguage) ? client.secondaryLanguage.name : '',
                                label: 'Secondary Language' },
                            { value: this.formRaces(client), label: 'Race' },
                            { value: this.formEthnicities(client), label: 'Ethnicity' },
                        ]
                    },
                    {  header: "Contact",
                        data : [
                            { value: this.formAddress(client), label: 'Address' },
                            { value: client.email, label: 'Email' },
                            { value: client.phone, label: 'Phone'},
                            { value: (client.contactPreference ? client.contactPreference.toLowerCase() : ''),
                                label: 'Contact Preference' },
                            { value: client.timezone, label: 'Time Zone' },
                        ]
                    },
                    {  header: "Additional Information",
                        data : [
                            { value: this.setupUrl, label: 'Computer Setup URL' },
                            { value: this.formTechCheckStatus(client, contacts), label: 'Tech Check Status' },
                            { value: client._teletherapyDisplay, label: 'Teletherapy Informed Consent',
                                key: 'teletherapyInformedConsent' },
                            { value: client._recordingConsentDisplay, label: 'Recording Consent',
                                key: 'recordingConsent' },
                            { value: client.strategies, label: 'Strategies' },
                            ]
                    },
                ];
            });
        }
    }

    formAddress(client: any) {
        if (client.street && client.city) {
            return `${client.street}, ${client.city}, ${client.state} ${client.postalCode}`;
        }
        return '';
    }

    formSex(client: any) {
        const sexMap = { F: 'female', M: 'male' };
        if (client.sex && sexMap[client.sex]) {
            return sexMap[client.sex];
        }
        return '';
    }

    formRaces(client: any) {
        const races: string[] = [];
        if (client.races) {
            client.races.forEach((race: any) => {
                races.push(race.name);
            });
        }
        return races.join(', ');
    }

    formEthnicities(client: any) {
        const ethnicities: string[] = [];
        if (client.ethnicities) {
            client.ethnicities.forEach((ethnicity: any) => {
                ethnicities.push(ethnicity.name);
            });
        }
        return ethnicities.join(', ');
    }

    formTechCheckStatus(client: any, contacts: any) {
        if (client.locations && client.locations[0].locationType === 'VIRTUAL') {
            return contacts && contacts['results'].length > 0 ? contacts['results'][0].tech_check_status : null;
        }
        return client.locations && client.locations.length > 0 ? client.locations[0].techCheckStatus : null;
    }

    onSaveClient() {
        this.onReQueryClient.emit();
        this.toggleSaveProfileVisible();
        this.router.navigate(['/client/' + this.client.id + '/details']);
    }

    onCancelSaveClient() {
        this.toggleSaveProfileVisible();
        this.router.navigate(['/client/' + this.client.id + '/details']);
    }
}
