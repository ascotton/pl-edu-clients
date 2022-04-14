import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
    selector: 'pl-account-contacts-form',
    templateUrl: './pl-account-contacts-form.component.html',
    styleUrls: ['./pl-account-contacts-form.component.less'],
})
export class PLAccountContactsFormComponent implements OnInit, OnDestroy {
    @Input() headerText: string;
    @Input() editMode: ContactEditMode;
    @Input() selectedContact: any;
    @Input() locations: any[];
    @Input() organization: any;
    @Input() sfAccountId: string;
    @Input() roleSelectOpts: any[];

    @Input() onSave: Function;
    @Input() onCancel: Function;

    contactFormGroup: FormGroup = new FormGroup({});

    orgOrLocation: number = OrgOrLocationEditMode.None;
    locationsAssigned = 0;
    canSelectOrg = true;
    canSelectLocation = true;
    canSelectRole = true;
    locationOpts: any[] = [];
    selectedLocations: any[] = [];
    role: string;
    platformRole: string;

    readonly platformRoleSelectOpts: any[] = [
        { value: 'customer-admin', label: 'Admin' },
        { value: 'customer-basic', label: 'Basic' },
    ];

    constructor() {}

    get contactEditMode() {
        return ContactEditMode;
    }
    get orgOrLocationEditMode() {
        return OrgOrLocationEditMode;
    }

    ngOnInit(): void {}

    ngOnDestroy(): void {}

    onClickCancel(): void {
        this.onCancel();
    }

    canSave(): boolean {
        // rg todo: angular warning: "It looks like you're using ngModel on the same form field as formControl."
        //  the behavior i see is that form elements hidden with ngIf are still part of validation...
        //  so manually handling this
        if (this.editMode === ContactEditMode.New || this.editMode === ContactEditMode.EditDetails) {
            if (!this.contactFormGroup.touched || !this.contactFormGroup.valid) return false;
        }

        if (
            this.editMode === ContactEditMode.New ||
            this.editMode === ContactEditMode.AddRole ||
            this.editMode === ContactEditMode.AddPlatformRole
        ) {
            if (!this.role && !this.platformRole) return false;

            // org-level?
            if (this.locations.length > 0) {
                if (this.orgOrLocation === OrgOrLocationEditMode.None) return false;

                if (this.orgOrLocation === OrgOrLocationEditMode.Location && this.selectedLocations.length === 0) {
                    return false;
                }
            } else if (this.locations.length === 0 && !this.canSelectOrg && !this.canSelectLocation) {
                // location-level and user already has role?
                return false;
            }
        }

        return true;
    }

    onClickSave() {
        this.onSave({
            orgOrLocation: this.orgOrLocation,
            locations: this.selectedLocations,
            role: this.role || this.platformRole,
        });
    }

    onChangeRole(role: string) {
        this.orgOrLocation = OrgOrLocationEditMode.None;
        this.setLocationOptions(role);
    }

    onClickOrgLocation() {
        this.selectedLocations = [];
    }

    // ------------------------------
    // private methods
    // ------------------------------
    private setLocationOptions(selectedRole: string = null) {
        const opts: any[] = [];

        this.canSelectOrg = true;
        this.canSelectLocation = true;
        this.canSelectRole = true;
        this.locationsAssigned = 0;

        if (selectedRole && this.selectedContact.relations) {
            // already have any platform role at this org?
            if (
                selectedRole.includes('customer') &&
                this.selectedContact.relations.filter(
                    (x: any) => x.organization.id === this.organization.id && x.role.includes('customer'),
                ).length > 0
            ) {
                this.canSelectOrg = false;

                // prohibit combining admin and basic
                if ((
                    selectedRole === 'customer-admin' &&
                    this.selectedContact.relations.filter((x: any) => x.role === 'customer-basic').length > 0
                ) || (
                    selectedRole === 'customer-basic' &&
                    this.selectedContact.relations.filter((x: any) => x.role === 'customer-admin').length > 0
                )) {
                    this.canSelectOrg = false;
                    this.canSelectLocation = false;
                    this.canSelectRole = false;

                    return;
                }
            }

            // already have this role at the account or the org?
            if (
                this.selectedContact.relations.filter(
                    (x: any) => x.role === selectedRole && (
                        x.sfAccount.id === this.sfAccountId || x.sfAccount.id === this.organization.sfAccountId
                    ),
                ).length > 0
            ) {
                this.canSelectOrg = false;
                this.canSelectLocation = false;
            } else {
                // if we're at the location level, see if we already have this role at the location
                const toCheck = (this.locations.length > 0) ? this.locations : [{ sfAccountId: this.sfAccountId }];

                // already have some locations selected?
                toCheck.forEach((loc: any) => {
                    const found = this.selectedContact.relations.find(
                        (x: any) =>
                            x.sfAccount.id === loc.sfAccountId && (
                                x.role === selectedRole ||
                                (selectedRole.includes('customer') && x.role.includes('customer'))
                            ),
                    );
                    if (found) {
                        this.canSelectOrg = false;
                        this.locationsAssigned++;
                    } else {
                        opts.push({ value: loc.id, label: loc.name });
                    }
                });
            }
        } else {
            this.locations.forEach((loc: any) => opts.push({ value: loc.id, label: loc.name }));
        }

        if (opts.length === 0) this.canSelectLocation = false;

        this.orgOrLocation = OrgOrLocationEditMode.None;
        this.locationOpts = opts;
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

enum OrgOrLocationEditMode {
    None = 0,
    Organization = 1,
    Location = 2,
}
