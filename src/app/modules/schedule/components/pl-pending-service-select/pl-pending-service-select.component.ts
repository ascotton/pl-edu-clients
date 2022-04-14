import * as moment from 'moment';

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PLEvaluation } from '../../models';
import { PLLodashService } from '@root/index';

// TODO: Use ngChanges

@Component({
    selector: 'pl-pending-service-select',
    templateUrl: './pl-pending-service-select.component.html',
    styleUrls: ['./pl-pending-service-select.component.less'],
})
export class PLPendingServiceSelectComponent {
    private _pendingServices: PLEvaluation[];
    private _selectedService: string;
    tableData: any [];

    @Input()
    get pendingServices(): PLEvaluation[] {
        return this._pendingServices;
    }
    set pendingServices(value: PLEvaluation[]) {
        this._pendingServices = value;
        this.tableData = this.dataToTable(value);
    }

    @Input()
    get selectedService(): string {
        return this._selectedService;
    }
    set selectedService(value: string) {
        if (value !== this._selectedService) {
            this._selectedService = value;
            this.selectedServiceChange.emit(value);
        }
    }

    @Output() readonly selectedServiceChange: EventEmitter<string> = new EventEmitter();

    private dataToTable(pendingServices: PLEvaluation[]) {
        return pendingServices.map((service) => {
            return {
                uuid: service.uuid,
                clientName: service.client_expanded ?
                    `${service.client_expanded.first_name} ${service.client_expanded.last_name}`
                    : 'First Last',
                dueDate: service.due_date ?
                    moment(service.due_date, 'YYYY-MM-DD').format('MM/DD/YYYY')
                    : '',
                service: service.service_expanded ? service.service_expanded.name : 'Service',
                location: (service.client_expanded && service.client_expanded.locations &&
                    service.client_expanded.locations[0] && service.client_expanded.locations[0].name)
                    ? service.client_expanded.locations[0].name : '[no location]',
            };
        }).sort((a, b) => a.clientName.localeCompare(b.clientName));
    }

    onQuery(query: any) {
        let data = this.tableData;
        const { orderKey, orderDirection } = query.data;
        data = this.plLodash.sort2d(data, orderKey, orderDirection);
        const count = data.length;
        return { count, data };
    }

    constructor(private plLodash: PLLodashService) { }
}
