import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PLHttpService } from '@root/index';
import { MAX_QUERY_LIMIT } from '@common/services';
import { PLLocation } from '../models';

@Injectable()
export class PLLocationsService {

    private urlKey = 'locations';

    constructor(private plHttp: PLHttpService, @Inject(MAX_QUERY_LIMIT) private limit: number) {}

    get(params: any, limit: number = this.limit): Observable<{ results: PLLocation[], count: number; }> {
        let _params: any = { is_active: true };
        if (params && Object.keys(params).length > 0) {
            _params = params;
        }
        _params.limit = limit;
        return this.plHttp.get(this.urlKey, _params);
    }
}
