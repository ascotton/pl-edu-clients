import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PLHttpService, PLUrlsService } from '@root/index';
import { PLQualification } from '@common/interfaces';

interface ProviderQualificationResults {
    qualifications: PLQualification[];
    totalCount: number;
}

@Injectable()
export class PLQualificationsService {

    constructor(
        private plHttp: PLHttpService,
        private plUrls: PLUrlsService,
    ) {}

    getQualificationsRequests(uuid: any): Observable<ProviderQualificationResults> {
        const url = `${this.plUrls.urls.qualifications}?provider_uuid=${uuid}`;
        return this.plHttp
            .get('', {}, url);
    }
}
