import { Component, Input, OnInit, OnDestroy } from '@angular/core';

import { first } from 'rxjs/operators';

import {
    PLGraphQLService,
    PLHttpService,
    PLModalService,
    PLConfirmDialogService,
} from '@root/index';
import { PLPhonePipe } from '@root/src/app/common/pipes';
import { PLAccountContactsFormComponent } from '../pl-account-contacts-form/pl-account-contacts-form.component';

import { trigger, transition, style, animate, state } from '@angular/animations';

import { ToastrService } from 'ngx-toastr';

import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLAccountContactsRolesHelpComponent } from '../pl-account-contacts-roles-help/pl-account-contacts-roles-help.component';
import { PLAccountsService } from '@root/src/app/common/services';

// tslint:disable: no-require-imports
const contactsGetQuery = require('../queries/organization-contacts.get.graphql');
const contactsListQuery = require('../queries/organization-contacts.list.graphql');
const contactsCreateQuery = require('../queries/organization-contacts.create.graphql');
const contactsUpdateQuery = require('../queries/organization-contacts.update.graphql');
const contactsAddRelationQuery = require('../queries/organization-contacts.add.graphql');
const contactsRemoveRelationQuery = require('../queries/organization-contacts.remove.graphql');

@Component({
    selector: 'pl-account-contacts',
    templateUrl: './pl-account-contacts.component.html',
    styleUrls: ['./pl-account-contacts.component.less'],
    providers: [PLPhonePipe],
    animations: [
        trigger('inOutAnimation', [
            transition(':enter', [
                style({ height: '0px', opacity: 0 }),
                animate('150ms', style({ height: '*', opacity: 1 })),
            ]),
            transition(':leave', [
                style({ height: '*', opacity: 1 }),
                animate('150ms', style({ height: '0px', opacity: 0 })),
            ]),
        ]),
    ],
})
export class PLAccountContactsComponent implements OnInit, OnDestroy {
    @Input() sfAccountId: string;
    @Input() organization: any;
    @Input() locations: any[];

    loading = true;
    contacts: any = [];
    total: number;
    currentPage = 1;
    pageSize: number;
    readonly orderKey: string = 'orderBy';
    readonly pageSizeKey: string = 'first';

    isSaving = false;
    editMode: ContactEditMode = ContactEditMode.None;
    selectedContact: any = {};
    selectedContactForEdit: any = {};
    canSelectOrg = true;
    canSelectLocation = true;

    private lastQuery: any;
    private currentUser: User;
    private userPerms: any = {};

    readonly roleSelectOpts: any[] = [
        { value: 'District Admin', label: 'District Admin' },
        { value: 'IEP Access Contact', label: 'IEP Access Contact' },
        { value: 'IT Contact', label: 'IT Contact' },
        { value: 'Primary Site Contact', label: 'Primary Site Contact' },
        { value: 'Primary Support Person', label: 'Primary Support Person' },
        { value: 'Scheduling Contact', label: 'Scheduling Contact' },
        { value: 'Site Contact', label: 'Site Contact' },
        { value: 'Staff (Other)', label: 'Staff (Other)' },
    ];

    readonly filterSelectOpts: any[] = [
        {
            value: 'lastName_Icontains',
            label: 'Last Name',
            defaultVisible: true,
            placeholder: 'Type to filter..',
        },
        {
            value: 'firstName_Icontains',
            label: 'First Name',
            defaultVisible: true,
            placeholder: 'Type to filter..',
        },
        {
            value: 'role',
            label: 'Role',
            defaultVisible: true,
            placeholder: 'Select an item',
            selectOpts: this.roleSelectOpts,
        },
    ];

    constructor(
        private plGraphQL: PLGraphQLService,
        private plAccountsService: PLAccountsService,
        private plPhonePipe: PLPhonePipe,
        private plModal: PLModalService,
        private plConfirm: PLConfirmDialogService,
        private store: Store<AppStore>,
        private toastr: ToastrService,
    ) { }

    ngOnInit(): void {
        this.store.select('currentUser').subscribe((user: any) => {
            this.currentUser = user;

            this.plAccountsService
                .getAccountPermissions(this.sfAccountId, [
                    permissionsMap.MANAGE_CONTACT,
                    permissionsMap.MANAGE_CONTACT_PLATFORMACCESS,
                ])
                .pipe(first())
                .subscribe((res: any) => {
                    this.userPerms = res;
                });
        });
    }

    ngOnDestroy(): void { }

    onQuery(info: { query: any }) {
        this.lastQuery = info;

        const vars: any = Object.assign(info.query, {
            sfAccountId: this.sfAccountId,
        });

        this.loading = true;

        this.plGraphQL
            .query(contactsListQuery, vars, {})
            .pipe(first())
            .subscribe(
                (res: any) => {
                    this.contacts = res.contacts;
                    this.total = res.contacts_totalCount;
                    this.loading = false;

                    setTimeout(
                        () => {
                            if (this.selectedContactForEdit) {
                                const contact = this.selectedContactForEdit;
                                for (const c of this.contacts.filter(
                                    (x: any) => x.email === contact.email,
                                )) {
                                    this.onSelectContact(c, true);
                                    break;
                                }
                            }
                        },
                        100);
                },
                (error: any) => {
                    console.error(error);
                    this.loading = false;
                });
    }

    onSelectContact(contact: any, force: boolean = false) {
        this.editMode = ContactEditMode.None;

        if (contact.isOpen && !force) {
            contact.isOpen = false;
            return;
        }

        contact.isOpen = true;
        contact.relations = [];
        contact.isLoading = true;

        const vars: any = {
            id: contact.id,
        };

        this.plGraphQL
            .query(contactsGetQuery, vars, {})
            .pipe(first())
            .subscribe(
                (res: any) => {
                    contact.isLoading = false;

                    // can hit this if we removed the last role
                    if (!res.contact) {
                        contact.isOpen = false;
                        return;
                    }

                    // pretty up
                    const orgLevel: any[] = [];
                    const locLevel: any[] = [];
                    const otherOrgsOrgLevel: any[] = [];
                    const otherOrgsLocationLevel: any[] = [];

                    for (const cr of res.contact.relations) {
                        // if we don't have perms to the org or loc, these will be null
                        if (!cr.organization) {
                            cr.organization = {
                                id: cr.organizationId,
                                name: cr.organizationName,
                            };
                        }

                        if (!cr.location) cr.location = {};

                        // role
                        if (this.isPlattformRole(cr.role)) {
                            cr.roleName = accessLevelsMap[cr.role];
                        } else {
                            cr.roleName = cr.role;
                        }

                        // org or location level?
                        if (cr.location && cr.sfAccount.id === cr.location.sfAccountId) {
                            // location level!
                            cr.name = cr.sfAccount.name;

                            // this org or another?
                            if (cr.organization.id === this.organization.id) locLevel.push(cr);
                            else otherOrgsLocationLevel.push(cr);
                        } else {
                            // org level!
                            cr.name = orgLevelName;

                            // this org or another?
                            if (cr.organization.id === this.organization.id) orgLevel.push(cr);
                            else otherOrgsOrgLevel.push(cr);
                        }

                        contact.relations.push(cr);
                    }

                    const final: any[] = [];
                    this.addRelations(orgLevel, final);
                    this.addRelations(locLevel, final);

                    const final2: any[] = [];
                    this.addRelations(otherOrgsOrgLevel, final2);
                    this.addRelations(otherOrgsLocationLevel, final2);

                    contact.relationsList = [];

                    const typeLabelLocal =
                        final2.length > 0
                            ? `Locations (${this.organization.name})`
                            : 'Locations';

                    if (final.length > 0) {
                        contact.relationsList.push({ typeLabel: typeLabelLocal, items: final });
                    }

                    if (final2.length > 0) {
                        contact.relationsList.push({
                            typeLabel: 'Locations (Other Organizations)',
                            items: final2,
                        });
                    }
                },
                (error: any) => {
                    console.error(error);
                    contact.isLoading = false;
                });
    }

    isAddContactButtonVisible(): boolean {
        // can add a contact if we have 'manage' at any orgs/locs
        for (const k in this.userPerms) {
            if (
                this.userPerms[k].includes(permissionsMap.MANAGE_CONTACT) ||
                this.userPerms[k].includes(permissionsMap.MANAGE_CONTACT_PLATFORMACCESS)
            ) {
                return true;
            }
        }

        return false;
    }

    isSFBasedRelation(contactRelation: any): boolean {
        return contactRelation.source === relationsMap.SALESFORCE_RELATION;
    }

    canRemoveRelation(contact: any, contactRelation: any): boolean {
        if (contactRelation.source === relationsMap.PLATFORM_RELATION) {
            return this.canManageRelation(contact, contactRelation);
        }

        if (contactRelation.source === relationsMap.PLATFORMACCESS_RELATION) {
            return this.canManageRelationPlatformAccess(contact, contactRelation);
        }

        return false; // e.g. contactRelation.source === SALESFORCE_RELATION
    }

    onClickRemoveRelation(contact: any, contactRelation: any) {
        const removalMsg =
            contact.relations.length === 1
                ? 'Contact'
                : this.isPlattformRole(contactRelation.role)
                    ? 'Access level'
                    : 'Role';

        this.plConfirm.show({
            header: 'Confirm Remove',
            content: `Are you sure you want to remove this ${removalMsg.toLowerCase()}?`,
            primaryLabel: 'Yes',
            secondaryLabel: 'No',
            primaryCallback: () => {
                this.isSaving = true;

                const vars: any = {
                    input: {
                        contact: {
                            id: contact.id,
                        },
                        relation: {
                            sfAccountId: contactRelation.sfAccount.id,
                            role: contactRelation.role,
                        },
                    },
                };

                this.plGraphQL
                    .query(contactsRemoveRelationQuery, vars, {})
                    .pipe(first())
                    .subscribe(
                        (res: any) => {
                            this.isSaving = false;

                            if (!this.checkErrors(res.removeRelation, removalMsg + ' removed!')) {
                                // was this the last relation? remove from table
                                if (contact.relations.length === 1) {
                                    this.contacts = this.contacts.filter((x: any) => x.id !== contact.id);
                                    this.contacts = [...this.contacts];
                                    this.total--;
                                } else {
                                    this.onSelectContact(contact, true);
                                }
                            }
                        },
                        (error: any) => {
                            console.error(error);
                            this.isSaving = false;
                        });
            },
            secondaryCallback: () => { },
            closeCallback: () => { },
        });
    }

    onClickNewContact() {
        this.selectedContactForEdit = {};
        this.showModal({}, ContactEditMode.New);
    }

    onClickEditContact(contact: any) {
        this.selectedContactForEdit = Object.assign({}, contact);

        if (this.selectedContactForEdit.phone) {
            this.selectedContactForEdit.phone = this.plPhonePipe.transform(this.selectedContactForEdit.phone);
        }

        this.showModal(contact, ContactEditMode.EditDetails);
    }

    onClickAddRole(contact: any) {
        this.selectedContactForEdit = contact;
        this.showModal(contact, ContactEditMode.AddRole);
    }

    onClickAddPlatformAccess(contact: any) {
        this.selectedContactForEdit = contact;
        this.showModal(contact, ContactEditMode.AddPlatformRole);
    }

    canEditContactDetails(contact: any): boolean {
        // can't edit if contact has a sf-based relationship (means the details come from sf)
        if (contact.relations.filter((x: any) => x.source === relationsMap.SALESFORCE_RELATION).length > 0) {
            return false;
        }

        // can edit if we have manage at any of the contact's relationships
        if (
            contact.relations.filter(
                (x: any) =>
                    this.canManageRelation(contact, x) ||
                    this.canManageRelationPlatformAccess(contact, x),
            ).length > 0
        ) {
            return true;
        }

        return false;
    }

    canAddRole(): boolean {
        for (const k in this.userPerms) {
            if (this.userPerms[k].includes(permissionsMap.MANAGE_CONTACT)) return true;
        }

        return false;
    }

    canAddPlatormRole(contact: any): boolean {
        // already have org-level at this org?
        if (
            contact.relations.filter(
                (x: any) =>
                    x.organization.id === this.organization.id &&
                    this.isPlattformRole(x.role) &&
                    x.name === orgLevelName,
            ).length > 0
        ) {
            return false;
        }

        for (const k in this.userPerms) {
            if (this.userPerms[k].includes(permissionsMap.MANAGE_CONTACT_PLATFORMACCESS)) {
                return true;
            }
        }

        return false;
    }

    onSaveForm(evnt: any, onSuccess: Function) {
        this.isSaving = true;

        const relations: any[] = [];

        if (
            this.editMode === ContactEditMode.New ||
            this.editMode === ContactEditMode.AddRole ||
            this.editMode === ContactEditMode.AddPlatformRole
        ) {
            if (evnt.orgOrLocation === 1 || this.locations.length === 0) {
                relations.push({
                    sfAccountId: this.sfAccountId,
                    role: evnt.role,
                });
            } else if (evnt.locations) {
                for (const l of evnt.locations) {
                    relations.push({
                        locationId: l,
                        role: evnt.role,
                    });
                }
            }
        }

        // store cleaned phone
        //  best bet here would be to use a standardized library like libphonenumber
        if (this.editMode === ContactEditMode.New || this.editMode === ContactEditMode.EditDetails) {
            this.selectedContactForEdit.phone = this.plPhonePipe.transform(
                this.selectedContactForEdit.phone,
            );
        }

        if (this.editMode === ContactEditMode.New) {
            const vars: any = {
                input: {
                    relations,
                    contact: {
                        firstName: this.selectedContactForEdit.firstName,
                        lastName: this.selectedContactForEdit.lastName,
                        title: this.selectedContactForEdit.title,
                        email: this.selectedContactForEdit.email,
                        phone: this.selectedContactForEdit.phone,
                    },
                },
            };

            this.plGraphQL
                .query(contactsCreateQuery, vars, {})
                .pipe(first())
                .subscribe(
                    (res: any) => {
                        this.isSaving = false;

                        if (!this.checkErrors(res.createContact, 'Contact created!')) {
                            this.reloadContacts();

                            if (onSuccess) onSuccess();
                        }
                    },
                    (error: any) => {
                        console.error(error);
                        this.isSaving = false;
                    });
        } else if (this.editMode === ContactEditMode.EditDetails) {
            // update?
            const vars: any = {
                input: {
                    contact: {
                        id: this.selectedContactForEdit.id,
                        firstName: this.selectedContactForEdit.firstName,
                        lastName: this.selectedContactForEdit.lastName,
                        title: this.selectedContactForEdit.title,
                        email: this.selectedContactForEdit.email,
                        phone: this.selectedContactForEdit.phone,
                    },
                },
            };

            this.plGraphQL
                .query(contactsUpdateQuery, vars, {})
                .pipe(first())
                .subscribe(
                    (res: any) => {
                        this.isSaving = false;

                        if (!this.checkErrors(res.updateContact, 'Contact updated!')) {
                            Object.assign(this.selectedContact, this.selectedContactForEdit);

                            if (onSuccess) onSuccess();
                        }
                    },
                    (error: any) => {
                        console.error(error);
                        this.isSaving = false;
                    });
        } else {
            // add role?
            const vars: any = {
                input: {
                    relations,
                    contact: {
                        id: this.selectedContactForEdit.id,
                    },
                },
            };

            this.plGraphQL
                .query(contactsAddRelationQuery, vars, {})
                .pipe(first())
                .subscribe(
                    (res: any) => {
                        this.isSaving = false;

                        if (
                            !this.checkErrors(
                                res.addRelations,
                                this.isPlattformRole(evnt.role)
                                    ? 'Access level added!'
                                    : 'Role added!',
                            )
                        ) {
                            this.onSelectContact(this.selectedContact, true);

                            if (onSuccess) onSuccess();
                        }
                    },
                    (error: any) => {
                        console.error(error);
                        this.isSaving = false;
                    });
        }
    }

    onAnimationDone(contact: any, evnt: any) {
        contact.isAnimationComplete = contact.isOpen;
    }

    onClickRolesHelpIcon() {
        this.plModal.create(PLAccountContactsRolesHelpComponent);
    }

    // ------------------------------
    // private methods
    // ------------------------------
    private addRelations(crs: any[], final: any[]) {
        if (crs.length === 0) return;

        for (const cr of crs) {
            let showLinkToOrg = false;
            let showLinkToLoc = false;
            let showOrg = false;

            // if we have sfAccountId, we have perms to the org
            if (cr.organization.id !== this.organization.id) {
                showOrg = true;

                if (
                    cr.organization.isActive &&
                    cr.organization.sfAccountId && (
                        !cr.sfAccount.organizationType ||
                        cr.sfAccount.organizationType.includes('Virtual') === false)
                ) {
                    showLinkToOrg = true;
                }
            }

            if (
                cr.location.isActive &&
                cr.location.sfAccountId === cr.sfAccount.id &&
                this.sfAccountId !== cr.sfAccount.id
            ) {
                showLinkToLoc = true;
            }

            const item = final.filter(x => x.organization.id === cr.organization.id && x.key === cr.name);
            if (item && item.length > 0) {
                cr.source === relationsMap.PLATFORMACCESS_RELATION
                    ? item[0].items2.push(cr)
                    : item[0].items.push(cr);
            } else {
                cr.source === relationsMap.PLATFORMACCESS_RELATION
                    ? final.push({
                        showOrg,
                        showLinkToOrg,
                        showLinkToLoc,
                        key: cr.name,
                        location: cr.location,
                        organization: cr.organization,
                        items: [],
                        items2: [cr],
                    })
                    : final.push({
                        showOrg,
                        showLinkToOrg,
                        showLinkToLoc,
                        key: cr.name,
                        location: cr.location,
                        organization: cr.organization,
                        items: [cr],
                        items2: [],
                    });
            }
        }
    }

    private isPlattformRole(role: string) {
        return role in accessLevelsMap;
    }

    private reloadContacts() {
        this.editMode = ContactEditMode.None;
        this.onQuery(this.lastQuery);
    }

    private showModal(contact: any, editMode: ContactEditMode) {
        const headerText = editModeMap[editMode];
        this.editMode = editMode;

        this.selectedContact = contact;

        let modalRef: any;

        const closeForm = () => {
            this.editMode = ContactEditMode.None;
            modalRef._component.destroy();
        };

        const params: any = {
            editMode,
            headerText,
            onHide() { },
            onCancel: () => {
                closeForm();
            },
            onSave: (obj: any) => {
                this.onSaveForm(obj, closeForm);
            },
            selectedContact: this.selectedContactForEdit,
            roleSelectOpts: this.roleSelectOpts,
            locations: this.locations,
            organization: this.organization,
            sfAccountId: this.sfAccountId,
        };

        this.plModal.create(PLAccountContactsFormComponent, params).subscribe((ref: any) => {
            modalRef = ref;
        });
    }

    private checkErrors(obj: any, successMsg: string) {
        if (obj.errors) {
            for (const e of obj.errors) {
                console.error(e);
                this.toastr.error(e.message, 'Unexpected Problem', {
                    positionClass: 'toast-bottom-right',
                });
            }

            return true;
        }

        this.toastr.success(successMsg, 'Complete', {
            positionClass: 'toast-bottom-right',
        });

        return false;
    }

    private canManageRelation(contact: any, contactRelation: any): boolean {
        if (!(contactRelation.sfAccount.id in this.userPerms)) {
            return false;
        }

        return this.userPerms[contactRelation.sfAccount.id].includes(permissionsMap.MANAGE_CONTACT);
    }

    private canManageRelationPlatformAccess(contact: any, contactRelation: any): boolean {
        if (!(contactRelation.sfAccount.id in this.userPerms)) return false;

        if (this.currentUser.email === contact.email) return false;

        return this.userPerms[contactRelation.sfAccount.id].includes(
            permissionsMap.MANAGE_CONTACT_PLATFORMACCESS,
        );
    }
}

// rg todo: this duped
enum ContactEditMode {
    None = 0,
    New = 1,
    EditDetails = 2,
    AddRole = 3,
    AddPlatformRole = 4,
}

// rg: can't use enum values here
const editModeMap = {
    1: 'Add Contact',
    2: 'Edit Contact',
    3: 'Add Role',
    4: 'Add Platform Access',
};

const permissionsMap = {
    MANAGE_CONTACT: 'organization.manage_contact',
    MANAGE_CONTACT_PLATFORMACCESS: 'organization.manage_contact_platform_access',
};

const relationsMap = {
    PLATFORM_RELATION: 'c',
    PLATFORMACCESS_RELATION: 'u',
    SALESFORCE_RELATION: 'sf',
};

const accessLevelsMap = {
    'customer-admin': 'Admin',
    'customer-basic': 'Basic',
};

const orgLevelName: String = 'ALL LOCATIONS';
