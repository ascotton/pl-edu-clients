import * as moment from 'moment';
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { Component, Input, OnInit, OnChanges } from '@angular/core';

import {
    PLHttpService,
    PLApiAccountUploadDocumentsService,
    PLUrlsService,
    PLLodashService,
    PLConfirmDialogService,
    PLMayService,
    PLGraphQLService,
    PLToastService,
} from '@root/index';
import { PLSchoolYearsService, PLAccountsService, PLAssignedLocationsService } from '@common/services/';

const GQL_ORGID_OF_LOCATION = `query Location($id: ID!) {
    location(id: $id) {
        id
        organizationName
        organization { id }
    }
}`;
@Component({
    selector: 'pl-account-documents',
    templateUrl: './pl-account-documents.component.html',
    styleUrls: ['./pl-account-documents.component.less'],
})
export class PLAccountDocumentsComponent implements OnInit, OnChanges {
    @Input() locationUuid = '';
    @Input() mayUpload = false;
    @Input() mayDelete = false;
    @Input() organizationUuid = '';
    @Input() schoolYearId: any = null;

    allChecked = false;

    currentPage = 1;
    currentUser: any;

    documents: any[];

    loading = false;

    mode: string;

    pageSize = 5;

    total: number;

    uploadDisabled: boolean;

    orderDirection: any = {
        organization: {
            key: '',
            value: 'ascending',
        },
    };
    orderKeys: any = {
        organization: '',
    };
    organizationDocuments: any = {
        currentPage: 1,
        documents: [],
        loading: true,
        pageSize: 5,
        total: 0,
        visible: false,
    };

    visible: any = {
        upload: false,
        download: false,
        delete: false,
        deleteButton: false,
    };

    private URL: string;
    private currentQueryId = '';
    private initComplete = false;
    private onQueryDataCopy: any;
    private documentsSelectedCount = 0;

    constructor(
        private plMay: PLMayService,
        private plUrls: PLUrlsService,
        private plHttp: PLHttpService,
        private store: Store<AppStore>,
        private plLodash: PLLodashService,
        private plToastSvc: PLToastService,
        private plGraphQL: PLGraphQLService,
        private plAccountsService: PLAccountsService,
        private plConfirmDialog: PLConfirmDialogService,
        private schoolYearService: PLSchoolYearsService,
        private plAssignedLocationsSvc: PLAssignedLocationsService,
        private plApiAccountUploadDocumentsService: PLApiAccountUploadDocumentsService,
    ) {
        this.store.select('currentUser').subscribe((user: any) => this.currentUser = user);
    }

    ngOnInit() {
        this.checkPermissionToSeeOrgDocs();
        this.URL = `${this.plUrls.urls.accountDocuments}`;
    }

    ngOnChanges(changes: any) {
        if (changes.organizationUuid && changes.organizationUuid.currentValue) {
            this.mode = 'organization';
        } else if (changes.locationUuid && changes.locationUuid.currentValue) {
            this.mode = 'location';
        }
        if (changes.schoolYearId && changes.schoolYearId.currentValue) {
            const yearCode = this.schoolYearService.getYearForUUID(changes.schoolYearId.currentValue).code;
            this.uploadDisabled = this.schoolYearService.isYearInThePast(yearCode);
        }

        if (this.initComplete) {
            this.getDocuments();
        }
    }

    get isOrganizationMode() {
        return this.mode === 'organization';
    }

    get isLocationMode() {
        return this.mode === 'location';
    }

    getDocuments(newQuery?: any) {
        const query = newQuery ? newQuery : { query: {} };
        this.onQuery(query);
    }

    onQuery(info: { query: any }) {
        this.loading = true;
        // set flag that the table has auto-requested data
        this.initComplete = true;
        this.updatePageSizeAndCurrentPageOfTable(TABLE_TYPE.READ_WRITE, info);

        const currentQueryId: string = this.plLodash.randomString();
        this.currentQueryId = currentQueryId;

        let params: any;

        params = Object.assign({}, info.query, {
            school_year__uuid: this.schoolYearId,
            expand: ['modified_by'],
        });

        if (info['data'] && info.query) { // Helps pagination when deleting all docs in last page
            this.onQueryDataCopy = { ...info };
        }

        if (this.isOrganizationMode) {
            params.organization__uuid = this.organizationUuid;
        } else if (this.isLocationMode) {
            params.location__uuid = this.locationUuid;
        }

        if (this.URL && params) {
            this.documents = [];
            this.httpCallForGettingTheDocuments(TABLE_TYPE.READ_WRITE, { params, currentQueryId });
        }
    }

    /**
     * Specific for the scenario of:
     *   A user in locations page with permission to see organization documents.
     * Helps for loading the organization documents view in the locations tab.
     * This is activated only if the view of the table is activated from checkPermissionToSeeOrgDocs().
     */
    onQueryOrgDocs(info: { query: any }) {
        this.updatePageSizeAndCurrentPageOfTable(TABLE_TYPE.READ_ONLY, info);
        this.orgDocsTableDisplay();

        const params = Object.assign({}, info.query, {
            school_year__uuid: this.schoolYearId,
            expand: ['modified_by'],
        });

        this.loadOrgDocsReadOnlyTable(params, this.locationUuid);
    }

    formatDocuments(documents: any[], tableType: TABLE_TYPE) {
        const pageSize = tableType === TABLE_TYPE.READ_ONLY ? this.organizationDocuments.pageSize : this.pageSize;

        // Condition for helping in page size and pagination when uploading files and refreshing.
        // Also helps when being in a different page and moving the page size.
        // The BE in some scenarios is returning all the data.
        if (documents.length > pageSize) {
            const currentPage = tableType === TABLE_TYPE.READ_ONLY
                ? this.organizationDocuments.currentPage : this.currentPage;
            const firstRow = pageSize * (currentPage - 1);
            const lastRow = firstRow + (pageSize);
            // tslint:disable-next-line: no-parameter-reassignment
            documents = documents.slice(firstRow, lastRow);
        }

        return documents.map((document: any) => {
            document._documentType = document.document_type.name;
            document._name = document.file_name;
            document._created = moment(document.created).format('MM/DD/YYYY');
            const person = document.modified_by_expanded;
            document._person = `${person.first_name} ${person.last_name}`;
            document._checked = false;
            document._schoolYear = this.schoolYearService.getYearForUUID(document.school_year).name;
            document._shareLevel = this.plAccountsService.shareLevel[document.share_level].label;
            return document;
        });
    }

    changeSelectRow() {
        this.countRowsSelected();
        this.setDeleteButtonVisible();
    }

    countRowsSelected() {
        let count = 0;
        this.documents.forEach((document: any) => {
            if (document._checked) {
                count++;
            }
        });
        this.documentsSelectedCount = count;
    }

    setDeleteButtonVisible() {
        if (this.documentsSelectedCount > 0) {
            this.visible.deleteButton = true;
        } else {
            this.visible.deleteButton = false;
        }
    }

    toggleVisible(type: string) {
        this.visible[type] = !this.visible[type];
    }

    resetVisible() {
        for (const key in this.visible) {
            this.visible[key] = false;
        }
    }

    uploadDone() {
        this.resetVisible();
        this.getDocuments();
    }

    clickDelete() {
        const adminOrCustomer = (this.plMay.isAdminType(this.currentUser) ||
            this.plMay.isCustomerAdmin(this.currentUser));
        const documentUuids: string[] = [];
        const cantDeleteDocs: any[] = [];
        this.documents.forEach((document: any) => {
            if (document._checked) {
                const canDelete = adminOrCustomer || document.created_by === this.currentUser.uuid;
                if (canDelete) {
                    documentUuids.push(document.uuid);
                } else {
                    cantDeleteDocs.push(document);
                }
            }
        });
        const continueDelete = () => {
            this.loading = true;
            this.plApiAccountUploadDocumentsService.deleteBulk(documentUuids)
                .subscribe((_) => {
                    this.loading = false;
                    this.getDocuments();
                    this.countRowsSelected();
                }, (_) => {
                    this.loading = false;
                });
        };
        const dialogData = {
            header: 'Deleting Files',
            primaryLabel: 'OK',
            secondaryLabel: 'Cancel',
            content: '',
            primaryCallback: () => {
                continueDelete();
            },
        };
        if (!documentUuids.length) {
            Object.assign(
                dialogData,
                {
                    content: `<div>None of the documents selected can be deleted. Consult a site admin for further assistance.</div>`,
                    secondaryLabel: null,
                    primaryCallback: () => {
                        this.loading = false;
                    },
                },
            );
        } else if (cantDeleteDocs.length) {
            let list = `<ul style="margin-left:35px">`;
            cantDeleteDocs.forEach(doc => list = list.concat(`<li>${doc._name}</li>`));
            list = list.concat(`</ul>`);
            dialogData.content =
                `<div>Will delete ${documentUuids.length} file(s).</div>` +
                `<div>Deleted files are not recoverable.</div>` +
                `<hr>` +
                `<div>The documents listed below cannot be deleted. Consult your site admin for further assistance.</div>` +
                `<div>${list}</div>`;
        } else {
            dialogData.content =
                `<div>Deleting ${documentUuids.length} file(s).</div>` +
                `<div>Deleted files are not recoverable, are you sure?</div>`;
        }
        this.plConfirmDialog.show(dialogData);
    }

    download() {
        this.loading = true;
        // TODO - need backend bulk download (zip) api.
    }

    //#region Privates

    /**
     * The display of organization documents is only for the following scenario:
     *   - A user with permission to see organizations
     *   - The user to be located in the documents tab of the location
     * If the scenario is met the organization documents table will be displayed
     * The logic for checking if a user has access to an organization in pl-locations-list.component.ts was followed.
     */
    private checkPermissionToSeeOrgDocs() {
        if (this.isLocationMode) {
            const queryForLocations = {
                first: 25,
                offset: 0,
                orderBy: 'organization_name,name',
                page: 1,
            };

            this.plAssignedLocationsSvc.getLocations(queryForLocations).subscribe(
                (res: { locations: any[]; filteredTotalCount: number }) => {
                    try {
                        const location: any = res.locations.filter((result: any) => result.id === this.locationUuid);
                        const userHasPermission = (location[0].organizationId && !location[0].isVirtual);

                        // Display the org docs table if the condition is met
                        if (userHasPermission) {
                            this.organizationDocuments.visible = true;
                        }
                    } catch (error) {
                        this.orgDocsError('An error occured while checking the permission for seeing the organization documents.');
                    }
                },
                () => this.orgDocsError('An error occured while checking the permission for seeing the organization documents.'),
            );
        }
    }

    // TODO: Refactor this method for supporting in a pretty way both read only and read and write tables
    private httpCallForGettingTheDocuments(tableType: TABLE_TYPE, param: any) {
        this.plHttp.get('', param.params, this.URL, { suppressError: true }).subscribe(
            (res: any) => {
                if (tableType === TABLE_TYPE.READ_ONLY) {
                    const documents = this.formatDocuments(res.results
                        ? res.results : [], TABLE_TYPE.READ_ONLY);
                    this.orgDocsTableDisplay(documents, false, res.count);
                } else {
                    if (this.currentQueryId === param.currentQueryId) {
                        this.documents = this.formatDocuments(res.results ? res.results : [], TABLE_TYPE.READ_WRITE);
                        if (this.documents.length === 0 && this.currentPage > 1) {
                            // Helps pagination when deleting all docs in last page
                            this.queryBeforeCurrentPage();
                        } else {
                            this.changeSelectRow();
                            this.total = res.count;
                            this.loading = false;
                        }
                    }
                }
            },
            (err: any) => {
                if (err.error && err.error.detail && err.error.detail === 'Invalid page.') {
                    const parameters: any = { params: null, locationUuid: null };
                    if (tableType === TABLE_TYPE.READ_ONLY) {
                        parameters.params = param.params;
                        parameters.locationUuid = param.locationUuid;
                    }
                    this.queryBeforeCurrentPage(parameters.params, parameters.locationUuid);
                } else {
                    this.orgDocsError('There was an error getting your documents.');
                }
            },
        );
    }

    /**
     * Function for loading the organization documents in the location view page
     *   Gets the organization id of the location, and then fetches the organization docs of that location.
     *   Throws toast error if any of the above calls fails
     */
    private loadOrgDocsReadOnlyTable(params: any, locationUuid: string) {
        if (params && locationUuid) {
            this.plGraphQL.query(GQL_ORGID_OF_LOCATION, { id: locationUuid }, {}).subscribe(
                (locationGQLRes: any) => {
                    params.organization__uuid = locationGQLRes.location.organization.id;
                    this.httpCallForGettingTheDocuments(TABLE_TYPE.READ_ONLY, { params, locationUuid });
                },
                () => this.orgDocsError('There was an error getting the name of the organization for this location.'),
            );
        }
    }

    /**
     * Function for displaying a toast error message and don't display the organizations documents
     *
     * @param message The message to show in the toast error.
     */
    private orgDocsError(message: string) {
        this.plToastSvc.show('error', message);
        this.organizationDocuments.visible = false;
    }

    /**
     * Function for handling what's display and how's display the read only table for organization docs.
     * By default calling this (with no params) will activate the loading documents state:
     *   - Default calling works for when the user navigates through pagination or table size.
     * By calling this with params it'd mean that we are going to display soemthing in the table.
     * Validates the table visibility before performing anything.
     *
     * @param documents The array of documents to display.
     * @param loading Whether the table display the loading dots or not.
     * @param total The total ammount of docs in the whole table regardless pagination.
     */
    private orgDocsTableDisplay(documents: any[] = [], loading: boolean = true, total?: number) {
        if (this.organizationDocuments.visible) {
            this.organizationDocuments.loading = loading;
            this.organizationDocuments.documents = documents;

            if (total) {
                this.organizationDocuments.total = total;
            }
        }
    }

    /**
     * Works for both tables (upper and bottom one)
     * Helps in two scenarios:
     *   1.- When deleting the last doc in the last page; queries to previous page.
     *   2.- When changing page size on last page and not having docs, queries to previous page.
     */
    private queryBeforeCurrentPage(params?: any, locationUuid?: any) {
        let page;

        if (params && locationUuid) {
            page = this.organizationDocuments.currentPage - 1;

            params.page = page;
            params.limit = this.organizationDocuments.pageSize;
            params.offset = this.organizationDocuments.pageSize * page;

            this.organizationDocuments.currentPage = page;
            this.loadOrgDocsReadOnlyTable(params, locationUuid);
        } else {
            page = this.currentPage - 1;
            const offset = this.pageSize * page;

            this.onQueryDataCopy.query.page = page;
            this.onQueryDataCopy.query.offset = offset;
            this.onQueryDataCopy.query.limit = this.pageSize;

            this.onQueryDataCopy.data.offset = offset;
            this.onQueryDataCopy.data.currentPage = page;
            this.onQueryDataCopy.data.pageSize = this.pageSize;

            this.currentPage = page;
            this.getDocuments(this.onQueryDataCopy);
        }

    }

    /**
     * Helper for the pagination and page size within the formatDocuments method.
     * Upper table in the UI (READ_WRITE) is handle by properties in the else condition.
     * Lower table in the UI (READ_ONLY) is handle by properties in the if condition.
     */
    private updatePageSizeAndCurrentPageOfTable(tableType: TABLE_TYPE, info: any) {
        if (tableType === TABLE_TYPE.READ_ONLY) {
            try {
                this.organizationDocuments.pageSize = info.data.pageSize;
                this.organizationDocuments.currentPage = info.data.currentPage;
            } catch (error) {
                this.organizationDocuments.pageSize = this.organizationDocuments.pageSize;
                this.organizationDocuments.currentPage = this.organizationDocuments.currentPage;
            }
        } else {
            if (info && info.data && info.data.pageSize && info.data.currentPage) {
                this.pageSize = info.data.pageSize;
                this.currentPage = info.data.currentPage;
            } else {
                this.pageSize = this.pageSize;
                this.currentPage = this.currentPage;
            }
        }
    }

    //#endregion Privates
}

enum TABLE_TYPE {
    READ_WRITE = 'readAndWrite',
    READ_ONLY = 'readOnly',
}
