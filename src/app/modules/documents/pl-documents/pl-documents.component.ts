import { Component, Input } from '@angular/core';
import * as moment from 'moment';

import { Observable } from 'rxjs';

import { PLHttpService, PLApiDocumentTypesService,
 PLApiServiceDocumentsService, PLUrlsService,
 PLLodashService, PLConfirmDialogService } from '@root/index';

@Component({
    selector: 'pl-documents',
    templateUrl: './pl-documents.component.html',
    styleUrls: ['./pl-documents.component.less'],
})
export class PLDocumentsComponent {
    @Input() clientUuid: string = '';
    @Input() mayUpload = false;
    @Input() mayDelete = false;

    visible: any = {
        upload: false,
        download: false,
        delete: false,
        downloadButton: false,
        deleteButton: false,
    };

    documents: any[];

    total: number;
    currentPage: number = 1;
    pageSize: number;
    orderDirection: any = {
        created: 'descending'
    };
    private currentQueryId: string = '';
    loading: boolean = false;

    private documentsSelectedCount: number = 0;

    private documentTypes: any[] = [];

    constructor(private plHttp: PLHttpService, private plUrls: PLUrlsService,
     private plApiDocumentTypes: PLApiDocumentTypesService,
     private plApiServiceDocuments: PLApiServiceDocumentsService,
     private plLodash: PLLodashService, private plConfirmDialog: PLConfirmDialogService) {
    }

    ngOnChanges(changes: any) {
        this.loadData();
    }

    loadData() {
        this.plApiDocumentTypes.get()
            .subscribe((res: any) => {
                this.documentTypes = res;
                this.getDocuments();
            });
    }

    deleteDocument(uuid: string) {
        this.plApiServiceDocuments.delete(uuid)
            .subscribe((resDelete: any) => {
                this.getDocuments();
            });
    }

    getDocuments() {
        this.onQuery2({ query: {} });
    }

    onQuery2(info: { query: any }) {
        const currentQueryId: string = this.plLodash.randomString();
        this.currentQueryId = currentQueryId;
        this.loading = true;

        if (this.clientUuid) {
            const url = `${this.plUrls.urls.clients}${this.clientUuid}/documents/`;
            const params = Object.assign({}, info.query, {
                expand: ['client_service', 'modified_by'],
            });

            this.plHttp.get('', params, url)
                .subscribe((res: any) => {
                    if (this.currentQueryId === currentQueryId) {
                        this.documents = this.formatDocuments(res.results ? res.results : []);
                        this.changeSelectRow();
                        this.total = res.count;
                        this.loading = false;
                    }
                });
        }
    }

    formatDocuments(documents: any[]) {
        return documents.map((document: any) => {
            document._service = (document.client_service_expanded &&
             document.client_service_expanded.service_expanded
             && document.client_service_expanded.service_expanded.name) ?
             document.client_service_expanded.service_expanded.name : 'N/A';
            document._documentType = this.plApiDocumentTypes.getNameFromKey('uuid',
             document.document_type);
            document._name = document.file_path.substring(document.file_path.lastIndexOf('/') + 1);
            document._created = moment(document.created).format('MM/DD/YYYY');
            const person = document.modified_by_expanded;
            document._person = `${person.first_name} ${person.last_name}`;
            document._checked = false;
            return document;
        });
    }

    changeSelectRow() {
        this.countRowsSelected();
        this.setDownloadAndDeleteButtonVisible();
    }

    countRowsSelected() {
        let count: number = 0;
        this.documents.forEach((document: any) => {
            if (document._checked) {
                count++;
            }
        });
        this.documentsSelectedCount = count;
    }

    setDownloadAndDeleteButtonVisible() {
        if (this.documentsSelectedCount > 0) {
            this.visible.downloadButton = true;
            this.visible.deleteButton = true;
        } else {
            this.visible.downloadButton = false;
            this.visible.deleteButton = false;
        }
    }

    toggleVisible(type: string) {
        this.visible[type] = !this.visible[type];
    }

    resetVisible() {
        for (let key in this.visible) {
            this.visible[key] = false;
        }
    }

    documentsSelectDone() {
        this.resetVisible();
        this.refreshDocuments();
    }

    uploadDone() {
        this.resetVisible();
        this.refreshDocuments();
    }

    refreshDocuments() {
        this.getDocuments();
    }

    clickMultipleButton(type: string) {
        if (type === 'delete') {
            this.showDeleteConfirm();
        } else if (type === 'download') {
            this.download();
        }
    }

    showDeleteConfirm() {
        this.plConfirmDialog.show({
            header:'Deleting Files',
            content: `<div>Deleting ${this.documentsSelectedCount} file(s).</div>`+
             `<div>Deleted files are not recoverable, are you sure?</div>`,
            primaryLabel: 'Yes', secondaryLabel: 'Cancel',
            primaryCallback: () => {
                this.delete();
            },
            secondaryCallback: () => {
            },
        });
    }

    delete() {
        this.loading = true;
        const documentUuids: string[] = [];
        this.documents.forEach((document: any) => {
            if (document._checked) {
                documentUuids.push(document.uuid);
            }
        });
        this.plApiServiceDocuments.deleteBulk(documentUuids)
            .subscribe((res: any) => {
                this.loading = false;
                this.refreshDocuments();
            }, (err: any) => {
                this.loading = false;
            });
    }

    download() {
        this.loading = true;
        // TODO - need backend bulk download (zip) api.
    }
};
