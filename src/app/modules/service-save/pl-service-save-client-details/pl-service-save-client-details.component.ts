import { Component, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

import { PLApiLanguagesService,
 PLClientStudentDisplayService } from '@root/index';
import { PLServiceSaveService } from '../pl-service-save.service';

@Component({
    selector: 'pl-service-save-client-details',
    templateUrl: './pl-service-save-client-details.component.html',
    styleUrls: ['./pl-service-save-client-details.component.less'],
    // inputs: ['serviceFormVals', 'isEdit', 'formCtrl', 'revalidate', 'client'],
})
export class PLServiceSaveClientDetailsComponent {
    // @Output() onChangeValid = new EventEmitter<any>();

    serviceFormVals: any;
    isEdit: boolean = false;
    formCtrl: any;
    revalidate: boolean = false;
    client: any = {};

    currentUser: User;
    get labelBilingual(): string {
        const clientStudentText = PLClientStudentDisplayService.get(this.currentUser);
        return `You have identified this ${clientStudentText} as being currently identified as ELL. ` +
         `This evaluation should evaluate the ${clientStudentText}'s abilities in both languages. ` +
         `Can you speak both of the ${clientStudentText}'s languages or use a translator for this evaluation?`;
    };

    languagesOptsPrimaryRadio: any[] = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
    ];
    languagesOptsSecondaryRadio: any[] = [
        { value: '', label: 'None' },
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
    ];
    languagesOptsOther: any[] = [];
    showCELDT: boolean = false;
    ellOpts: any[] = [
        { value: 'NEVER_IDENTIFIED', label: 'Never Identified as ELL' },
        { value: 'CURRENTLY_IDENTIFIED', label: 'Currently Identified as ELL' },
        { value: 'PREVIOUSLY_IDENTIFIED', label: 'Previously Identified as ELL' },
    ];

    bilingualOpts: any[] = [
         { value: true, label: 'Yes' },
         { value: false, label: 'No' },
     ];

    constructor(private plLanguages: PLApiLanguagesService,
     private plServiceSave: PLServiceSaveService,
     private store: Store<AppStore>) {
        store.select('currentUser')
            .subscribe((user: any) => {
                this.currentUser = user;
            });
    }

    ngOnInit() {
        this.plServiceSave.getSharedData()
            .subscribe((data: any) => {
                this.serviceFormVals = data.serviceFormVals;
                this.isEdit = data.isEdit;
                this.formCtrl = data.serviceSaveClientDetailsForm;
                this.revalidate = data.revalidateStep.clientDetails;
                this.client = data.client;
                this.init();
                this.validate();
            });
        this.formLanguageOpts();
        this.init();
        this.checkShowCELDT();
        this.validate();
    }

    ngOnChanges(changes: any) {
        this.init();
        this.validate();
        if (changes.client) {
            this.checkShowCELDT();
        }
    }

    init() {
        this.checkShowBilingual();

        // Avoid errors.
        if (!this.serviceFormVals.client.primaryLanguage) {
            this.serviceFormVals.client.primaryLanguage = {
                code: '',
            };
        }
        if (!this.serviceFormVals.client.secondaryLanguage) {
            this.serviceFormVals.client.secondaryLanguage = {
                code: '',
            };
        }
    }

    validate() {
        // Need timeout for form valid state to update.
        setTimeout(() => {
            let valid = true;
            if (!this.serviceFormVals.client.primaryLanguage ||
                !this.serviceFormVals.client.primaryLanguage.code ||
                !this.serviceFormVals.client.englishLanguageLearnerStatus) {
                valid = false;
            } else if (this.serviceFormVals.client.primaryLanguage.code.toLowerCase() !== 'en') {
                if (!this.serviceFormVals.celdt) {
                    this.serviceFormVals.celdt = {};
                }
                // CELDT optional for now.
                return true;
                // const celdtAreas = ['listening', 'speaking', 'reading', 'writing', 'comprehension'];
                // return celdtAreas.every(area => this.serviceFormVals.celdt[area]);
            }
            // this.onChangeValid.emit({ valid: valid, stepKey: 'client-details' });
            this.plServiceSave.onChangeStepValid({ valid: valid, stepKey: 'client-details' });
        }, 250);
    }

    checkShowBilingual() {
        if (this.serviceFormVals.client.englishLanguageLearnerStatus === 'CURRENTLY_IDENTIFIED') {
            this.serviceFormVals.bilingual = true;
        } else {
            // Reset value to false if not visible.
            this.serviceFormVals.bilingual = false;
        }
    }

    checkShowCELDT() {
        const state = this.client.state ? this.client.state.toLowerCase() : '';
        if (this.serviceFormVals.serviceCategory !== 'therapy' &&
         this.serviceFormVals.client.primaryLanguage &&
         this.serviceFormVals.client.primaryLanguage.code &&
         this.serviceFormVals.client.primaryLanguage.code !== 'en' &&
         (state === 'ca' || state === 'california')) {
            this.showCELDT = true;
        } else {
            // Do NOT reset values if not visible. But should check before save?
            // this.serviceFormVals.celdt = {};
            this.showCELDT = false;
        }
    }

    formLanguageOpts() {
        this.plLanguages.get()
            .subscribe((resLanguages: any) => {
                this.languagesOptsOther = this.plLanguages.formSelectOpts(resLanguages, ['en', 'es']);
            });
    }

    onChangeLanguage(evt: any) {
        this.checkShowBilingual();
        this.validate();
    }
}
