import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import * as moment from 'moment';

import {Store} from '@ngrx/store';
import { Observable } from 'rxjs';

import { PLHttpService, PLUrlsService, PLApiEthnicitiesService, PLApiLanguagesService,
 PLApiRacesService, PLApiUsStatesService, PLTimezoneService,
 PLToastService, PLLodashService, PLGraphQLService,
 PLClientStudentDisplayService } from '@root/index';
import {AppStore} from '@app/appstore.model';
import {User} from '@modules/user/user.model';

@Component({
    selector: 'pl-client-profile-save',
    templateUrl: './pl-client-profile-save.component.html',
    styleUrls: ['./pl-client-profile-save.component.less'],
    inputs: ['languages', 'client', 'targetField'],
})
export class PLClientProfileSaveComponent {
    @Output() onSave = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<any>();

    client: any = {};
    languages: any[] = [];
    currentUser: User;
    get labelClientId(): string {
        const clientStudentCapital = PLClientStudentDisplayService.get(this.currentUser, { capitalize: true });
        return `${clientStudentCapital} ID`;
    };

    clientSaveForm: FormGroup = new FormGroup({});
    // Create a copy to prevent mutations on for canceling.
    clientEdit: any = {};

    targetField: string = null;

    savingClient: boolean = false;
    selectOptsLanguage: any[] = [];
    selectOptsContactPreference: any[] = [
        { value: 'EMAIL', label: 'Email' },
        { value: 'PHONE', label: 'Phone' },
    ];
    selectOptsGrades: any[] = [
        {label: 'Pre-K', value: '_1'},
        {label: 'K', value: 'A_0'},
        {label: '1', value: 'A_1'},
        {label: '2', value: 'A_2'},
        {label: '3', value: 'A_3'},
        {label: '4', value: 'A_4'},
        {label: '5', value: 'A_5'},
        {label: '6', value: 'A_6_1'},
        {label: '7', value: 'A_6_2'},
        {label: '8', value: 'A_6_3'},
        {label: '9', value: 'A_7_1'},
        {label: '10', value: 'A_7_2'},
        {label: '11', value: 'A_7_3'},
        {label: '12', value: 'A_7_4'},
        {label: 'Adult', value: 'A_8'},
    ];
    selectOptsSex: any[] = [
        { value: 'F', label: 'Female' },
        { value: 'M', label: 'Male' },
    ];
    recordingAllowedOpts: any[] = [
        { value: true, label: 'Permission was granted to record this student.' },
        { value: false, label: 'Permission was not granted to record this student.' },
    ];

    selectOptsStates: any[] = [];
    selectOptsTimezone: any[] = [];
    optsRaces: any[] = [];
    optsEthnicities: any[] = [];
    selectOptsTeletherapy: any[] = [
        { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
        { value: 'NOT_APPLICABLE', label: 'Not Applicable' },
    ];


    constructor(private plHttp: PLHttpService, private store: Store<AppStore>,
                private router: Router, private plEthnicities: PLApiEthnicitiesService,
                private plRaces: PLApiRacesService, private plStates: PLApiUsStatesService,
                private plLanguages: PLApiLanguagesService, private plTimezone: PLTimezoneService,
                private plToast: PLToastService, private plLodash: PLLodashService,
                private plGraphQL: PLGraphQLService) {
        store.select('currentUser')
            .subscribe((user) => {
                this.currentUser = user;
            });
    }

    ngOnInit() {
        this.loadData();
        this.formStatesOpts();
        this.formLanguageOpts();
        this.formRacesOpts();
        this.formEthnicitiesOpts();
        this.formTimezoneOpts();
        this.clientEdit = this.formatClient(this.client);
        this.clientEdit.birthDayYear = this.client.birthday.slice(0, 4);
    }

    ngOnChanges(changes: any) {
        this.clientEdit = this.formatClient(this.client);
    }

    loadData() {
        this.plEthnicities.get()
            .subscribe((res: any) => {
                this.formEthnicitiesOpts();
            });
        this.plRaces.get()
            .subscribe((res: any) => {
                this.formRacesOpts();
            });
    }

    formatClient(client: any) {
        if (!client.id) {
            return;
        }
        const clientEdit = Object.assign({}, client);
        // Backend sometimes returns with time as well so ensure date only format.
        if (clientEdit.birthday) {
            clientEdit.birthday = moment(clientEdit.birthday, 'YYYY-MM-DD').format('YYYY-MM-DD');
        }
        clientEdit.raceIds = clientEdit.races.map((race: any) => {
            return race.id;
        });
        clientEdit.ethnicityIds = clientEdit.ethnicities.map((ethnicity: any) => {
            return ethnicity.id;
        });
        // Prevent errors.
        if (!clientEdit.primaryLanguage) {
            clientEdit.primaryLanguage = {};
        }
        if (!clientEdit.secondaryLanguage) {
            clientEdit.secondaryLanguage = {};
        }
        return clientEdit;
    }

    formStatesOpts() {
        this.selectOptsStates = this.plStates.getOptsGQL();
    }

    formLanguageOpts() {
        this.selectOptsLanguage = this.plLanguages.formOpts();
    }

    formRacesOpts() {
        this.optsRaces = this.plRaces.formOpts();
    }

    formEthnicitiesOpts() {
        this.optsEthnicities = this.plEthnicities.formOpts();
    }

    formTimezoneOpts() {
        this.selectOptsTimezone = this.plTimezone.getTimezonesSelect();
    }

    save(form: any) {
        this.savingClient = true;
        let client: any = this.plLodash.pick(this.clientEdit, ['id', 'externalId', 'firstName', 'lastName',
         'birthday', 'sex', 'grade', 'street', 'city', 'state', 'postalCode', 'phone', 'email', 'contactPreference',
         'timezone', 'strategies', 'raceIds', 'ethnicityIds', 'recordingAllowed']);
        if (this.clientEdit.primaryLanguage) {
            client.primaryLanguageCode = this.clientEdit.primaryLanguage.code;
        }
        if (this.clientEdit.secondaryLanguage) {
            client.secondaryLanguageCode = this.clientEdit.secondaryLanguage.code;
        }
        if (this.clientEdit.teletherapyInformedConsent) {
            client.teletherapyInformedConsent = this.clientEdit.teletherapyInformedConsent;
        }
        client.recordingAllowed = this.clientEdit.recordingAllowed;
        const variables: any = {
            client,
        };
        this.plGraphQL.mutate(`mutation clientProfileSaveClient($client: UpdateClientInputData) {
            updateClient(input: {client: $client}) {
                errors {
                    code
                    field
                    message
                }
                status
                client {
                    id
                    firstName
                    lastName
                    externalId
                    birthday
                    primaryLanguage {
                        id
                        code
                        name
                    }
                    secondaryLanguage {
                        id
                        code
                        name
                    }
                    age
                    grade
                    gradeDisplay
                    email
                    phone
                    contactPreference
                    timezone
                    strategies
                    city
                    street
                    state
                    postalCode
                    sex
                    races {
                        edges {
                            node {
                                id
                                name
                            }
                        }
                    }
                    ethnicities {
                        edges {
                            node {
                                id
                                name
                            }
                        }
                    }
                    activeIep {
                        id
                        status
                        startDate
                        nextAnnualIepDate
                        nextEvaluationDate
                        prevEvaluationDate
                    }
                    status
                    statusDisplay
                    teletherapyInformedConsent
                    recordingAllowed
                }
            }
        }`, variables, {}).subscribe((res: any) => {
            this.plToast.show('success', 'Client saved.', 2000, true);
            this.savingClient = false;
            form.reset();
            this.clientEdit = this.formatClient(res.updateClient.client);
            this.onSave.emit();
        }, (err: any) => {
            this.savingClient = false;
        });
    }

    cancel() {
        this.onCancel.emit();
    }
};
