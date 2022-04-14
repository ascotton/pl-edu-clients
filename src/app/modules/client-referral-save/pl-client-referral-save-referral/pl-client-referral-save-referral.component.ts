import { Component, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { PLSchoolYearsService } from '@common/services/';

import {
    ClinicalTalkFrequency,
    isUpdatedClinicalTalkFrequency,
    referralGradeOptions,
    referralGroupingCheckboxOptions,
    referralGroupingToCheckboxValues,
    referralGroupingFromCheckboxOptionValues,
    referralIntervalOptions,
    toClinicalTalkFrequency,
} from '@common/services/pl-client-referral';

import { Option } from '@common/interfaces';

import {
    PLConfirmDialogService,
    PLToastService,
    PLApiLanguagesService,
    PLMayService,
    PLTransformGraphQLService,
    PLGQLProviderTypesService,
    PLGraphQLService,
    PLGQLQueriesService,
    PLModalService,
    PLLodashService,
} from '@root/index';
import { PL_REFERRAL_STATE } from '@root/src/app/common/enums';

import { PLClientReferralDeleteComponent } from
    '@modules/clients/pl-client-direct-referral/pl-client-referral-delete/pl-client-referral-delete.component';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

import { CLINICAL_PRODUCT_TYPE } from '../../../common/constants/index';
import { first, tap } from 'rxjs/operators';

@Component({
    selector: 'pl-client-referral-save-referral',
    templateUrl: './pl-client-referral-save-referral.component.html',
    styleUrls: ['./pl-client-referral-save-referral.component.less'],
    inputs: ['client', 'referral', 'saving'],
})
export class PLClientReferralSaveReferralComponent {
    @Output() onChangeClient = new EventEmitter<any>();
    @Output() onSave = new EventEmitter<any>();
    @Output() onSaveAndConvert = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<any>();

    private confirmedClinicalTalkFrequency: ClinicalTalkFrequency;
    private CLINICAL_PRODUCT = CLINICAL_PRODUCT_TYPE;

    private REFERRAL_OBJ = {
        DIR_SVC: {
            value: this.CLINICAL_PRODUCT.CODE.DIR_SVC,
            label: `${this.CLINICAL_PRODUCT.NAME.TE} (Therapy, Consultation Services)`,
        },
        EVAL: {
            value: this.CLINICAL_PRODUCT.CODE.EVAL,
            label: `${this.CLINICAL_PRODUCT.NAME.EVAL} (Assessment, Screening, Records Review)`,
        },
        SV_ENABLED: {
            value: this.CLINICAL_PRODUCT.CODE.SV,
            label: this.CLINICAL_PRODUCT.NAME.SV,
            disabled: false,
        },
        SV_DISABLED: {
            value: this.CLINICAL_PRODUCT.CODE.SV,
            label: this.CLINICAL_PRODUCT.NAME.SV,
            disabled: true,
        },
        BIG_ENABLED: {
            value: this.CLINICAL_PRODUCT.CODE.BIG,
            label: this.CLINICAL_PRODUCT.NAME.BIG,
            disabled: false,
        },
        BIG_DISABLED: {
            value: this.CLINICAL_PRODUCT.CODE.BIG,
            label: this.CLINICAL_PRODUCT.NAME.BIG,
            disabled: true,
        },
        TG_ENABLED: {
            value: this.CLINICAL_PRODUCT.CODE.TG,
            label: this.CLINICAL_PRODUCT.NAME.TG,
            disabled: false,
        },
        TG_DISABLED: {
            value: this.CLINICAL_PRODUCT.CODE.TG,
            label: this.CLINICAL_PRODUCT.NAME.TG,
            disabled: true,
        },
    };
    private REFERRAL_OPTS_WITH_BIG_TG = [
        this.REFERRAL_OBJ.DIR_SVC, this.REFERRAL_OBJ.EVAL,
        this.REFERRAL_OBJ.SV_DISABLED, this.REFERRAL_OBJ.BIG_ENABLED, this.REFERRAL_OBJ.TG_ENABLED,
    ];
    private REFERRAL_OPTS_WITH_SUPERVISION = [
        this.REFERRAL_OBJ.DIR_SVC, this.REFERRAL_OBJ.EVAL,
        this.REFERRAL_OBJ.SV_ENABLED, this.REFERRAL_OBJ.BIG_DISABLED, this.REFERRAL_OBJ.TG_DISABLED,
    ];

    readonly defaultReferral: any = {
        providerType: {
            code: 'slp',
        },
        productType: {
            code: 'direct_service',
        },
        schoolYear: {
            code: null,
        },
        isScheduled: false,
    };
    readonly gradeOptions: Option[] = referralGradeOptions;
    readonly intervalOptions: Option[] = referralIntervalOptions;
    readonly referralGroupingCheckboxOptions = referralGroupingCheckboxOptions;

    GROUPING_LBL_GROUP = 'Group';
    GROUPING_LBL_INDIV_GROUP = 'Individual/Group';

    client: any = {
        primaryLanguage: {},
    };
    currentUser: User;

    errorMessage = '';
    esy: string[] = [];
    isShortTerm: string[] = [];
    ellOpts: any[] = [
        { value: 'NEVER_IDENTIFIED', label: 'Never Identified as ELL' },
        { value: 'CURRENTLY_IDENTIFIED', label: 'Currently Identified as ELL' },
        { value: 'PREVIOUSLY_IDENTIFIED', label: 'Previously Identified as ELL' },
    ];

    frequencyOpts: any[] = [
        { value: 'frequency_twice', label: '30 minutes twice a week' },
        { value: 'frequency_once', label: '60 minutes once a week' },
    ];
    frequencyTypeCode: string = null;

    grouping = {
        disabled: false,
        label: this.GROUPING_LBL_INDIV_GROUP,
    };

    isEdit = false;

    languagesOptsPrimaryRadio: any[] = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
    ];
    languagesOptsOther: any[] = [];
    languagesOptsOtherSecondary: any[] = [];
    languagesOptsSecondaryRadio: any[] = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
    ];
    loadingYears = true;

    matchingOpts: any[] = [];

    providerTypeOpts: any[] = [];
    private providerTypeOptsCodes: string[];

    referralGrouping: string[] = [];
    referral: any = { ...this.defaultReferral };
    referralForm: FormGroup = new FormGroup({});
    referralOpts: any[];

    saving = false;
    schoolYearOpts: Option[] = [];
    selectedSchoolYear: string = null;

    newNote = { text: '', userMentions: [] };
    isNoteEditing = false;
    referralLoaded = false;
    subscriptions: Record<string, Subscription> = {};

    constructor(
        store: Store<AppStore>,
        private plMay: PLMayService,
        private plToast: PLToastService,
        private plModal: PLModalService,
        private plLodash: PLLodashService,
        private plGraphQL: PLGraphQLService,
        private plGQLQueries: PLGQLQueriesService,
        private yearsService: PLSchoolYearsService,
        private plLanguages: PLApiLanguagesService,
        private confirmDialogService: PLConfirmDialogService,
        private plGQLProviderTypes: PLGQLProviderTypesService,
        private plTransformGraphQL: PLTransformGraphQLService,
    ) {
        this.subscriptions.user = store.select('currentUser').subscribe((user) => {
            this.currentUser = user;
            this.formClient(this.client);
            this.formLanguageOpts();
            this.formSelectOptsProviderTypes();
            this.formMatchingOpts();
        });

        this.subscriptions.currentSchoolYear = this.yearsService
            .getCurrentSchoolYear()
            .subscribe((currentSchoolYear: any) => {
                if (currentSchoolYear && currentSchoolYear.code) {
                    this.referral.schoolYear.code = currentSchoolYear.code;
                }
            });
        

        this.subscriptions.years = this.yearsService.getYearsData().subscribe(
            () => {
                this.loadingYears = false;
                setTimeout(() => {
                    this.schoolYearOpts = this.yearsService.getYearOptions().slice(-3).reverse();
                }, 0);
            },
        );
    }

    ngOnDestroy(){
        this.subscriptions.user.unsubscribe();
        this.subscriptions.years.unsubscribe();
        this.subscriptions.currentSchoolYear.unsubscribe();
    }

    ngOnChanges(changes: any) {
        if (changes.client) {
            this.formMatchingOpts();
            this.formClient(this.client);
        }
        if (changes.referral) {
            this.formReferral(this.referral);
            this.formMatchingOpts();

            this.updateReferralRadioGroup(this.referral.providerType.code);
            if (this.isBehaviorOrTraumaGroup()) {
                this.loadForEditReferralWhenBmhType();
            }
        }
    }

    shouldDisableProviderTypes(): boolean {
        return (
            this.referral.state === PL_REFERRAL_STATE.Matched &&
            (this.plMay.isCustomerAdmin(this.currentUser) ||
                this.plMay.isClinicalAccountManager(this.currentUser))
        );
    }

    formClient(client1: any = {}) {
        let client = this.plTransformGraphQL.fromSnakeCase(client1);
        client = Object.assign({}, { primaryLanguage: {} }, client);
        client.xBirthday = (client.birthday) ? moment(client.birthday, 'YYYY-MM-DD').format('MM/DD/YYYY') : '';

        if (!client.primaryLanguage) client.primaryLanguage = {};
        if (client.locations && client.locations.length) {
            client.location = client.locations[0].id;
        }

        this.client = client;
    }

    formLanguageOpts() {
        this.plLanguages.get().subscribe(
            (resLanguages: any) => {
                let primaryOpts = this.plLanguages.formSelectOpts(resLanguages, ['en', 'es']);
                let topOpts: any[] = [
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Spanish' },
                    { value: '', label: '--------------------' },
                ];
                this.languagesOptsOther = topOpts.concat(primaryOpts);

                let secondaryOpts = this.plLanguages.formSelectOpts(resLanguages, ['en', 'es']);
                const languagesOptsOtherSecondary = topOpts.concat(secondaryOpts);
                this.languagesOptsOtherSecondary = languagesOptsOtherSecondary;
            }
        );
    }

    formReferral(referral: any = {}) {
        this.isEdit = referral.id ? true : false;

        if (referral && referral.dueDate) {
            referral.dueDate = referral.dueDate.slice(0, 10);
        }

        if (!this.isEdit && this.currentUser && this.currentUser.xProvider) {
            referral.providerType = {...this.currentUser.xProvider.providerType};
        }

        this.referral = {
            ...this.defaultReferral,
            ...referral,
            language: {
                code: referral.language && referral.language.code ? referral.language.code : 'en',
            },
        };

        this.esy = this.referral.esy ? ['esy'] : [];
        this.isShortTerm = this.referral.isShortTerm ? ['isShortTerm'] : [];
        this.referralGrouping = referralGroupingToCheckboxValues(this.referral.grouping);
        this.confirmedClinicalTalkFrequency = this.referral.isScheduled ? toClinicalTalkFrequency(this.referral) : null;
        this.referralLoaded = true;
    }

    formSelectOptsProviderTypes() {
        this.plGQLProviderTypes
            .get()
            .pipe(tap(_ => this.setDefaultReferralProviderTypeCode()), first())
            .subscribe(() => {
                const providerTypeOpts = this.plGQLProviderTypes.formOpts(null, { labelKey: 'longName' });
                if(this.shouldDisableProviderTypes()){
                    providerTypeOpts.forEach( element => {                        
                        element.disabled = true;
                    });
                } else if (this.plMay.isProvider(this.currentUser)) {
                    // Disabling provider type options except the one matching the therapy type
                    providerTypeOpts.forEach((element: {label: string, value: string, disabled?: boolean}) => {
                        element.disabled = true;
                        this.providerTypeOptsCodes.forEach((code: string) => {
                            if (element.value === code) element.disabled = false;
                        });
                    });
                }
                this.providerTypeOpts = providerTypeOpts;
            });
    }

    formMatchingOpts() {
        if (this.currentUser.xGlobalPermissions) {
            const matchingOpts: any[] = [];
            const newClient = !this.client.id ? true : false;

            const isLead = this.plMay.isLead(this.currentUser);
            const isProvider = this.plMay.isProvider(this.currentUser);
            const mayProvideServices = this.currentUser.xGlobalPermissions.provideServices;
            const adminOrCustomer = (this.plMay.isAdminType(this.currentUser) || this.plMay.isCustomerAdmin(this.currentUser));

            // Reset.
            this.referral.matching = '';

            if (!this.isEdit) {
                this.referral.provider = '';
            }
            if (this.isEdit) {
                if (this.referral.provider && mayProvideServices) {
                    this.referral.matching = 'selfAssign';
                } else if (this.referral.state && this.referral.state === 'UNMATCHED_PL_REVIEW') {
                    this.referral.matching = 'match';
                } else {
                    this.referral.matching = 'match';
                }
            }
            if (mayProvideServices) {
                matchingOpts.push({ value: 'selfAssign', label: 'Assign to self' });
                if (!this.isEdit) {
                    this.referral.matching = 'selfAssign';
                    this.referral.provider = this.currentUser.uuid;
                }
            }
            if ((!newClient && adminOrCustomer) || isLead) {
                if (!this.isEdit && !isLead) {
                    this.referral.matching = 'match';
                }
            }
            if (isProvider || (!newClient && adminOrCustomer) || isLead) {
                matchingOpts.push({ value: 'match', label: 'Send to PresenceLearning for matching' });
            }
            if (!this.isEdit && !matchingOpts.length) {
                matchingOpts.push({ value: 'match', label: 'Send to PresenceLearning for matching' });
                this.referral.matching = 'match';
            }

            this.matchingOpts = matchingOpts;
        }
    }

    isDirectServiceOrSupervision(): boolean {
        const code = this.referral.productType.code;
        const directSvcOrSupv = code === this.CLINICAL_PRODUCT.CODE.DIR_SVC || code === this.CLINICAL_PRODUCT.CODE.SV;
        return directSvcOrSupv;
    }

    isEvaluation(): boolean {
        return this.referral.productType.code === this.CLINICAL_PRODUCT.CODE.EVAL;
    }

    /**
     * In charge of displaying certain HTML sections of this component
     */
    isBehaviorOrTraumaGroup(): boolean {
        let isBehaviorOrTrauma = false;

        if (this.referral.productType && this.referral.productType.code) {
            isBehaviorOrTrauma = (
                this.referral.productType.code === this.CLINICAL_PRODUCT.CODE.BIG ||
                this.referral.productType.code === this.CLINICAL_PRODUCT.CODE.TG
            );
        }

        return isBehaviorOrTrauma;
    }

    /**
     * Updates the selected radio button of the Behavioral product frequency.
     * This scenario applies only when editing a referral
     */
    loadForEditReferralWhenBmhType(): void {
        let freqTypeCode = null;

        if (this.referral.duration) {
            freqTypeCode = this.referral.duration === 30 ? this.frequencyOpts[0].value : this.frequencyOpts[1].value;
            this.frequencyTypeCode = freqTypeCode; // Select the radio button in the UI
        }

        this.updateFrequencyWhenBmhType(freqTypeCode);
    }

    onChangeGrouping(checkedValues: string[]) {
        this.referral.grouping = referralGroupingFromCheckboxOptionValues(checkedValues);
    }

    onChangeEsy(checkedValues: string[]) {
        this.referral.esy = checkedValues.includes('esy');
    }

    onChangeIsShortTerm(checkedValues: string[]) {
        this.referral.isShortTerm = checkedValues.includes('isShortTerm');
    }

    changeClient() {
        this.onChangeClient.emit();
    }

    validate() {
        if (this.referralForm.valid) {
            return true;
        }
        return false;
    }

    hasValidNotes() {
        if (!this.isNoteEditing || !this.referral.id) {
            return true;
        }

        this.confirmDialogService.show({
            header: 'Notes being edited',
            content: 'There are notes that have not being saved yet. Save or cancel notes editing to proceed',
            primaryLabel: 'Close',
            primaryCallback: () => {},
        });
        return false;
    }

    save() {
        if (!this.hasValidNotes()) {
            return;
        }
        if (this.validate()) {
            this.confirmClinicalTalkFrequency(
                () => this.onSave.emit({ client: this.client, referral: this.referral, note: this.newNote }),
            );
        } else {
            this.errorMessage = "Please fill out all required fields.";
        }
    }

    saveAndConvert() {
        if (!this.hasValidNotes()) {
            return;
        }
        if (this.validate()) {
            this.confirmClinicalTalkFrequency(
                () => this.onSaveAndConvert.emit({ client: this.client, referral: this.referral, note: this.newNote }),
            );
        } else {
            this.errorMessage = "Please fill out all required fields.";
        }
    }

    cancel() {
        this.onCancel.emit();
    }

    showDeleteConfirm() {
        let modalRef: any;
        const params: any = {
            referral: Object.assign({ reason: 'DUPLICATE_REFERRAL' }, this.referral),
            onDelete: (referral: { reason: string }) => {
                const variables: any = {
                    deleteReferralInput: {
                        id: this.referral.id,
                        reason: referral.reason,
                    },
                };
                const moreParams: any = {
                    updateQueries: {
                        ClientReferrals: (prev: any) => {
                            const newReferrals: any = prev.referrals;
                            const removeIndex = this.plLodash.findIndex(newReferrals.edges, 'node.id', this.referral.id);
                            if (removeIndex > -1) {
                                newReferrals.edges.splice(removeIndex);
                            }
                            return {
                                referrals: newReferrals,
                            }
                        },
                    },
                    refetchQueries: this.plGQLQueries.queryGroups.referralsAndServices,
                };
                this.plGraphQL.mutate(`mutation deleteReferral($deleteReferralInput: DeleteReferralInput!) {
                    deleteReferral(input: $deleteReferralInput) {
                        errors {
                            code
                            field
                            message
                        }
                        status
                    }
                }`, variables, {}, moreParams).subscribe(() => {
                    modalRef._component.destroy();
                    this.plToast.show('success', `Referral Deleted`, 1500, true);
                    const that = this;
                    setTimeout(() => {
                        that.cancel();
                    }, 2000);

                });
            },
            onCancel: () => {
                modalRef._component.destroy();
            },
        };

        this.plModal.create(PLClientReferralDeleteComponent, params)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }

    /**
     * Based on the selected Provider Type:
     *   - Update the Referral group options displayed in UI:
     *       If SLP or OT enable Supervision
     *       If MHP or PA enable Behavioral and Trauma
     *   - Update the radio button selected:
     *       If Supervision then to Behavioral/Trauma and viceversa
     */
    updateReferralRadioGroup(providerTypeCode: string): void {
        let referralTypeCode = null;
        const isSlpOrOT = (providerTypeCode === 'slp' || providerTypeCode === 'ot');
        const isMhpOrPa = (providerTypeCode === 'mhp' || providerTypeCode === 'pa');

        if (isSlpOrOT) { // Enable Supervision
            this.referralOpts = this.REFERRAL_OPTS_WITH_SUPERVISION;
            const isProductBehaviorOrTrauma = (
                this.referral.productType.code === this.CLINICAL_PRODUCT.CODE.BIG ||
                this.referral.productType.code === this.CLINICAL_PRODUCT.CODE.TG
            );

            if (isProductBehaviorOrTrauma) {
                this.referral.productType.code = this.CLINICAL_PRODUCT.CODE.SV; // Select Supervision radio button
            }
        } else if (isMhpOrPa) { // Enable Behavioral and TGs
            this.referralOpts = this.REFERRAL_OPTS_WITH_BIG_TG;

            if (this.referral.productType.code === this.CLINICAL_PRODUCT.CODE.SV) {
                this.updateFrequencyWhenBmhType(null); // Reseting frequency when selecting Behavioral
                this.referral.productType.code = this.CLINICAL_PRODUCT.CODE.BIG; // Select Behavioral radio button
            }

            // Helps to update the label to display and the disable of grouping.
            referralTypeCode = this.referral.productType.code;
        }

        this.updateGroupingForBmhType(referralTypeCode);
    }

    /**
     * Behavioral product displays only two fixed frequencies instead of three select boxes with different combinations
     * Therefore:
     *   Updating manually the referral object.
     *   Update made based on the fixed options.
     */
    updateFrequencyWhenBmhType(freqTypeCode: string): void {
        if (freqTypeCode) {
            const freqOne = { duration: 30, frequency: 2 };
            const freqTwo = { duration: 60, frequency: 1 };
            const frequency: any = freqTypeCode === this.frequencyOpts[0].value ? freqOne : freqTwo;

            this.referral.interval = 'weekly';
            this.referral.duration = frequency.duration;
            this.referral.frequency = frequency.frequency;
        } else {
            this.frequencyTypeCode = null;
            delete this.referral.duration;
            delete this.referral.frequency;
            delete this.referral.interval;
        }
    }

    /**
     * When isBehavior or Trauma Group:
     *   Updates the label from 'Individual/Group' to 'Group'.
     *   Select the 'Group' checkbox.
     *   Disable the 'Individual' checkbox
     * Otherwise leave the 'Individual/Group' checkbox as it is.
     */
    updateGroupingForBmhType(referralTypeCode: string): void {
        const isBehaviorOrTrauma = (
            referralTypeCode === this.CLINICAL_PRODUCT.CODE.BIG ||
            referralTypeCode === this.CLINICAL_PRODUCT.CODE.TG
        );

        if (isBehaviorOrTrauma) {
            this.onChangeGrouping(['group_only']);
            this.referralGrouping = ['group_only'];
        }

        this.grouping.disabled = isBehaviorOrTrauma;
        this.grouping.label = isBehaviorOrTrauma ? this.GROUPING_LBL_GROUP : this.GROUPING_LBL_INDIV_GROUP;
    }

    /**
     * When in the UI the user changes the Referral to Behavior or Trauma or Eval some updates must happen:
     *   Updating of title labels
     *   Selection of specific checkboxes
     *   Updating frequencies of the Referral based on the checkbox selected displayed in the UI.
     *   Reset some fields that are not relevant to Evals
     */
    updateGroupingAndFrequencyWhenBmhType(referralTypeCode: string): void {
        this.updateGroupingForBmhType(referralTypeCode);
        this.updateFrequencyWhenBmhType(this.frequencyTypeCode);
    }

    onNoteEditing(isNoteEditing: boolean) {
        this.isNoteEditing = isNoteEditing;
    }

    onNoteChange(event: any) {
        this.newNote = event;
    }

    private confirmClinicalTalkFrequency(onConfirm: () => void) {
        const clinicalTalkFrequency = toClinicalTalkFrequency(this.referral);
        const isConfirmationRequired = this.confirmedClinicalTalkFrequency &&
            isUpdatedClinicalTalkFrequency([this.confirmedClinicalTalkFrequency], clinicalTalkFrequency);

        if (isConfirmationRequired) {
            this.confirmDialogService.show({
                header: 'Changing Scheduling Information',
                content: `You are changing information that affects scheduling. Do you want to proceed with this change?`,
                primaryLabel: 'Yes',
                secondaryLabel: 'No',
                primaryCallback: onConfirm,
            });
        } else {
            onConfirm();
        }
    }


    /**
     * Sets the `providerType.code` based on the user group(s) from where the Provider belongs.
     * Sets the `productType.code` to `Evaluation` when the Provider is a School Psychologist.
     * The `providerTypeOptsCodes` helps for (ena)disabling the `Provider Type` opts later on.
     */
    private setDefaultReferralProviderTypeCode() {
        if (this.plMay.isProvider(this.currentUser) && this.currentUser && this.currentUser.groups) {
            this.providerTypeOptsCodes = this.currentUser.groups.map((userGroup: string) => {
                if (userGroup === 'SLP' || userGroup === 'OT' || userGroup === 'MHP') return userGroup.toLowerCase();
                if (userGroup === 'SP') return 'pa';
            });

            this.providerTypeOptsCodes.sort();
            this.providerTypeOptsCodes = this.providerTypeOptsCodes.filter(code => code !== undefined);
            this.defaultReferral.providerType.code = (this.providerTypeOptsCodes && this.providerTypeOptsCodes[0]) 
                ? this.providerTypeOptsCodes[0] : 'slp';
        }
    }

}
