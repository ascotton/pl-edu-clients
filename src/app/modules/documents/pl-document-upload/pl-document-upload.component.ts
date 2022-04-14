import { Store } from '@ngrx/store';
import { FormGroup } from '@angular/forms';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import {
    PLApiDocumentTypesService, PLApiClientServicesService, PLFormService,
    PLToastService, PLLodashService, PLApiServiceUploadDocumentsService,
    PLMayService,
} from '@root/index';


@Component({
    selector: 'pl-document-upload',
    templateUrl: './pl-document-upload.component.html',
    styleUrls: ['./pl-document-upload.component.less'],
})
export class PLDocumentUploadComponent {
    @Input() clientUuid = '';
    @Input() locationUuid = '';
    @Output() readonly canceled = new EventEmitter<any>();
    @Output() readonly submitted = new EventEmitter<any>();

    clientServiceOpts: any[] = [];

    documentUploadForm: FormGroup = new FormGroup({});
    documentTypeOpts: any[] = [];

    model: any = {};
    submitting = false;

    validFileNameToUpload = true;

    private currentUser: User;
    private clientServices: any[] = [];
    private loaded: any = {
        currentUser: false,
        documentTypes: false,
    };

    constructor(
        private plApiDocumentTypes: PLApiDocumentTypesService,
        private plApiClientServices: PLApiClientServicesService,
        private store: Store<AppStore>, private plMay: PLMayService,
        private plToast: PLToastService, private plLodash: PLLodashService,
        private plApiServiceUploadDocuments: PLApiServiceUploadDocumentsService,
    ) { }

    ngOnChanges() {
        this.loadData();
    }

    ngOnInit() {
        this.loadData();
        this.store.select('currentUser')
            .subscribe((user: any) => {
                this.currentUser = user;
                this.loaded.currentUser = true;
                this.checkAllLoaded();
            });
    }

    loadData() {
        this.plApiDocumentTypes.get()
            .subscribe((res: any) => {
                this.loaded.documentTypes = true;
                this.setDocumentTypeOpts();
            });
        if (this.clientUuid) {
            this.plApiClientServices.get({ client: this.clientUuid })
                .subscribe((res: any) => {
                    this.clientServices = res;
                    this.filterServicesByDocumentType();
                });
        }
    }

    checkAllLoaded() {
        if (this.plLodash.allTrue(this.loaded)) {
            this.setDocumentTypeOpts();
        }
    }

    setDocumentTypeOpts() {
        let validCodes: any = null;
        let valid: boolean = false;
        let typeOpts = this.plApiDocumentTypes.formOpts(null, 'code');

        const isCustomer = this.plMay.isCustomerAdmin(this.currentUser);

        if (this.clientUuid && isCustomer) {
            validCodes = [
                'parent_consent_recording',
                'teletherapy_informed_consent',
                'other',
                'teacher_notes',
                'parent_notes',
                'isa',
                'iep',
                'parent_consent',
                'school_consent_form',
                'dismissal_documentation',
            ];
        }

        this.documentTypeOpts = typeOpts.filter((type: any) => {
            valid = (type.value !== 'parent_consent') ? true : false;
            if (valid && validCodes && validCodes.length) {
                if (validCodes.indexOf(type.value) < 0) {
                    valid = false;
                }
            }
            return valid;
        });
    }

    changeFile() {
        this.autoGenFileName();
    }

    /**
     * Removes the extension, removes any special characters, and toggles the save button between valid and not valid.
     */
    autoGenFileName(): void {
        let hasValidFileName = true;

        if (this.model.file && this.model.file.file && this.model.file.file.name) {
            const nameWithoutExtension = this.plLodash.stripFileExtension(this.model.file.file.name);
            const { text, charactersFound }: any = this.plLodash.stripSpecialCharacters(nameWithoutExtension);

            this.model.name = text;
            hasValidFileName = !charactersFound;
        }

        this.validFileNameToUpload = hasValidFileName;
    }

    changeDocumentType() {
        this.filterServicesByDocumentType();
    }

    filterServicesByDocumentType() {
        let clientServices: any[] = this.clientServices;
        if (this.model.type) {
            const documentType = this.plApiDocumentTypes.getFromKey('code', this.model.type);
            if (documentType) {
                const docServicesIds = documentType.services;
                clientServices = this.clientServices.filter((clientService: any) => {
                    return (docServicesIds.indexOf(clientService.service) > -1) ? true : false;
                });
            }
        }
        this.model.clientService = '';
        this.clientServiceOpts = this.plApiClientServices.formSelectOpts(clientServices);
    }

    validate(model: any) {
        // Check client service type based on document type
        if (!model.clientService) {
            if (model.type === 'evaluation_report' || model.type === 'school_consent_form') {
                this.plToast.show('error', 'No matching service, please choose a different document type.');
                return false;
            }
        }
        return true;
    }

    formFullDocumentPath(model: any) {
        const extension = this.plLodash.getFileExtension(model.file.file.name);
        return `${model.name}.${extension}`;
    }

    upload() {
        PLFormService.markAllAsTouched(this.documentUploadForm);

        if (this.validate(this.model) && this.documentUploadForm.valid) {
            this.submitting = true;
            const filePath = this.formFullDocumentPath(this.model);
            // TODO - handle location (non client) documents too.
            let clientService: any = {};
            if (this.model.clientService) {
                clientService.uuid = this.model.clientService;
            }
            if (this.clientUuid) {
                clientService.client = this.clientUuid;
            }

            this.plApiServiceUploadDocuments.saveType([this.model.file.file], this.model.type,
                clientService, null, [filePath])
                .subscribe(() => {
                    this.submitted.emit();
                }, () => {
                    this.submitting = false;
                });
        }
    }

    cancel() {
        this.canceled.emit();
    }
}
