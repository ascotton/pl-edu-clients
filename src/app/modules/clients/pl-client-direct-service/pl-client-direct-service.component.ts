import { Component, Input } from '@angular/core';

import { PLHttpService, PLMayService, PLModalService, PLGQLClientServiceService } from '@root/index';

import { PLStatusDisplayService } from '@common/services/';

import { PLDirectServiceInterface } from '@common/interfaces';

import {
    serviceDurationPluralizationMapping,
    serviceIntervalOptions,
} from '@common/services/pl-client-service';

import { PLClientDirectServiceStatusEditComponent } from
    './pl-client-direct-service-status-edit/pl-client-direct-service-status-edit.component';
import { PLClientService } from '../pl-client.service';

@Component({
    selector: 'pl-client-direct-service',
    templateUrl: './pl-client-direct-service.component.html',
    styleUrls: ['./pl-client-direct-service.component.less'],
})
export class PLClientDirectServiceComponent {
    @Input() client: any = {};
    @Input() service: any = {};
    @Input() currentUser: any = {};

    private displayData: any = [];
    serviceDisplay: any = {};
    serviceFormatted: any = {};
    expanded = false;
    classesContainer: any = {
        expanded: this.expanded,
    };
    mayEditService = false;
    mayViewMinutes = false;
    activeOpts: any[] = [
        { value: true, label: 'Active' },
        { value: 'false', label: 'Inactive' },
    ];
    hasNotes = false;
    locationId: string;

    readonly durationPluralization = serviceDurationPluralizationMapping;
    readonly intervalOptions = serviceIntervalOptions;

    constructor(
        private plMay: PLMayService,
        private plModal: PLModalService,
        private plClientSvc: PLClientService,
        private plGQLClientService: PLGQLClientServiceService,
        private plStatusDisplayService: PLStatusDisplayService,
    ) { }

    ngOnInit() {
        this.init();
    }

    ngOnChanges(changes: any) {
        this.init();
    }

    init() {
        if (this.service) {
            this.mayEditService = this.plMay.editService(this.currentUser, this.client) &&
                (!this.currentUser.xProvider || this.providerTypeCanEditService());
            this.mayViewMinutes = !this.plMay.isCustomerAdmin(this.currentUser) &&
                !this.plMay.isCustomerBasic(this.currentUser);
        }
        this.formatService(this.service);
        this.setLocationId();

        const convertedReferral = this.service.referrals && this.service.referrals.length ? this.service.referrals[0] : null;
        this.hasNotes = convertedReferral && convertedReferral.hasNotes;
    }

    setLocationId(): void {
        if (this.client && this.client.locations && this.client.locations.length) {
            this.locationId = this.client.locations[0].id;
        }
    }

    formatService(service: any) {
        if (service) {
            this.serviceFormatted = Object.assign({}, this.service, {
            });
            this.setStatusDisplay();
            this.serviceDisplay = {
                minutesRequired: { value: service.totalMinutesRequired, label: 'Minutes Required' },
                minutesReceived: { value: service.minutesReceived, label: 'Minutes Received' },
                minutesRemaining: { value: service.minutesRemaining, label: 'Minutes Remaining' },
                interval: { value: service.interval, label: 'Session Interval' },
                frequency: { value: service.frequency, label: 'Session Frequency' },
                duration: { value: service.duration, label: 'Session Duration' },
                start: { value: service.xStart, label: 'Start Date' },
                end: { value: service.xEnd, label: 'End Date' },
            };
            this.serviceFormatted.referrals = service.referrals.find((referral: any) => referral.schoolYear);
        }
    }

    getFrequencyLabel(frequency: number): string {
        return this.plClientSvc.buildFrequencyLabel(frequency);
    }

    toggleExpand() {
        this.expanded = !this.expanded;
        this.classesContainer.expanded = this.expanded;
    }

    showStatusEdit() {
        let modalRef: any;
        const params = {
            onSubmit: (directService: PLDirectServiceInterface) => {
                this.service.status = directService.status;
                this.setStatusDisplay();
                this.plGQLClientService.updateDirectService({ id: this.service.id,  ...directService}).subscribe(
                    (res: any) => {
                        modalRef._component.destroy();
                    },
                    (err: any) => {
                        console.log('service status update fail: ', err);
                        modalRef._component.destroy();
                    },
                );
            },
            onCancel: () => {
                modalRef._component.destroy();
            },
            originalStatus: { value: this.service.status.toLowerCase(), label: this.serviceFormatted.statusDisplay },
        };
        this.plModal.create(PLClientDirectServiceStatusEditComponent, params)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }


    handleNoteCreated(event: any) {
        this.hasNotes = true;
    }

    private setStatusDisplay() {
        this.serviceFormatted.statusDisplay =
            this.plStatusDisplayService.getLabelForStatus('DirectService_' + this.service.status.toUpperCase());
    }

    private providerTypeCanEditService() {
        const provider = this.currentUser.xProvider;
        const serviceProvidersTypeCodes: any[] = this.service.service.providerTypes.map((type: any) => type.code);
        return provider && provider.providerTypeCode && serviceProvidersTypeCodes.includes(provider.providerTypeCode);
    }
}
