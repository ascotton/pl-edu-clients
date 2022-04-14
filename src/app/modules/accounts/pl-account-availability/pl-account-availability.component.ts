import { Component, Input, Output, EventEmitter } from '@angular/core';

import { first } from 'rxjs/operators';

import { ToastrService } from 'ngx-toastr';

import { PLGraphQLService, PLConfirmDialogService } from '@root/index';

import { PLAccountsService } from '@root/src/app/common/services';

@Component({
    selector: 'pl-account-availability',
    templateUrl: './pl-account-availability.component.html',
    styleUrls: ['./pl-account-availability.component.less'],
})
export class PLAccountAvailabilityComponent {
    @Input() location: any;
    @Input() schoolYear: String;
    @Output() readonly isDirtyChanged = new EventEmitter<Boolean>();

    blocks: any[];
    ready = false;
    selectedHours: any = {};
    saving = false;
    timezone = '';
    readOnly = true;
    isDirty = false;

    constructor(
        private plGraphQL: PLGraphQLService,
        private plConfirm: PLConfirmDialogService,
        private toastr: ToastrService,
        private plAccountsService: PLAccountsService,
    ) {}

    ngOnInit() {
        this.plAccountsService
            .getAccountPermissions(this.location.sfAccountId, [
                permissionsMap.SET_AVAILABILITY,
            ])
            .pipe(first())
            .subscribe((res: any) => {
                this.readOnly = !res[this.location.sfAccountId].includes(permissionsMap.SET_AVAILABILITY);

                this.get();
            });
    }

    ngOnChanges(changes: any) {
        if (this.ready) this.get();
    }

    onClickSubmitForm() {
        this.plConfirm.show({
            header: 'Confirm Hours',
            content: `<span style="padding-bottom:12px;">Are you sure you want to update this location's available hours?</span>`,
            primaryLabel: 'Confirm',
            secondaryLabel: 'Cancel',
            primaryCallback: () => {
                this.plConfirm.hide();

                this.saving = true;

                this.save();
            },
            secondaryCallback: () => {},
        });
    }

    onHoursChanged(selectedHours: any) {
        this.selectedHours = selectedHours;

        if (!selectedHours.init) {
            this.isDirty = true;
            this.isDirtyChanged.emit(this.isDirty);
        }
    }

    ///////////
    // private
    //////////
    private get() {
        this.ready = false;

        // get blocks
        const payload = {
            locationId: this.location.id,
            schoolYear: this.schoolYear,
        };

        this.plGraphQL
            .query(GQL_GET_AVAILABILITY, payload, { debug: false })
            .pipe(first())
            .subscribe(
                (res: any) => {
                    this.blocks = res.locationAvailabilityBlocks;
                    this.ready = true;
                },
                (err: any) => {
                    console.error(err);

                    this.toastr.error(err.message, 'Unexpected Problem', {
                        positionClass: 'toast-bottom-right',
                    });
                },
            );
    }

    private save() {
        const payloadBlocks: any = [];

        if (this.selectedHours.blocks.length === 0) {
            payloadBlocks.push({
                locationId: this.location.id,
                schoolYearId: this.schoolYear,
                availableStations: 0,
                day: 'M',
                start: '00:00:00',
                end: '00:00:00',
                hardStop: false,
                hardStart: false,
                notes: '',
            });
        } else {
            for (const block of this.selectedHours.blocks) {
                payloadBlocks.push({
                    locationId: this.location.id,
                    schoolYearId: this.schoolYear,
                    availableStations: block.availableStations,
                    day: block.day,
                    start: block.start,
                    end: block.end,
                    hardStop: false,
                    hardStart: false,
                    notes: '',
                });
            }
        }

        const payload = {
            locationAvailabilityBlocks: payloadBlocks,
        };

        this.plGraphQL
            .mutate(GQL_SET_AVAILABILITY, payload, { debug: false })
            .pipe(first())
            .subscribe(
                (res: any) => {
                    const errors = res.errors;
                    if (errors && errors.length) {
                        for (const e of errors) {
                            console.error(e);
                            this.toastr.error(e.message, 'Unexpected Problem', {
                                positionClass: 'toast-bottom-right',
                            });
                        }
                    } else {
                        this.toastr.success('Availability saved!', 'Complete', {
                            positionClass: 'toast-bottom-right',
                        });

                        this.isDirty = false;
                        this.isDirtyChanged.emit(this.isDirty);
                    }

                    this.saving = false;
                },
                (err: any) => {
                    console.error(err);

                    this.toastr.error(err.message, 'Unexpected Problem', {
                        positionClass: 'toast-bottom-right',
                    });

                    this.saving = false;
                },
            );
    }
}

const GQL_GET_AVAILABILITY = `
    query getLocationAvailabilityBlocks($locationId: UUID!, $schoolYear: String!) {
        locationAvailabilityBlocks(locationId: $locationId, schoolYear: $schoolYear) {
            edges {
                node {
                    availableStations,
                    day,
                    start,
                    end,
                    hardStop,
                    hardStart,
                    notes
                }
            }
        }
    }
`;

const GQL_SET_AVAILABILITY = `
    mutation setLocationAvailabilityBlocks($locationAvailabilityBlocks: [SetLocationAvailabilityBlockInputData]!) {
        setLocationAvailabilityBlocks(input: { locationAvailabilityBlocks: $locationAvailabilityBlocks }) {
            status
            errors {
                code
                message
                field
            }
        }
    }
`;

const permissionsMap = {
    SET_AVAILABILITY: 'availability.set_locationavailabilityblock',
};
