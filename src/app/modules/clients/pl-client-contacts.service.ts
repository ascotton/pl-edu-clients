import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PLHttpService, PLUrlsService } from '@root/index';

@Injectable()
export class PLClientContactsService {
    private contacts: any[] = null;
    private client_id: string = "";

    constructor(private plHttp: PLHttpService, private plUrls: PLUrlsService) {
    }

    getClientContacts(client_id: string, params: any = {}, reQuery: boolean = false) {
        return new Observable((observer: any) => {
            // check if we already have contacts for this client_id but requery if needed or when params present
            if (this.contacts && client_id === this.client_id && !reQuery && Object.keys(params).length === 0) {
                observer.next(this.contacts);
            } else {
                this.getClientContactsCall(client_id, params)
                    .subscribe((res: any) => {
                        this.contacts = res;
                        this.client_id = client_id;
                        observer.next(this.contacts);
                    });
            }
        });
    }

    getClientContactsCall(clientId: string, params: any = {}): Observable<any> {
        const url = `${this.plUrls.urls.clients}${clientId}/contacts/`;
        return this.plHttp.get('', params, url);
    }
}
