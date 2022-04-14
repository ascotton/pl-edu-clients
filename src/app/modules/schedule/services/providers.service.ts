import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PLHttpService } from '@root/index';
import { MAX_QUERY_LIMIT } from '@common/services';

@Injectable()
export class PLProvidersService {

    private urlKey = 'providers';

    constructor(private plHttp: PLHttpService, @Inject(MAX_QUERY_LIMIT) private limit: number) {}

    get(limit?: number): Observable<any> {
        const params: any = {
            limit: limit || this.limit,
            is_active: true,
            user__is_active: true,
        };
        return this.plHttp.get(this.urlKey, params);
    }
}
