import {
    Component,
    OnInit,
    OnDestroy,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { User } from '@modules/user/user.model';
import { CurrentUserService } from '@modules/user/current-user.service';
import { PLConfirmDialogService, PLMayService } from '@root/index';

import { serviceIntervalOptions } from '@common/services/pl-client-service';
import {
    ClinicalTalkFrequency,
    toClinicalTalkFrequency,
    isUpdatedClinicalTalkFrequency,
} from '@common/services/pl-client-referral';
import { PLServiceSaveService } from '../pl-service-save.service';

import { CLINICAL_PRODUCT_TYPE } from '../../../common/constants/index';

@Component({
    selector: 'pl-service-save-identify',
    templateUrl: './pl-service-save-identify.component.html',
    styleUrls: ['./pl-service-save-identify.component.less'],
})
export class PLServiceSaveIdentifyComponent implements OnInit, OnDestroy {
    areServiceTimesRequired = false;
    serviceFormVals: any;
    referral: any = {};
    isEdit = false;
    isLoading = true;
    revalidate = false;
    serviceOpts: any[] = [];
    providerTypeName: string;

    CLINIC_PROD = CLINICAL_PRODUCT_TYPE;
    SPEECH_LANG_THERAPY_SV = 'Speech-Language Therapy Supervision';
    OT_THERAPY_SV = 'Occupational Therapy Supervision';

    bmhServiceFrequency: string = null; // The frequency of the services for Behavior and Trauma
    bmhFrequencyOptions: any[] = [
        { value: 'frequency_twice', label: '30 minutes twice a week' },
        { value: 'frequency_once', label: '60 minutes once a week' },
    ];

    currentUser: User;
    confirmedClinicalTalkFrequencies: ClinicalTalkFrequency[] = [];

    formCtrl: FormGroup = new FormGroup({});
    formCtrlDirect: FormGroup = new FormGroup({});
    formCtrlEval: FormGroup = new FormGroup({});

    evaluationTypeOpts: any[] = [
        { value: 'INITIAL', label: 'Initial' },
        { value: 'PARENT_REQUEST', label: 'Parent Request' },
        { value: 'IEP_TEAM_REQUEST', label: 'IEP Team Request' },
        { value: 'RE_EVALUATION', label: 'Re-Evaluation' },
        { value: 'TRIENNIAL', label: 'Triennial' },
        { value: 'TRANSFER', label: 'Transfer / Transition' },
        { value: 'DISMISSAL_EXIT', label: 'Dismissal / Exit' },
        // { value: 'IEE', label: 'IEE' },
    ];
    intervalOpts = serviceIntervalOptions;

    productType: string = null;
    isShortTerm: string[] = [];

    private destroy$: Subject<boolean> = new Subject<boolean>();
    private valid = false;

    constructor(
        private confirmDialogService: PLConfirmDialogService,
        private currentUserService: CurrentUserService,
        private plMayService: PLMayService,
        private plServiceSave: PLServiceSaveService,
    ) { }

    ngOnInit() {
        combineLatest([
            this.currentUserService.getCurrentUser(),
            // this might emit multiple times
            this.plServiceSave.getSharedData(),
            this.plServiceSave.getReferral(),
        ]).pipe(
            takeUntil(this.destroy$),
        )
            .subscribe(([user, data, referral]: any) => {
                this.currentUser = user;

                // Update the list of options to diplay in the Service list in the UI
                this.processServiceOptsAndUpdate(data, referral, user);
                this.isShortTerm = data.serviceFormVals.isShortTerm ? ['isShortTerm'] : [];
                this.isEdit = data.isEdit;
                this.revalidate = data.revalidateStep.identify;
                this.validate();
                this.isLoading = false;
            });

        this.plServiceSave.nextStepConfirmationRequested.pipe(
            takeUntil(this.destroy$),
        ).subscribe(() => this.confirmNextStep());
    }

    ngOnDestroy() {
        this.destroy$.next(true);

        this.destroy$.complete();
    }

    ngOnChanges() {
        this.validate();
    }

    /**
     * Toggling between BMH frequencies and any other product type frequencies
     * Frequency refers to the timing of the service that will be given
     * else checks for an edit if it's BMH product type.
     */
    bmhOrNotBmhFrequency(data: any, referral: any, user: any) {
        if (referral) {
            const isBmhProduct = (
                referral && referral.productType && (
                    referral.productType.code === this.CLINIC_PROD.CODE.BIG ||
                    referral.productType.code === this.CLINIC_PROD.CODE.TG
                )
            );

            if (isBmhProduct) {
                this.updateBmhRadioButtonSelected(referral);
            } else {
                // pl-input fields [required] input doesn't update in a straightforward way, so
                // include setting this value inside implicit isLoading guard obviates the
                // need to update the form components, since this value will not change dynamically.
                this.areServiceTimesRequired = this.plMayService.isValidatingServiceTimes(user);
            }
        } else {
            if (data.isEdit) {
                for (let index = 0; index < this.serviceOpts.length; index++) {
                    const serviceOpt = this.serviceOpts[index];
                    const behaviorId = serviceOpt.value === this.serviceFormVals.service;
                    const serviceOptLowerCase = serviceOpt.label.toLowerCase();

                    const bmhOption = (
                        serviceOptLowerCase === this.CLINIC_PROD.NAME.BIG_LOWER_CASE2 ||
                        serviceOptLowerCase === this.CLINIC_PROD.NAME.TG_LOWER_CASE2
                    );

                    if (behaviorId && bmhOption) {
                        this.productType = serviceOptLowerCase === this.CLINIC_PROD.NAME.TG_LOWER_CASE2 ?
                            this.CLINIC_PROD.CODE.TG : this.CLINIC_PROD.CODE.BIG;

                        this.areServiceTimesRequired = false;

                        this.updateBmhRadioButtonSelected({
                            duration: this.serviceFormVals.directServiceSession.duration,
                        });

                        break;
                    }
                }
            }
        }
    }

    formReferralLabel(referral: any) {
        if (referral.id) {
            referral.xLabel = `${referral.providerType.longName} - ${referral.xType} @ `
                + `${referral.xLocation} - Created ${referral.xCreated}`;
        }
        return referral;
    }

    getUpdates(data: any, referral: any, user: any) {
        const keys = [
            'confirmedClinicalTalkFrequencies',
            'serviceFormVals',
            'serviceOpts',
            'referral',
            'providerTypeName',
        ];

        keys.forEach((key: string) => {
            if (data[key]) {
                this[key] = data[key];
            }
        });

        this.formReferralLabel(this.referral);

        // Toggles between frequencies for Behavioral or other types of products
        this.bmhOrNotBmhFrequency(data, referral, user);
    }

    /**
     * In charge of displaying certain HTML sections of this component
     */
    isBehaviorOrTraumaGroup(): boolean {
        const isBehaviorOrTrauma = (
            this.productType === this.CLINIC_PROD.CODE.BIG ||
            this.productType === this.CLINIC_PROD.CODE.TG
        );

        return isBehaviorOrTrauma;
    }

    onChangeServiceWrapper(evt: any) {
        const params = Object.assign({}, {
            stepValid: this.valid,
            stepKey: 'identify',
        }, evt);
        this.plServiceSave.onChangeService(params)
            .subscribe((data: any) => {
                this.getUpdates(data, null, null);
                this.validate();
            });
    }

    onChangeEvalTypeWrapper(evt: any) {
        this.plServiceSave.onChangeEvalType(evt);
        this.validate();
    }

    onChangeIsShortTerm(evt: any) {
        this.serviceFormVals.isShortTerm = evt.includes('isShortTerm');
    }

    /**
     * In the future this functionality will be overriden (or removed) since the BE will handle this
     * For now the direction from business was to hard code the 'Service' drop-down options in the FE
     *
     * When the Product Type is Supervision, Trauma or Big; display only these options in the Service list.
     * When the Product Type is anything else; remove Supervision, Truma or Big accordingly from the Service list
     *
     * @param data Where the Service options are.
     * @param referral Where the Product Type code is; either supervision, trauma, big, or any other.
     */
    // TODO: Refactor this function for better readability once this hotfix is merged back to Dev
    processServiceOptsAndUpdate(data: any, referral: any, user: any): void {
        if (data) {
            if (referral && referral.productType) { // Means that we are converting a Referral to a Service
                this.productType = referral.productType.code; // Assignation needed for other places in this class

                const isDirSvcProductType = referral.productType.code === this.CLINIC_PROD.CODE.DIR_SVC;

                const svIndex = data.serviceOpts.findIndex((option: string) => {
                    return option['label'] === this.CLINIC_PROD.NAME.SV;
                });
                const behaviorIndex = data.serviceOpts.findIndex((option: string) => {
                    return option['label'] === this.CLINIC_PROD.NAME.BIG;
                });
                const traumaIndex = data.serviceOpts.findIndex((option: string) => {
                    return option['label'] === this.CLINIC_PROD.NAME.TG;
                });

                if (isDirSvcProductType) {
                    data.serviceOpts = data.serviceOpts.filter((opt: {label: string, value: string}) => {
                        return (opt.label !== this.SPEECH_LANG_THERAPY_SV && opt.label !== this.OT_THERAPY_SV);
                    });

                    if (svIndex >= 0 || behaviorIndex >= 0) {
                        const startIndex = svIndex >= behaviorIndex ? svIndex : behaviorIndex;
                        const endIndex = traumaIndex > 1 ? traumaIndex : 1; // For removing Trauma

                        data.serviceOpts.splice(startIndex, endIndex);
                        data.serviceOpts = data.serviceOpts;
                    }
                } else {
                    const isSvProductType       = referral.productType.code === this.CLINIC_PROD.CODE.SV;
                    const isBehaviorProductType = referral.productType.code === this.CLINIC_PROD.CODE.BIG;
                    const isTraumaProductType   = referral.productType.code === this.CLINIC_PROD.CODE.TG;

                    const therapySvIndex = data.serviceOpts.findIndex((option: string) => {
                        return (
                            option['label'] === this.SPEECH_LANG_THERAPY_SV ||
                            option['label'] === this.OT_THERAPY_SV
                        );
                    });

                    if (isSvProductType && therapySvIndex >= 0) {
                        data.serviceOpts = [data.serviceOpts[therapySvIndex]];
                    } else if (isSvProductType && svIndex >= 0) {
                        data.serviceOpts = [data.serviceOpts[svIndex]];
                    } else if (isBehaviorProductType && behaviorIndex >= 0) {
                        data.serviceOpts = [data.serviceOpts[behaviorIndex]];
                    } else if (isTraumaProductType && traumaIndex >= 0) {
                        data.serviceOpts = [data.serviceOpts[traumaIndex]];
                    }
                }
            }

            this.getUpdates(data, referral, user);
            this.displayDefaultServiceOption(this.serviceOpts);
        }
    }

    private confirmNextStep(): void {
        const confirmStep = () => this.plServiceSave.confirmNextStep({ currentStepKey: 'identify' });

        const clinicalTalkFrequency = toClinicalTalkFrequency(this.serviceFormVals.directServiceSession);

        const isConfirmationRequired = isUpdatedClinicalTalkFrequency(
            this.confirmedClinicalTalkFrequencies,
            clinicalTalkFrequency,
        );

        if (isConfirmationRequired) {
            this.confirmDialogService.show({
                header: 'Changing Scheduling Information',
                content: `You are changing information that affects scheduling. Do you want to proceed with this change?`,
                primaryLabel: 'Yes',
                secondaryLabel: 'No',
                primaryCallback: () => {
                    // Add the current frequency values to the list of confirmed values. If the
                    // user returns to this step before saving the service, only force another
                    // confirmation if the newest form values differ from those confirmed previously.
                    this.confirmedClinicalTalkFrequencies.push(clinicalTalkFrequency);

                    confirmStep();
                },
            });
        } else {
            confirmStep();
        }
    }

    /**
     * When the list of Services is only one; display by default that Service in the UI
     * Calls automatically the function that'd 've been manually called by the user selecting the Service
     *
     * @param serviceOptions The list of Services displayed as options
     */
    displayDefaultServiceOption(serviceOptions: any[]): void {
        if (serviceOptions.length === 1) {
            this.serviceFormVals.service = serviceOptions[0].value;
            this.onChangeServiceWrapper({
                model: this.serviceFormVals.service,
                oldVal: '',
            });
        }
    }

    /**
     * Updates the selected radio button of the Behavioral/Trauma product frequency.
     */
    updateBmhRadioButtonSelected(referral: any): void {
        let freqTypeCode: any = null;

        if (referral.duration) {
            freqTypeCode = referral.duration === 30 ?
                this.bmhFrequencyOptions[0].value :
                this.bmhFrequencyOptions[1].value;

            this.bmhServiceFrequency = freqTypeCode; // Select the radio button in the UI
        }

        this.updateFrequencyWhenBmhType(freqTypeCode);
    }

    /**
     * Updating manually the referral object.
     * Manually updated 'cause in this scenario instead of three select boxes there are two radio buttons.
     * Update made based on fixed options that hold the values of the select boxes for Duration, Frequency and Interval.
     */
    updateFrequencyWhenBmhType(freqTypeCode: string): void {
        if (freqTypeCode) {
            const freqOne = { duration: 30, frequency: 2 };
            const freqTwo = { duration: 60, frequency: 1 };
            const frequency: any = freqTypeCode === this.bmhFrequencyOptions[0].value ? freqOne : freqTwo;

            this.serviceFormVals.directServiceSession.interval = 'weekly';
            this.serviceFormVals.directServiceSession.duration = frequency.duration;
            this.serviceFormVals.directServiceSession.frequency = frequency.frequency;
        } else {
            this.bmhServiceFrequency = null;

            if (this.serviceFormVals && this.serviceFormVals.directServiceSession) {
                delete this.serviceFormVals.directServiceSession.duration;
                delete this.serviceFormVals.directServiceSession.frequency;
                delete this.serviceFormVals.directServiceSession.interval;
            }
        }
    }

    validate() {
        // Need timeout for form valid state to update.
        setTimeout(() => {
            let valid = false;
            // Disabled fields make form invalid.. Need to fix form inputs to use .valid on form.
            if (this.serviceFormVals.service) {
                valid = true;
                if (this.serviceFormVals.serviceCategory === 'evaluation_with_assessment') {
                    if (!this.formCtrlEval.valid) {
                        valid = false;
                    }
                } else if (this.serviceFormVals.serviceCategory === 'therapy') {
                    if (!this.formCtrlDirect.valid) {
                        valid = false;
                    }
                    if (this.serviceFormVals.directServiceSession.endDate &&
                        this.serviceFormVals.directServiceSession.startDate &&
                        this.serviceFormVals.directServiceSession.endDate <=
                        this.serviceFormVals.directServiceSession.startDate) {
                        valid = false;
                    }
                }
            }

            this.valid = valid;
            this.plServiceSave.onChangeStepValid({ valid, stepKey: 'identify' });
        }, 250);
    }
}
