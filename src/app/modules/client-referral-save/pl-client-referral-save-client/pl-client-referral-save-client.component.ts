import { Component, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { AppStore } from '@app/appstore.model';

import { PLLodashService, PLGraphQLService, PLClientStudentDisplayService } from '@root/index';

import { PLLocationsService } from '@common/services/';
import { Option } from '@common/interfaces';

@Component({
    selector: 'pl-client-referral-save-client',
    templateUrl: './pl-client-referral-save-client.component.html',
    styleUrls: ['./pl-client-referral-save-client.component.less'],
})
export class PLClientReferralSaveClientComponent {
    @Output() onSelect = new EventEmitter<any>();

    clientReferralFormVals: any;
    isEdit = false;
    revalidate = false;
    currentUser: any = {};

    clientReferralClientForm: FormGroup = new FormGroup({});

    loading = true;
    modelFilters: any = {
        location: '',
        organization: '',
    };
    clients: any[] = [];
    private validClient = false;

    currentPage = 1;
    pageSize = 100;
    total: number;
    orderDirection: any = {
        firstName: '',
        lastName: '',
        locationName: '',
    };
    private currentQueryId = '';
    private queryTimeoutTrigger: any = false;
    private queryDebounceTime = 500;

    private currentLocation: Option = null;
    private currentOrganization: Option = null;

    locationsSubscription: Subscription;
    loadingLocations = true;
    locationOpts: Option[] = [];
    organizationOpts: Option[] = [];
    firstLocationResult = true;

    inputErrors: any = {
        lastName: false,
        firstName: false,
        externalId: false,
        birthday: false,
        organization: false,
        location: false,
    };
    errorMessage = '';
    maxDate = `${moment().format('YYYY')}-12-31`;

    createNewDisabled = true;
    clearDropDownLocationFilter = false;
    clearDropDownOrganizationFilter = false;

    get clientIdLabel(): string {
        const clientStudentCapital = PLClientStudentDisplayService.get(this.currentUser, { capitalize: true });
        return `${clientStudentCapital} ID`;
    }

    constructor(
        private plLodash: PLLodashService,
        private plGraphQL: PLGraphQLService,
        private locationsService: PLLocationsService,
        private activatedRoute: ActivatedRoute,
        store: Store<AppStore>,
    ) {
        store.select('currentUser')
            .subscribe((user: any) => {
                this.currentUser = user;
            });
        if (!this.locationsService.loadingLocations) {
            this.locationsService.beginFetch();
        }
        this.locationsSubscription = this.locationsService.getLocationsData().subscribe((result: any) => {
            if (result.locationOpts.length === 0 && this.firstLocationResult) {
                this.firstLocationResult = false;
                return;
            }
            this.firstLocationResult = false;
            this.updateValuesFromLocationService();
            this.setOrgAndLocationFromQueryParams();
        });
    }

    setOrgAndLocationFromQueryParams(): void {
        this.activatedRoute.queryParams
            .pipe(first())
            .subscribe((params) => {
                if (params.org) {
                    this.modelFilters.organization = params.org;
                    this.organizationSelected({model: this.modelFilters.organization});
                }
                if (params.location) {
                    this.modelFilters.location = params.location;
                    this.locationSelected();
                }
            });
    }

    updateValuesFromLocationService() {
        this.loadingLocations = this.locationsService.loadingLocations;
        if (!this.loadingLocations) {
            this.locationOpts = this.locationsService.getLocationOptions();
            this.organizationOpts = this.locationsService.getOrganizationOptions();
        }
    }

    ngOnChanges() {
        this.searchClients();
    }
    ngOnDestroy() {
        // prevent memory leak when component destroyed
        this.locationsSubscription.unsubscribe();
    }

    getClientFromFilters() {
        const client = Object.assign({}, this.modelFilters);
        return client;
    }

    validateClient(client: any) {
        if (client.firstName && client.lastName && client.birthday &&
            client.externalId && client.location) {
            this.validClient = true;
            return true;
        }
        this.validClient = false;
        // Set individual errors.
        this.inputErrors.lastName = client.lastName ? false : true;
        this.inputErrors.firstName = client.firstName ? false : true;
        this.inputErrors.externalId = client.externalId ? false : true;
        this.inputErrors.birthday = client.birthday ? false : true;
        // Organization helps pick location but is not required.
        this.inputErrors.location = client.location ? false : true;
        return false;
    }

    resetInputErrors() {
        for (const key in this.inputErrors) {
            this.inputErrors[key] = false;
        }
    }

    resetErrorMessage() {
        this.errorMessage = '';
    }

    addClient() {
        const client = this.getClientFromFilters();
        const clientStudentText = PLClientStudentDisplayService.get(this.currentUser);
        if (!this.validateClient(client)) {
            this.errorMessage = `Please fill out all ${clientStudentText} fields`;
        } else if (this.createNewDisabled) {
            this.errorMessage = `There is an existing ${clientStudentText} with this information.`
                + ` Select an existing ${clientStudentText} below or check the information you are entering`
                + ` to be sure it is correct.`;
        } else {
            this.resetErrorMessage();
            // Keep consistent data with existing client.
            client.locations = [this.currentLocation];
            client.locations[0].parent_organization = this.currentOrganization;
            client.locations[0].parent = this.currentOrganization;
            this.selectClient(client);
        }
    }

    clickClient(client: any) {
        this.selectClient(client);
    }

    selectClient(client: any) {
        // Keep consistent data with existing client.
        if (!client.locations[0].id) {
            client.locations[0].id = client.locations[0].value;
        }
        if (!client.locations[0].name) {
            client.locations[0].name = client.locations[0].label;
        }
        if (!client.locations[0].parent_organization.id) {
            client.locations[0].parent_organization.id = client.locations[0].parent_organization.value;
        }
        if (!client.locations[0].parent_organization.name) {
            client.locations[0].parent_organization.name = client.locations[0].parent_organization.label;
        }
        client.locations[0].parent = client.locations[0].parent_organization;
        this.onSelect.emit({ client });
    }

    changeFilter() {
        this.resetErrorMessage();
        this.searchClients();
    }

    setQuery(query: any = {}) {
        // We do not want to edit an existing client, so if external id is set, ONLY search on that.
        if (this.modelFilters.externalId) {
            query.externalId_Icontains = this.modelFilters.externalId;
        } else {
            // Organization is not used for filtering client, just for filtering location,
            // which then filters client.
            const keyMap = {
                firstName: 'firstName_Icontains', lastName: 'lastName_Icontains',
                birthday: 'birthday', externalId: 'externalId_Icontains',
                location: 'locationId',
            };
            for (const key in keyMap) {
                if (this.modelFilters[key]) {
                    query[keyMap[key]] = this.modelFilters[key];
                }
            }
        }
        return query;
    }

    searchClients() {
        if (this.queryTimeoutTrigger) {
            clearTimeout(this.queryTimeoutTrigger);
        }
        this.queryTimeoutTrigger = setTimeout(() => {
            let query = this.setQuery({});
            query = this.setQueryTable(query, {});
            this.getClients(query);
        }, this.queryDebounceTime);
    }

    getClients(params: any) {
        // this.resetInputErrors();
        this.loading = true;
        const currentQueryId: string = this.plLodash.randomString();
        this.currentQueryId = currentQueryId;
        this.plGraphQL.query(`query ClientsSingleReferral($first: Int!, $orderBy: String,
         $firstName_Icontains: String, $lastName_Icontains: String, $externalId_Icontains: String,
         $birthday: Date, $locationId: String, $offset: Int) {
            clients(first: $first, orderBy: $orderBy, firstName_Icontains: $firstName_Icontains,
             lastName_Icontains: $lastName_Icontains, externalId_Icontains: $externalId_Icontains,
             birthday: $birthday, locationId: $locationId, offset: $offset) {
                totalCount
                edges {
                    node {
                        id
                        firstName
                        lastName
                        externalId
                        birthday
                        locations {
                            edges {
                                node {
                                    id
                                    name
                                    parent {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
         }`, params, {}).subscribe((res: any) => {
             if (this.currentQueryId === currentQueryId) {
                 this.clients = this.formatClients(res.clients ? res.clients : []);
                 this.total = res.clients_totalCount;
                    // Allow creating new if have a client that has a different id,
                    // since we search with containsIn, results could come back
                    // without being an exact match.
                 const exactMatch = this.modelFilters.externalId && this.clients.some((client: any) => {
                    // Compare with externalId and org name
                     return client.externalId.toLowerCase() === this.modelFilters.externalId.toLowerCase() &&
                                client.xOrganization === this.getOrganizationInfo(this.modelFilters.organization)["label"];
                 });
                 const requiredFieldsFilled = this.modelFilters.lastName
                        && this.modelFilters.firstName
                        && this.modelFilters.externalId
                        && this.modelFilters.birthday
                        && this.modelFilters.location;

                 this.createNewDisabled = true;
                 if (requiredFieldsFilled) {
                     this.createNewDisabled = ((!this.modelFilters.externalId && this.clients.length) || exactMatch)
                        ? true : false;
                 }

                 this.loading = false;
             }
         });
    }

    formatClients(clients: any[]) {
        clients.forEach((client: any) => {
            const location = (client.locations && client.locations[0]) ? client.locations[0] : {};
            const organization = (location && location.parent) ? location.parent : {};
            client.xBirthday = (client.birthday) ? moment(client.birthday, 'YYYY-MM-DD').format('MM/DD/YYYY') : '';
            client.xOrganization = organization.name;
            client.xLocation = location.name;
            // Match REST endpoint structure. TODO - switch locations & orgs calls to graphQL and remove this.
            client.parent_organization = organization;
            if (client.locations && client.locations[0]) {
                client.locations[0].parent_organization = organization;
                client.locations[0].parent = organization;
            }
        });
        return clients;
    }

    formOrderQuery(dataInfo: any) {
        for (const xx in this.orderDirection) {
            this.orderDirection[xx] = (xx === dataInfo.orderKey) ? dataInfo.orderDirection : '';
        }
        const prefix = (dataInfo.orderDirection === 'descending') ? '-' : '';
        return `${prefix}${dataInfo.orderKey}`;
    }

    setQueryTable(query: any = {}, dataInfo: any = {}) {
        query.first = this.pageSize;
        query.offset = (this.currentPage - 1) * this.pageSize;
        if (dataInfo.orderDirection && dataInfo.orderKey) {
            // this.orderDirectionDefault = info.data.orderDirection;
            query.orderBy = this.formOrderQuery(dataInfo);
        } else {
            // Use last.
            for (const xx in this.orderDirection) {
                if (this.orderDirection[xx] !== '') {
                    query.orderBy = this.formOrderQuery({ orderKey: xx, orderDirection: this.orderDirection[xx] });
                    break;
                }
            }
        }
        return query;
    }

    onQuery(info: { data: any }) {
        if (info.data.pageSize) {
            this.pageSize = info.data.pageSize;
        }
        if (info.data.currentPage) {
            this.currentPage = info.data.currentPage;
        }
        let query = this.setQueryTable({}, info.data);
        query = this.setQuery(query);

        const params = Object.assign({}, query, {
            // locations__uuid: this.clientReferralFormVals.location.uuid,
        });
        if (params.birthday) {
            params.birthday = moment(params.birthday, 'MM/DD/YYYY').format('YYYY-MM-DD');
        }
        this.getClients(params);
    }

    getLocationInfo(locationUuid: string) {
        for (let ii = 0; ii < this.locationOpts.length; ii++) {
            if (this.locationOpts[ii].value === locationUuid) {
                return this.locationOpts[ii];
            }
        }
        return {};
    }

    getOrganizationInfo(organizationUuid: string) {
        for (let ii = 0; ii < this.organizationOpts.length; ii++) {
            if (this.organizationOpts[ii].value === organizationUuid) {
                return this.organizationOpts[ii];
            }
        }
        return {};
    }

    locationSelected() {
        const location: any = this.locationsService.getLocationForID(this.modelFilters.location);
        this.currentLocation = location;
        this.modelFilters.organization = location.parentId;
        this.currentOrganization = this.locationsService.getOrganizationForID(this.modelFilters.organization);
        this.changeFilter();
    }

    organizationSelected(event: any) {
        this.locationOpts = this.locationsService.getLocationOptionsForParentOrg(event.model);
        this.modelFilters.location = null;
    }
    clearOrganization() {
        this.modelFilters.organization = null;
        this.modelFilters.location = null;
        this.locationOpts = this.locationsService.getLocationOptionsForParentOrg(null);

        this.clearDropDownFilters('organization');
    }

    clearLocation() {
        this.modelFilters.location = null;

        this.clearDropDownFilters('location');
    }

    clearDropDownFilters(filterName: string) {
        let orgFilter = false;

        if (filterName === 'organization') {
            orgFilter = !orgFilter;
        }

        this.clearDropDownLocationFilter = true;
        this.clearDropDownOrganizationFilter = orgFilter;

        setTimeout(() => {
            this.clearDropDownLocationFilter = false;
            this.clearDropDownOrganizationFilter = false;
        }, 100);
    }

    formOpts(items: any[], valueKey: string = 'uuid', labelKey: string = 'name') {
        let opt: any;
        return items.map((item: any) => {
            opt = { value: item[valueKey], label: item[labelKey] };
            return opt;
        });
    }
}
