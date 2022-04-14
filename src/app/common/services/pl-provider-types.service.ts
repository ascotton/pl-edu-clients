import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PLGraphQLService } from '@root/index';
import { PLProviderType } from '@modules/schedule/models';

@Injectable()
export class PLProviderTypesService {

    constructor(private plGraphQL: PLGraphQLService) {}

    fetch(): Observable<{ providerTypes: PLProviderType[] }> {
        const variables: any = {
            first: 100,
        };
        return this.plGraphQL.query(
            `query ProviderTypes($first: Int) {
                providerTypes(first: $first) {
                    edges {
                        node {
                            id
                            code
                            longName
                            shortName
                            isActive
                        }
                    }
                }
            }`,
            variables, {});
    }
}
