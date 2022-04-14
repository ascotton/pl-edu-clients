import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
// Models
import { PLInvoice } from './pl-invoice';

import { PLHttpService } from '@root/index';

@Injectable()
export class PLInvoiceService {

    constructor(private plHttp: PLHttpService) { }

    get(params?: any): Observable<any> {
        return this.plHttp.get('invoices', params).pipe(first());
    }

    // TODO: There is a new way to get the Period
    getPreview(): Observable<PLInvoice> {
        return this.plHttp.get('invoicesPreview').pipe(first());
    }

    save(invoice: any): Observable<any> {
        return this.plHttp.save('invoices', invoice).pipe(first());
    }

    retract(invoiceUuid: string) {
        const httpOpts = {
            url: `${this.plHttp.formUrl('invoices')}${invoiceUuid}/retract/`,
            data: {},
            method: 'PUT',
        };
        return this.plHttp.go(httpOpts).pipe(first());
    }
}
