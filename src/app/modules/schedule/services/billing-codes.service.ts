import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PLHttpService } from '@root/index';
import { PLBillingCode } from '@common/interfaces';
import { GROUP_BY } from '../helpers';

export interface PLEventFilter {
    key: string;
    backend: string[];
    name: string;
}

@Injectable()
export class PLBillingCodesService {

    constructor(private plHttp: PLHttpService) { }

    eventFilters: PLEventFilter[] = [
        {
            key: 'clients',
            backend: ['Work with Clients'],
            name: 'Work with Clients',
        },
        {
            key: 'student_absence',
            backend: ['Absent'],
            name: 'Student Absence',
        },
        {
            key: 'documentation_planning',
            backend: ['Documentation and Planning'],
            name: 'Documentation & Planning',
        },
        {
            key: 'cancellation',
            backend: ['Cancelled'],
            name: 'Cancellation',
        },
        {
            key: 'personal',
            backend: ['Personal'],
            name: 'Personal',
        },
        {
            key: 'fte_contract_services',
            backend: ['Contract Services'],
            name: 'Contract Services',
        },
        {
            key: 'other',
            backend: ['Other'],
            name: 'Other',
        },
    ];

    static groupByCreationCategory(codes: PLBillingCode[]): Map<any, any> {
        const _codes = codes.filter(code => !!code.event_creation_category);
        return GROUP_BY(_codes, (code: PLBillingCode) => code.event_creation_category);
    }

    static groupByEventCategory(codes: PLBillingCode[]): Map<any, any> {
        const _codes = codes.filter(code => !!code.event_category);
        return GROUP_BY(_codes, (code: PLBillingCode) => code.event_category.name);
    }

    getFilter(search: string) {
        return this.eventFilters.find(({ backend }) => backend.includes(search));
    }

    get(canProvide = false, client?: string): Observable<{ results: PLBillingCode[]}> {
        let params = {};
        if (canProvide) {
            params = { ...params, with_can_provide: 1 };
        }
        if (client) {
            params = { ...params, client };
        }
        return this.plHttp.get('billingCodes', params);
    }

    getNotesSchemas(): Observable<any> {
        return this.plHttp.get('notesSchemas');
    }

    getParticipants(billingCode: PLBillingCode): { hasLocations: boolean; hasClients: number; } {
        let hasClients = 0;
        if (!billingCode) {
            return { hasClients, hasLocations: false };
        }
        const hasLocations = billingCode.location_participates !== 'NONE';
        if (billingCode.client_participates !== 'NONE') {
            hasClients = billingCode.client_participates === 'SINGLE' ? 1 : 999;
        }
        return { hasLocations, hasClients };
    }
}
