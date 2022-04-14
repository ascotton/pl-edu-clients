import { Store } from '@ngrx/store';
import { FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AppStore } from '@app/appstore.model';
import { PLAccountsService } from '@common/services/accounts/pl-accounts.service';
import { Component, Input, Output, EventEmitter, OnChanges, OnInit } from '@angular/core';
import {
    PLFormService, PLToastService, PLLodashService,
    PLApiAccountDocumentTypesService, PLApiAccountUploadDocumentsService,
} from '@root/index';

@Component({
    selector: 'pl-account-document-upload',
    templateUrl: './pl-account-document-upload.component.html',
    styleUrls: ['./pl-account-document-upload.component.less'],
})
export class PLAccountDocumentUploadComponent implements OnChanges, OnInit {
    @Input() locationUuid = '';
    @Input() organizationUuid = '';
    @Input() schoolYearId: any = null;
    @Output() readonly canceled = new EventEmitter<any>();
    @Output() readonly submitted = new EventEmitter<any>();

    clientServiceOpts: any[] = [];

    documentTypeOpts: any[] = [];
    documentUploadForm: FormGroup = new FormGroup({});

    model: any = {};
    mode = 'organization';

    submitting = false;

    validFileNameToUpload = true;

    private documentTypes: any[] = [];
    private loaded: any = {
        currentUser: false,
        documentTypes: false,
    };

    constructor(
        private store: Store<AppStore>,
        private toastr: ToastrService,
        private plToast: PLToastService,
        private plLodash: PLLodashService,
        private plAccountsService: PLAccountsService,
        private pLApiAccountDocumentTypes: PLApiAccountDocumentTypesService,
        private plApiAccountUploadDocuments: PLApiAccountUploadDocumentsService,
    ) { }

    ngOnChanges(changes: any) {
        if (changes.organizationUuid && changes.organizationUuid.currentValue) {
            this.mode = 'organization';
        } else if (changes.locationUuid && changes.locationUuid.currentValue) {
            this.mode = 'location';
        }
        this.loadData();
    }

    ngOnInit() {
        this.store.select('currentUser')
            .subscribe((_) => {
                this.loaded.currentUser = true;
                this.checkAllLoaded();
            });
    }

    get isOrganizationMode() {
        return this.mode === 'organization';
    }

    get isLocationMode() {
        return this.mode === 'location';
    }

    loadData() {
        this.pLApiAccountDocumentTypes.get()
            .subscribe((res: any) => {
                this.documentTypes = res;
                this.loaded.documentTypes = true;
                this.checkAllLoaded();
            });
    }

    checkAllLoaded() {
        if (this.plLodash.allTrue(this.loaded)) {
            this.setDocumentTypeOpts();
        }
    }

    setDocumentTypeOpts() {
        const typeOpts = this.pLApiAccountDocumentTypes.formOpts(this.documentTypes, 'code');
        this.documentTypeOpts = typeOpts;
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

    formFullDocumentPath(model: any) {
        const extension = this.plLodash.getFileExtension(model.file.file.name);
        return `${model.name}.${extension}`;
    }

    upload() {
        PLFormService.markAllAsTouched(this.documentUploadForm);
        if (this.documentUploadForm.valid) {
            this.submitting = true;
            const filePath = this.formFullDocumentPath(this.model);

            const documentType = this.pLApiAccountDocumentTypes.getFromKey('code', this.model.type, this.documentTypes);
            const metadata: any = {
                schoolYearId: this.schoolYearId,
                documentTypeId: documentType.uuid,
                fileName: this.model.name,
            };
            if (this.organizationUuid && this.organizationUuid.length > 0) {
                metadata.organizationId = this.organizationUuid;
                metadata.shareLevel = this.plAccountsService.shareLevel.ORG_ONLY.code;
            }
            if (this.locationUuid && this.locationUuid.length > 0) {
                metadata.locationId = this.locationUuid;
                metadata.shareLevel = this.plAccountsService.shareLevel.LOC_ONLY.code;
            }
            this.plApiAccountUploadDocuments.uploadAccountFiles(
                [this.model.file.file], this.model.type, metadata, [filePath])
                .subscribe(() => {
                    this.toastr.success(`Uploaded ${this.model.file.file.name}`, 'Complete', {
                        positionClass: 'toast-bottom-right',
                    });
                    this.submitted.emit();
                }, () => {
                    this.plToast.show('error', `There was an error uploading ${this.model.file.file.name}`, 1000, true);
                    this.submitting = false;
                });
        }
    }

    cancel() {
        this.canceled.emit();
    }
}
