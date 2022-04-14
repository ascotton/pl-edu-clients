import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PLHttpService } from '@root/index';
import { MAX_QUERY_LIMIT } from '@common/services';
import { PLGridQueryParams } from '@common/interfaces';
import { PLClient } from '../models';
interface PLCaseloadParams extends PLGridQueryParams {
    provider: string;
}

@Injectable()
export class PLClientsService {

    private urlKey = 'clients';

    constructor(private plHttp: PLHttpService, @Inject(MAX_QUERY_LIMIT) private limit: number) {}

    get(uuid?: string): Observable<any> {
        let params: any = {};
        if (uuid) {
            params = { ...params, uuid };
        } else {
            params = { ...params, limit: this.limit };
        }
        return this.plHttp.get(this.urlKey, params);
    }

    getCaseload(params: PLCaseloadParams): Observable<{ results: PLClient[], count: number }> {
        return this.plHttp.get(this.urlKey, params);
    }
}
