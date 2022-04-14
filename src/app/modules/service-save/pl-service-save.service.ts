import { EventEmitter, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { Observable } from 'rxjs';
import * as moment from 'moment';

import {
    PLHttpService,
    PLUrlsService,
    PLLodashService,
    PLApiClientServicesService,
    PLGQLClientServiceService,
    PLApiServiceDocumentsService,
    PLBrowserService,
    PLGraphQLService,
    PLGQLReferralsService,
    PLGQLProviderTypesService,
    PLGQLServicesService,
    PLGQLClientsService,
    PLGQLStringsService,
    PLGQLQueriesService,
    PLClientStudentDisplayService,
} from '@root/index';
import { User } from '../user/user.model';
import { CurrentUserService } from '../user/current-user.service';
import { ClinicalTalkFrequency, referralProductTypeMap, toClinicalTalkFrequency } from '@common/services/pl-client-referral';

import { CLINICAL_PRODUCT_TYPE } from '../../common/constants/index';
import { PLClearClients } from '../schedule/store/clients';

@Injectable()
export class PLServiceSaveService {
    client: any = {};
    clientService: any = {};
    referral: any = {};

    nextStepConfirmed = new EventEmitter<{ nextIndex: number }>();
    nextStepConfirmationRequested = new EventEmitter<any>();

    private serviceSaveDocumentationForm: FormGroup = new FormGroup({});
    private serviceSaveClientDetailsForm: FormGroup = new FormGroup({});
    private serviceSaveServiceDetailsForm: FormGroup = new FormGroup({});
    private serviceSaveAssignForm: FormGroup = new FormGroup({});

    // private clientServiceSave: any = null;
    clientId = '';
    serviceId = '';
    referralId = '';
    backDefault = 0;
    private view = '';
    private currentUser: User = null;
    private userProvider: any = {};
    private confirmedClinicalTalkFrequencies: ClinicalTalkFrequency[] = [];
    private steps: any[] = [];
    private serviceFormVals: any = {
        documents: {
            schoolConsentExistingFiles: [],
            parentConsentExistingFiles: [],
            recordingConsentExistingFiles: [],
        },
        client: {},
        celdt: {},
        bilingual: false,
        owner: '',
        directServiceSession: {},
        evaluationStage: '',
        meetingDate: '',
        assessmentPlanSignedOn: '',
    };
    private services: any = [];
    private serviceOpts: any = [];
    private providerTypesOpts: any = [];
    private documentTypes: any;
    isEdit = false;
    loaded: any = {
        currentUser: false,
        routeParams: false,
        client: false,
        // service: false,
        clientService: false,
        referral: false,
        providerTypes: false,
        services: false,
        documentTypes: false,
    };
    routeParams: any;
    private showDocs: any = {};
    private revalidateStep: any = {
        identify: false,
        docuemntation: false,
        clientDetails: false,
        serviceDetails: false,
        assign: false,
    };
    private stepsKeyMap = { identify: 'identify', documentation: 'documentation',
        'client-details': 'clientDetails', 'service-details': 'serviceDetails',
        assign: 'assign' };

    private providerTypes: any[] = [];
    private providerTypeName: string;

    private stepsUpdateObserver: any;
    private sharedDataObserver: any;

    private inited = false;
    recordingConsentExistingFiles: any[];

    CLINICAL_PRODUCT = CLINICAL_PRODUCT_TYPE;

    constructor(
        private route: ActivatedRoute,
        private plHttp: PLHttpService,
        private plUrls: PLUrlsService,
        private router: Router,
        private store: Store<AppStore>,
        private plLodash: PLLodashService,
        private plApiClientServices: PLApiClientServicesService,
        private plGQLClientService: PLGQLClientServiceService,
        private plApiServiceDocuments: PLApiServiceDocumentsService,
        private plBrowser: PLBrowserService,
        private plCurrentUser: CurrentUserService,
        private plGraphQL: PLGraphQLService,
        private plGQLReferrals: PLGQLReferralsService,
        private plGQLProviderTypes: PLGQLProviderTypesService,
        private plGQLServices: PLGQLServicesService,
        private plGQLClients: PLGQLClientsService,
        private plGQLStrings: PLGQLStringsService,
        private plGQLQueries: PLGQLQueriesService,
    ) {
        this.reset();
    }

    getSharedData() {
        return new Observable((observer: any) => {
            this.sharedDataObserver = observer;
            // if (this.plLodash.allTrue(this.loaded)) {
            this.updateSharedData();
            // }
        });
    }

    updateSharedData(data1: any = {}) {
        if (this.sharedDataObserver) {
            const dataDefault = {};
            const keys = [
                'serviceFormVals',
                'isEdit',
                'serviceSaveDocumentationForm',
                'serviceSaveClientDetailsForm',
                'serviceSaveServiceDetailsForm',
                'serviceSaveAssignForm',
                'revalidateStep',
                'serviceOpts',
                'client',
                'currentUser',
                'showDocs',
                'referral',
                'providerTypeName',
                'confirmedClinicalTalkFrequencies',
            ];
            keys.forEach((key: any) => {
                dataDefault[key] = this[key];
            });
            const data = Object.assign({}, dataDefault, data1);
            this.sharedDataObserver.next(data);
        }
    }

    reset() {
        this.client = {};
        this.clientService = {};
        this.referral = {};

        this.serviceSaveDocumentationForm = new FormGroup({});
        this.serviceSaveClientDetailsForm = new FormGroup({});
        this.serviceSaveServiceDetailsForm = new FormGroup({});
        this.serviceSaveAssignForm = new FormGroup({});

        // this.clientServiceSave = null;
        this.clientId = '';
        this.serviceId = '';
        this.referralId = '';
        this.backDefault = 0;
        this.view = '';
        this.currentUser = null;
        this.userProvider = {};
        this.confirmedClinicalTalkFrequencies = [];
        this.steps = [];
        this.serviceFormVals = {
            documents: {
                schoolConsentExistingFiles: [],
                parentConsentExistingFiles: [],
                recordingConsentExistingFiles: [],
            },
            client: {},
            celdt: {},
            bilingual: false,
            owner: '',
            directServiceSession: {},
            isShortTerm: false,
            language: {},
            evaluationStage: '',
            meetingDate: '',
            assessmentPlanSignedOn: '',
        };
        this.services = [];
        this.serviceOpts = [];
        this.providerTypesOpts = [];
        this.providerTypeName = '';
        this.documentTypes = [];
        this.isEdit = false;
        this.loaded = {
            currentUser: false,
            routeParams: false,
            client: false,
            // service: false,
            clientService: false,
            referral: false,
            services: false,
            documentTypes: false,
            providerTypes: false,
        };
        // this.routeParams;
        this.showDocs = {};
        this.revalidateStep = {
            identify: false,
            clientDetails: false,
            serviceDetails: false,
            assign: false,
        };

        this.stepsUpdateObserver = null;
        this.sharedDataObserver = null;

        this.inited = false;
    }

    init() {
        this.reset();
        return new Observable((observer: any) => {
            const checkAllLoadedLocal = () => {
                if (this.plLodash.allTrue(this.loaded)) {
                    this.inited = true;
                    this.onAllLoaded()
                        .subscribe(() => {
                            observer.next({ client: this.client, clientService: this.clientService,
                                referral: this.referral,
                                steps: this.steps, isEdit: this.isEdit, backDefault: this.backDefault });
                            this.updateSharedData();
                        });
                }
            };
            this.router.events.subscribe((val: any) => {
                this.setView();
            });
            this.store.select('currentUser')
                .subscribe((user: any) => {
                    this.currentUser = user;
                    if (user && user.uuid) {
                        this.userProvider = this.plCurrentUser.getProvider(user);
                        this.serviceFormVals.owner = user.uuid;
                        this.loaded.currentUser = true;

                        if (!this.inited) {
                            checkAllLoadedLocal();
                        }
                    }
                });
            // this.route.params
            this.route.queryParams
                .subscribe((routeParams: any) => {
                    if (!this.inited) {
                        this.routeParams = routeParams;
                        this.clientId = routeParams['client'] || '';
                        this.serviceId = routeParams['service'] || '';
                        this.referralId = routeParams['referral'] || '';
                        this.backDefault = parseInt(routeParams['backDefault'], 10) || 0;
                        if (this.serviceId) {
                            this.isEdit = true;
                        }
                        this.getClient()
                            .subscribe((client: any) => {
                                checkAllLoadedLocal();
                            });
                        this.getClientService()
                            .subscribe((clientService: any) => {
                                checkAllLoadedLocal();
                            });
                        this.getReferral()
                            .subscribe((referral: any) => {
                                checkAllLoadedLocal();
                            });
                        this.setView();
                        this.loaded.routeParams = true;
                        checkAllLoadedLocal();
                    }
                });
            this.getServices()
                .subscribe(() => {
                    checkAllLoadedLocal();
                });
            this.getDocumentTypes()
                .subscribe(() => {
                    this.getRecordingConsentDocuments()
                        .subscribe((document: any) => {
                            checkAllLoadedLocal();
                        });
                });
            this.getProviderTypes()
                .subscribe(() => {
                    checkAllLoadedLocal();
                });
        });
    }

    destroy() {
        this.reset();
    }

    onAllLoaded() {
        return new Observable((observer: any) => {
            const doneLocal = () => {
                // Must be after update serviceFormVals with clientService.
                this.setSteps();
                this.setHideDocs();
                this.validateViewStep();
                observer.next();
            };

            this.serviceFormVals = this.setClientServiceDefaults(this.serviceFormVals);

            if (this.isEdit) {
                this.serviceFormVals = {
                    ...this.serviceFormVals,
                    ...this.clientServiceToInputs(this.clientService),
                };
            } else {
                const code = this.referral.productType.code;
                const validCode = (
                    code === this.CLINICAL_PRODUCT.CODE.DIR_SVC ||
                    code === this.CLINICAL_PRODUCT.CODE.SV ||
                    code === this.CLINICAL_PRODUCT.CODE.BIG ||
                    code === this.CLINICAL_PRODUCT.CODE.TG
                );

                this.serviceFormVals.providerType = this.referral.providerType.code;

                if (validCode) {
                    this.serviceFormVals.directServiceSession.frequency = this.referral.frequency || null;
                    this.serviceFormVals.directServiceSession.interval = (this.referral.interval || '').toUpperCase();
                    this.serviceFormVals.directServiceSession.duration = this.referral.duration || null;
                }

                if (this.referral.isScheduled) {
                    // These fields have been implicitly "confirmed" becaused the referral is scheduled.
                    // Editing these values when creating the service will require a confirmation.
                    const talkFrequency = toClinicalTalkFrequency(this.serviceFormVals.directServiceSession);
                    this.confirmedClinicalTalkFrequencies.push(talkFrequency);
                }

                this.serviceFormVals.service = '';
                this.serviceFormVals.serviceCategory = '';
                this.serviceFormVals.areasOfConcernIds = [];
                this.serviceFormVals.assessmentsUsedIds = [];
                this.serviceFormVals.isShortTerm = this.referral.isShortTerm || false;
                this.serviceFormVals.language = this.referral.language || { code: 'en' };
                this.serviceFormVals.assessmentPlanSignedOn = this.referral.assessmentPlanSignedOn;
                this.serviceFormVals.meetingDate = this.referral.meetingDate;
            }

            this.providerTypeName = this.providerTypes.find(t => t.code === this.serviceFormVals.providerType).longName;

            this.formServiceOpts();
            doneLocal();
        });
    }

    validateViewStep() {
        const currentStepIndex = this.plLodash.findIndex(this.steps, 'key', this.view);
        if (currentStepIndex > 0 && (!this.serviceFormVals.providerType || !this.serviceFormVals.service)) {
            this.router.navigate([this.steps[0].href], { queryParams: this.steps[0].hrefQueryParams });
        }
    }

    getClient() {
        return new Observable((observer: any) => {
            if (this.clientId) {
                this.plGQLClients.getById(this.clientId)
                    .subscribe((res: any) => {
                        this.client = res.client;
                        this.serviceFormVals.client = Object.assign({},
                                                                    this.serviceFormVals.client, this.client);
                        this.loaded.client = true;
                        observer.next(this.client);
                    });
            } else {
                this.loaded.client = true;
                observer.next();
            }
        });
    }

    getClientService() {
        return new Observable((observer: any) => {
            if (this.serviceId) {
                const variables = {
                    id: this.serviceId,
                };
                this.plGraphQL.query(`query ServiceSaveClientService($id: ID!) {
                    clientService(id: $id) {
                        ... on DirectService {
                            id
                            isActive
                            client {
                                id
                                ${this.plGQLStrings.clientName}
                                ${this.plGQLStrings.clientLanguages}
                                ${this.plGQLStrings.clientEvalDates}
                            }
                            service {
                                ${this.plGQLStrings.service}
                            }
                            startDate
                            endDate
                            duration
                            frequency
                            interval
                            startingBalance
                            totalMinutesRequired
                            minutesReceived
                            referrals {
                                edges {
                                    node {
                                        id
                                        isScheduled
                                        schoolYear {
                                            id
                                            code
                                            name
                                            __typename
                                        }
                                    }
                                }
                            }
                            isShortTerm
                            language {
                                code
                                name
                            }
                        }
                        ... on Evaluation {
                            id
                            isActive
                            client {
                                id
                                ${this.plGQLStrings.clientName}
                                ${this.plGQLStrings.clientLanguages}
                                ${this.plGQLStrings.clientEvalDates}
                            }
                            service {
                                ${this.plGQLStrings.service}
                            }
                            referringProvider {
                                id
                                firstName
                                lastName
                            }
                            assignedTo {
                                id
                                firstName
                                lastName
                            }
                            assignedDate
                            dueDate
                            completedDate
                            consentSigned
                            areasOfConcern {
                                edges {
                                    node {
                                        id
                                        isActive
                                        name
                                        serviceType {
                                            ${this.plGQLStrings.serviceType}
                                        }
                                    }
                                }
                            }
                            assessmentsUsed {
                                edges {
                                    node {
                                        id
                                        isActive
                                        shortName
                                        longName
                                    }
                                }
                            }
                            bilingual
                            celdtListening
                            celdtSpeaking
                            celdtReading
                            celdtWriting
                            celdtComprehension
                            evaluationType
                            status
                            isShortTerm
                            language {
                                code
                                name
                            }
                            assessmentPlanSignedOn
                            evaluationStage
                            meetingDate
                            referrals {
                                edges {
                                    node {
                                        id
                                        isScheduled
                                        schoolYear {
                                            id
                                            code
                                            name
                                            __typename
                                        }
                                    }
                                }
                            }
                        }
                        ... on ClientService {
                            id
                        }
                    }
                 }`,                 variables, {})
                    .subscribe((res: any) => {
                        // Observable can fire after service id changes so need to check here too.
                        if (this.serviceId) {
                            // TODO - just get documents in the above call when backend is ready
                            // https://presencelearning.atlassian.net/browse/DEV-2356
                            // Get documents too.
                            // In addition to id, need to pass in data to determine type (eval vs direct).
                            const documentData: any = {
                                uuid: this.serviceId,
                            };
                            if (res.clientService.evaluationType) {
                                documentData.evaluation_type = res.clientService.evaluationType;
                            } else if (res.clientService.startDate) {
                                documentData.start_date = res.clientService.startDate;
                            }
                            this.plApiClientServices.getOneDocuments(documentData, { forceReload: true })
                                .subscribe((resDocs: any) => {
                                    res.clientService.documents_expanded = resDocs.documents_expanded;
                                    this.clientService = res.clientService;
                                    this.loaded.clientService = true;
                                    observer.next(this.clientService);
                                },         (err: any) => {
                                    observer.error(err);
                                });
                        }
                    },         (err) => {
                        observer.error(err);
                    });
            } else {
                this.loaded.clientService = true;
                observer.next();
            }
        });
    }

    getReferral() {
        return new Observable((observer: any) => {
            if (this.referralId) {
                const options = { includeOptionalReferralFields: true };

                this.plGQLReferrals.getById(this.referralId, options).subscribe((res: any) => {
                    this.referral = this.formatReferral(res.referral);
                    this.loaded.referral = true;
                    observer.next(this.referral);
                });
            } else {
                this.loaded.referral = true;
                observer.next();
            }
        });
    }

    getRecordingConsentDocuments() {
        this.recordingConsentExistingFiles = [];
        return new Observable((observer: any) => {
            if (this.clientId) {
                const url = `${this.plUrls.urls.clients}${this.clientId}/documents/`;
                const params = {};

                this.plHttp.get('', params, url)
                    .subscribe((res: any) => {
                        const recordingUUID = this.documentTypes.find((type: any) => type.code === 'parent_consent_recording').uuid;
                        res.results.forEach((doc: any) => {
                            if (doc.document_type === recordingUUID) {
                                this.recordingConsentExistingFiles.push(
                                    { name: doc.file_path });
                            }
                        });
                        observer.next(res);
                    });
            }
        });
    }

    formatReferral(referral: any) {
        const location = (referral.client.locations && referral.client.locations[0]) ?
         referral.client.locations[0] : {};
        referral.xLocation = location.name ? location.name : '';
        referral.xCreated = moment(referral.created, 'YYYY-MM-DD').format('MM/DD/YYYY');
        referral.xType = referralProductTypeMap[referral.productType.code];
        return referral;
    }

    getDocumentTypes() {
        return new Observable((observer: any) => {
            this.plApiServiceDocuments.getTypes()
                .subscribe((resDocTypes: any) => {
                    this.documentTypes = resDocTypes;
                    this.loaded.documentTypes = true;
                    observer.next();
                });
        });
    }

    getProviderTypes() {
        return new Observable((observer: any) => {
            this.plGQLProviderTypes.get()
                .subscribe((resProviderTypes: any) => {
                    this.providerTypes = resProviderTypes.providerTypes;
                    this.providerTypesOpts = this.plGQLProviderTypes.formOpts(null, { labelKey: 'longName' });
                    this.loaded.providerTypes = true;
                    observer.next();
                });
        });
    }

    getServices() {
        return new Observable((observer: any) => {
            this.plGQLServices.get()
                .subscribe((resServices: any) => {
                    this.services = resServices.services;
                    this.loaded.services = true;
                    observer.next();
                });
        });
    }

    formServiceOpts() {
        // Filter by service type and combine psychoeducational, which depend on areas of
        // concern. We will have to select an actual service id later in this case.
        let filterCategories: string[] = null;
        // If a referral, filter by the type (direct or eval).
        if (this.referral.id && this.referral.productType) {
            if (this.referral.productType.code === 'evaluation_with_assessments') {
                filterCategories = ['evaluation_with_assessment', 'evaluation_screening',
                    'evaluation_record_review'];
            } else if (this.referral.productType.code === this.CLINICAL_PRODUCT.CODE.DIR_SVC) {
                filterCategories = ['therapy'];
            }
        }
        this.serviceOpts = this.plGQLServices.formSelectOptsProviderType(
            this.services,
            this.serviceFormVals.providerType, true, filterCategories);
    }

    setClientServiceDefaults(clientService1: any = {}) {
        // Set to SLP as the default.
        let providerTypeCode = 'slp';
        // If a provider, map provider type to service type and set accordingly.
        if (this.userProvider && this.userProvider.provider_types &&
         this.userProvider.provider_types.length) {
            const providerTypeId = this.userProvider.provider_types[0];
            providerTypeCode = this.plGQLProviderTypes.getValueFromKey('id', providerTypeId, 'code');
        }
        const defaults: any = {
            providerType: providerTypeCode,
        };
        const clientService = Object.assign({}, defaults, clientService1);
        return clientService;
    }

    clientServiceToInputs(clientService: any) {
        let aocIds = [];
        let auIds = [];
        if (clientService.areasOfConcern) {
            aocIds = clientService.areasOfConcern.map((aoc: any) => {
                return aoc.id;
            });
        }
        if (clientService.assessmentsUsed) {
            auIds = clientService.assessmentsUsed.map((au: any) => {
                return au.id;
            });
        }
        const clientServiceInput: any = {
            id: clientService.id,
            providerType: clientService.service.providerTypes[0].code,
            service: this.plGQLServices.getPsychoeducationalCombinedService(this.services,
                                                                            clientService.service.id),
            serviceType: clientService.service.serviceType.id,
            dueDate: (clientService.dueDate) ? this.datetimeToDate(clientService.dueDate) : '',
            celdt: {
                listening: clientService.celdtListening || '',
                speaking: clientService.celdtSpeaking || '',
                reading: clientService.celdtReading || '',
                writing: clientService.celdtWriting || '',
                comprehension: clientService.celdtComprehension || '',
            },
            areasOfConcernIds: aocIds,
            assessmentsUsedIds: auIds,
            bilingual: clientService.bilingual,
            owner: clientService.assignedTo,
            documents: {
                schoolConsentExistingFiles: [],
                parentConsentExistingFiles: [],
                recordingConsentExistingFiles: this.recordingConsentExistingFiles,
            },
            isShortTerm: clientService.isShortTerm || false,
            language: clientService.language || { code: 'en' },
            assessmentPlanSignedOn: (clientService.assessmentPlanSignedOn) ?
                this.datetimeToDate(clientService.assessmentPlanSignedOn) : '',
            evaluationStage: clientService.evaluationStage || '',
            meetingDate: clientService.meetingDate || '',
        };
        clientServiceInput.serviceCategory = this.plGQLServices.getServiceCategory(clientServiceInput.service);
        if (clientServiceInput.serviceCategory === 'therapy') {
            clientServiceInput.directServiceSession = {
                frequency: clientService.frequency,
                interval: clientService.interval,
                duration: clientService.duration,
                startDate: this.datetimeToDate(clientService.startDate),
                endDate: this.datetimeToDate(clientService.endDate),
                totalMinutesRequired: clientService.totalMinutesRequired,
            };

            // The clinical talk frequency fields on this service have already been
            // confirmed. Modifying them will require additional confirmation from the user.
            // A service can have multiple referrals. Barring further analysis for why
            // and when a direct service has multiple referrals, arbitrarily choose the
            // _first_ referral in the result set to check for talk frequency values and
            // scheduled status.
            if (clientService.referrals.length > 0 && clientService.referrals[0].isScheduled) {
                const talkFrequency = toClinicalTalkFrequency(clientServiceInput.directServiceSession);
                this.confirmedClinicalTalkFrequencies.push(talkFrequency);
            }
        } else {
            clientServiceInput.evaluationType = clientService.evaluationType;
        }
        // Add documents.
        if (clientService.documents_expanded) {
            const indexSchool = this.plLodash.findIndex(this.documentTypes, 'code', 'school_consent_form');
            const indexParent = this.plLodash.findIndex(this.documentTypes, 'code', 'parent_consent');
            const indexRecording = this.plLodash.findIndex(this.documentTypes, 'code', 'parent_consent_recording');
            const docTypesMap = {
                schoolConsentForm: (indexSchool > -1) ? this.documentTypes[indexSchool].uuid : null,
                parentConsent: (indexParent > -1) ? this.documentTypes[indexParent].uuid : null,
                recordingConsent: (indexParent > -1) ? this.documentTypes[indexRecording].uuid : null,
            };
            // Only support one file per type, so sort with most recent first,
            // then stop after get one of each type.
            const foundType: any = {
                schoolConsent: false,
                parentConsent: false,
            };
            clientService.documents_expanded = this.plLodash.sort2d(clientService.documents_expanded, 'modified', 'descending');
            clientService.documents_expanded.forEach((doc: any) => {
                if (!foundType.schoolConsent && (doc.document_type === docTypesMap.schoolConsentForm)) {
                    clientServiceInput.documents.schoolConsentExistingFiles = [{ name: doc.file_path }];
                    clientServiceInput.documents.schoolConsentSignedOn = doc.signed_on;
                    foundType.schoolConsent = true;
                } else if (!foundType.parentConsent && (doc.document_type === docTypesMap.parentConsent)) {
                    clientServiceInput.documents.parentConsentExistingFiles = [{ name: doc.file_path }];
                    foundType.parentConsent = true;
                } else if (!foundType.recordingConsent && (doc.document_type === docTypesMap.recordingConsent)) {
                    clientServiceInput.documents.recordingConsentExistingFiles = [{ name: doc.file_path }];
                    foundType.recordingConsent = true;
                }
            });
        }
        return clientServiceInput;
    }

    dateToDatetime(date: string) {
        // Backend wants date time.
        return date ? `${date}T00:00` : '';
    }

    datetimeToDate(datetime: string) {
        // YYYY-MM-DD
        return datetime ? datetime.slice(0, 10) : '';
    }

    setSteps(stepsNextDisabled1: any = {}) {
        const clientStudentCapital = PLClientStudentDisplayService.get(this.currentUser, { capitalize: true });
        const stepsNextDisabled = {
            identify: false,
            documentation: false,
            'client-details': false,
            'service-details': false,
            assign: false,
            ...stepsNextDisabled1,
        };
        const service = this.serviceFormVals;
        const hrefBase = `/service-save/`;
        const hrefParams = {
            client: this.clientId,
            service: this.serviceId,
            referral: this.referralId,
            backDefault: this.backDefault,
        };

        // omit 'documentation' step if service.serviceCategory !== 'evaluation_with_assessment'
        // see CP-3425
        // A service has a product type.
        // The documentation step is required for product type codes:
        //   - 'evaluation_with_assessments'
        //   - 'records_review'
        //   - 'screening'
        // This currently maps to an FE object service.serviceCategory that has the following keys
        //   - 'evaluation_with_assessment'
        //   - 'evaluation_record_review'
        //   - 'evaluation_screening'
        const keysRequiringDocumentationStep = [
            'evaluation_with_assessment',
            'evaluation_record_review',
            'evaluation_screening',
        ];

        const includeDocumentationStep = keysRequiringDocumentationStep.includes(service.serviceCategory);

        let steps = [
            {
                key: 'identify',
                label: 'Identify Services',
                href: `${hrefBase}identify`,
                hrefQueryParams: hrefParams,
                nextDisabled: stepsNextDisabled.identify,
                replaceHistory: true,
                requiresConfirmation: true,
            },
            ...(
                includeDocumentationStep ?
                [{
                    key: 'documentation',
                    label: 'Service Documentation',
                    href: `${hrefBase}documentation`,
                    hrefQueryParams: hrefParams,
                    nextDisabled: stepsNextDisabled.documentation,
                    replaceHistory: true,
                    requiresConfirmation: false,
                }]
                : []
            ),
            {
                key: 'client-details',
                label: `${clientStudentCapital} Details`,
                href: `${hrefBase}client-details`,
                hrefQueryParams: hrefParams,
                nextDisabled: stepsNextDisabled['client-details'],
                replaceHistory: true,
                requiresConfirmation: false,
            },
        ];

        // Do NOT show step 4 for SPED, School Psychologist, or for any type of Evaluation Assessment.
        let showStep4 = true;
        const index = this.plLodash.findIndex(this.providerTypesOpts, 'value', service.providerType);
        if (index > -1) {
            const providerType = this.providerTypesOpts[index];
            const providerTypeCode = providerType.value;
            const serviceCategory = service.serviceCategory;
            if (providerTypeCode === 'sped' || providerTypeCode === 'pa' || serviceCategory === 'evaluation_with_assessment') {
                showStep4 = false;
            }
        }
        if (showStep4 && (!service.serviceCategory || service.serviceCategory === 'evaluation_with_assessment')) {
            steps = steps.concat([
                {
                    key: 'service-details',
                    label: 'Service Details',
                    href: `${hrefBase}service-details`,
                    hrefQueryParams: hrefParams,
                    nextDisabled: stepsNextDisabled['service-details'],
                    replaceHistory: true,
                    requiresConfirmation: false,
                },
            ]);
        }
        // Service save ALWAYS is for self only now; use referral for match to someone else.
        // if (!this.isEdit && (!service.serviceCategory || service.serviceCategory === 'evaluation_with_assessment'
        //  || service.serviceCategory === 'evaluation_screening' ||
        //   service.serviceCategory === 'evaluation_record_review')) {
        //     steps = steps.concat([
        //         { key: 'assign', label: 'Assign', href: `${hrefBase}assign`,
        //          hrefQueryParams: hrefParams, nextDisabled: stepsNextDisabled.assign, replaceHistory: true },
        //     ]);
        // }

        this.steps = steps;
    }

    setView() {
        const oldView = this.view;
        this.view = this.plBrowser.getSubRoute();

        // Trigger re-validation for steps buttons.
        if (this.view !== oldView) {
            this.revalidateStep[this.stepsKeyMap[this.view]] = !this.revalidateStep[this.stepsKeyMap[this.view]];
        }
    }

    getStepsUpdates() {
        return new Observable((observer: any) => {
            this.stepsUpdateObserver = observer;
        });
    }

    setStepsUpdate(data: any) {
        if (this.stepsUpdateObserver) {
            this.stepsUpdateObserver.next(data);
        }
    }

    requestNextStepConfirmation({ currentIndex }: { currentIndex: number }): void {
        if (this.steps[currentIndex].requiresConfirmation) {
            this.nextStepConfirmationRequested.emit();
        } else {
            this.confirmNextStep({ currentStepKey: this.steps[currentIndex].key });
        }
    }

    confirmNextStep({ currentStepKey }: { currentStepKey: string}): void {
        const currentIndex = this.steps.findIndex(s => currentStepKey === s.key);

        this.nextStepConfirmed.emit({ nextIndex: currentIndex + 1 });
    }

    onChangeStepValid(evt: any) {
        this.updateStep(evt);

        this.setStepsUpdate({ steps: this.steps });
    }

    updateStep(evt: any) {
        const currentStepIndex = this.plLodash.findIndex(this.steps, 'key', evt.stepKey);
        if (currentStepIndex > -1) {
            this.steps[currentStepIndex].nextDisabled = !evt.valid;
        }
    }

    updatePsychoeducationalService() {
        // Update service in case areas of concern changes it (psychoeducational service).
        this.serviceFormVals.service = this.plGQLServices.selectPsychoeducationalService(
            this.services,
            this.serviceFormVals.service, this.serviceFormVals.areasOfConcernIds);
    }

    setHideDocs() {
        this.showDocs.schoolConsent = (this.serviceFormVals.serviceCategory ===
         'evaluation_with_assessment') ? true : false;
        this.showDocs.parentConsent = (this.serviceFormVals.serviceCategory ===
         'evaluation_with_assessment') ? true : false;
        this.showDocs.parentConsent = (this.serviceFormVals.serviceCategory ===
          'evaluation_with_assessment') ? true : false;
        this.showDocs.evaluationStage = this.serviceFormVals.serviceCategory === 'evaluation_with_assessment';
        this.showDocs.meetingDate = this.serviceFormVals.serviceCategory === 'evaluation_with_assessment';
        if (this.serviceFormVals.serviceCategory !== 'therapy' && (!this.serviceFormVals.evaluationType
         || this.serviceFormVals.evaluationType !== 'triennial')) {
            this.showDocs.dueDate = true;
        } else {
            this.showDocs.dueDate = false;
        }
        this.showDocs.triennials = true;
        if (this.serviceFormVals.serviceCategory === 'evaluation_with_assessment'
         && this.serviceFormVals.evaluationType === 'initial') {
            this.showDocs.triennials = false;
        }
    }

    onChangeService(data: { model: any, oldVal: any, stepValid: boolean, stepKey: string }) {
        return new Observable((observer: any) => {
            if (!this.plLodash.equals(data.oldVal, data.model)) {
                this.serviceFormVals.serviceCategory =
                 this.plGQLServices.getServiceCategory(this.serviceFormVals.service);
                this.serviceFormVals.serviceType = this.plGQLServices.getServiceType(this.serviceFormVals.service);
                const stepsNextDisabled = {};
                if (data.stepKey) {
                    stepsNextDisabled[data.stepKey] = !data.stepValid;
                }
                this.setSteps(stepsNextDisabled);
                this.setHideDocs();
                this.setStepsUpdate({ steps: this.steps });
                observer.next({ serviceFormVals: this.serviceFormVals });
            } else {
                observer.next({});
            }
        });
    }

    onChangeEvalType(data: { model: any, oldVal: any }) {
        if (!this.plLodash.equals(data.oldVal, data.model)) {
            this.setHideDocs();
        }
    }

    pullOutDocumentFiles(documents: any) {
        if (documents.schoolConsentFiles) {
            documents.schoolConsentFiles = documents.schoolConsentFiles.files;
            documents.schoolConsentSignedOn = documents.schoolConsentSignedOn;
        }
        if (documents.parentConsentFiles) {
            documents.parentConsentFiles = documents.parentConsentFiles.files;
        }
        if (documents.recordingConsentFiles) {
            documents.recordingConsentFiles = documents.recordingConsentFiles.files;
        }
        return documents;
    }

    submitService() {
        return new Observable((observer: any) => {
            const serviceFormVals = this.serviceFormVals;
            // Assumes data has already been validated.
            // Pull out any non service fields.
            let documents: any = null;
            let client: any = null;
            const clientDeletions: string[] = [];
            const clientId = this.clientId;
            if (serviceFormVals.documents) {
                documents = this.pullOutDocumentFiles(serviceFormVals.documents);
            }
            if (serviceFormVals.client) {
                client = {
                    id: clientId,
                    primaryLanguageCode: serviceFormVals.client.primaryLanguage.code,
                    secondaryLanguageCode: serviceFormVals.client.secondaryLanguage.code,
                    englishLanguageLearnerStatus: serviceFormVals.client.englishLanguageLearnerStatus,
                    annualIepDueDate: serviceFormVals.client.annualIepDueDate,
                    previousTriennialEvaluationDate: serviceFormVals.client.previousTriennialEvaluationDate,
                    triennialEvaluationDueDate: serviceFormVals.client.triennialEvaluationDueDate,
                    recordingAllowed: serviceFormVals.client.recordingAllowed,
                };
                if (!client.primaryLanguageCode) {
                    client.primaryLanguageCode = null;
                    clientDeletions.push('primaryLanguageCode');
                }
                if (!client.secondaryLanguageCode) {
                    client.secondaryLanguageCode = null;
                    clientDeletions.push('secondaryLanguageCode');
                }
            }
            let directService: any = null;
            let evaluation: any = null;
            if (serviceFormVals.serviceCategory === 'therapy') {
                // Direct Service.
                directService = {
                    clientId,
                    startDate: serviceFormVals.directServiceSession.startDate,
                    serviceId: serviceFormVals.service,
                    bilingual: serviceFormVals.bilingual,
                    matchToSelf: true,
                };
                if (serviceFormVals.id) {
                    directService.id = serviceFormVals.id;
                    directService.startDate = this.dateToDatetime(serviceFormVals.directServiceSession.startDate);
                }
                if (serviceFormVals.directServiceSession.endDate) {
                    directService.endDate = this.dateToDatetime(serviceFormVals.directServiceSession.endDate);
                }
                if (!this.isEdit) {
                    // Only send isShortTerm and languageId when creating a service
                    // This fields are inmutable after creation
                    directService.isShortTerm = serviceFormVals.isShortTerm;
                    directService.languageId = serviceFormVals.language.code;
                }
                const optionalFields = ['duration', 'frequency', 'interval', 'totalMinutesRequired'];
                optionalFields.forEach((field) => {
                    if (serviceFormVals.directServiceSession[field]) {
                        directService[field] = serviceFormVals.directServiceSession[field];
                    }
                });
            } else {
                // Evaluation.
                evaluation = {
                    clientId,
                    serviceId: serviceFormVals.service,
                    areasOfConcernIds: serviceFormVals.areasOfConcernIds,
                    assessmentsUsedIds: serviceFormVals.assessmentsUsedIds,
                    evaluationType: serviceFormVals.evaluationType,
                    bilingual: serviceFormVals.bilingual,
                };
                if (serviceFormVals.celdt.listening) {
                    evaluation.celdtListening = serviceFormVals.celdt.listening;
                }
                if (serviceFormVals.celdt.speaking) {
                    evaluation.celdtSpeaking = serviceFormVals.celdt.speaking;
                }
                if (serviceFormVals.celdt.reading) {
                    evaluation.celdtReading = serviceFormVals.celdt.reading;
                }
                if (serviceFormVals.celdt.writing) {
                    evaluation.celdtWriting = serviceFormVals.celdt.writing;
                }
                if (serviceFormVals.celdt.comprehension) {
                    evaluation.celdtComprehension = serviceFormVals.celdt.comprehension;
                }
                if (serviceFormVals.id) {
                    evaluation.id = serviceFormVals.id;
                }
                // if (serviceFormVals.owner) {
                if (!this.isEdit) {
                    // Service save ALWAYS is for self only now; use referral for match to someone else.
                    // evaluation.assignedTo = serviceFormVals.owner;
                    // evaluation.matchToSelf = (serviceFormVals.owner === this.currentUser.uuid) ? true : false;
                    // if (evaluation.matchToSelf) {
                    evaluation.matchToSelf = true;
                    if (1) {
                        // Also assign the evaluation.
                        evaluation.assignedToId = this.currentUser.uuid;
                    }
                    // Only send isShortTerm and languageId when creating a service
                    // This fields are inmutable after creation
                    evaluation.isShortTerm = serviceFormVals.isShortTerm;
                    evaluation.languageId = serviceFormVals.language.code;
                }
                if (serviceFormVals.dueDate) {
                    evaluation.dueDate = this.dateToDatetime(serviceFormVals.dueDate);
                }
                if (serviceFormVals.assessmentPlanSignedOn) {
                    evaluation.assessmentPlanSignedOn = serviceFormVals.assessmentPlanSignedOn;
                }
                if (serviceFormVals.evaluationStage) {
                    evaluation.evaluationStage = serviceFormVals.evaluationStage;
                }
                if (serviceFormVals.meetingDate) {
                    evaluation.meetingDate = serviceFormVals.meetingDate;
                }
            }

            this.plGQLClientService.save({ evaluation, directService }, this.referral.id,
                                         documents, clientId)
                .subscribe((resService: any) => {
                    // Save client.
                    const variables = {
                        client,
                        clientDeletions,
                    };
                    const moreParams = {
                        refetchQueries: this.plGQLQueries.queryGroups.referralsAndServices,
                    };
                    this.plGraphQL.mutate(`mutation serviceSaveUpdateClient($client: UpdateClientInputData,
                        $clientDeletions: [String]) {
                        updateClient(input: {client: $client, clientDeletions: $clientDeletions}) {
                            errors {
                                code
                                field
                                message
                            }
                            status
                            client {
                                id
                                ${this.plGQLStrings.clientName}
                                ${this.plGQLStrings.clientLanguages}
                                recordingAllowed
                            }
                        }
                    }`, variables, {}, moreParams).subscribe((resClient: any) => {
                        this.store.dispatch(PLClearClients());
                        observer.next();
                    },                                       (err: any) => {
                        observer.error(err);
                    });
                },         (err: any) => {
                    observer.error(err);
                });
        });
    }
}
