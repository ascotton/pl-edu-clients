import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PLHttpService, PLGraphQLService, PLGQLStringsService } from '@root/index';
import { map } from 'rxjs/operators';
import { PLClientService } from '../models';

@Injectable()
// TODO: Duplicate Service
export class PLClientServicesService {

    private urlKey = 'clientServices';

    constructor(
        private plHttp: PLHttpService,
        private plGraphQL: PLGraphQLService,
        private plGQLStrings: PLGQLStringsService,
    ) { }

    get(provider: string, client: string, billing_code: string): Observable<PLClientService[]> {
        return this.plHttp.get(this.urlKey, { provider, client, billing_code }).pipe(
            map(({ results }) => results),
        );
    }

    getClientServices(clientIds: string[], statusAll?: boolean, limit?: number, offset?: number): Observable<any> {
        const _clientIds = clientIds.join(',');
        // const _serviceTypeCodes = this._model.__providerServiceTypeList.map((item: any) => item.code).join(',');
        const params: any = { _clientIds /*, _serviceTypeCodes*/ };
        if (limit) {
            params._limit = limit;
        }
        if (offset || offset === 0) {
            params._offset = offset;
        }
        return this.plGraphQL.query(`query ClientServicesServices
            ($_clientIds: String, $_serviceTypeCodes: String ${statusAll ? '' : ', $_statusIn: String'} ${limit ? ', $_limit: Int!' : ''} ${offset || offset === 0 ? ', $_offset: Int!' : ''}) {
            clientServices (clientId_In: $_clientIds, serviceTypeCode_In: $_serviceTypeCodes ${statusAll ? '' : ', status_In: $_statusIn'} ${limit ? ', first: $_limit' : ''} ${offset || offset === 0 ? ', offset: $_offset' : ''}) {
                edges {
                    node {
                        __typename
                        ... on DirectService {
                            ${this.plGQLStrings.directServiceFull}
                        }
                        ... on Evaluation {
                            id
                            isActive
                            created
                            locked
                            evaluationType
                            areasOfConcern {
                                ${this.plGQLStrings.areasOfConcern}
                            }
                            assessmentsUsed {
                                ${this.plGQLStrings.assessmentsUsed}
                            }
                            createdBy {
                                ${this.plGQLStrings.createdBy}
                            }
                            client {
                                id
                                ${this.plGQLStrings.clientName}
                                ${this.plGQLStrings.clientLanguages}
                                ${this.plGQLStrings.clientEvalDates}
                                locations {
                                    edges {
                                        node {
                                            id
                                            name
                                        }
                                    }
                                }
                            }
                            bilingual
                            service {
                                ${this.plGQLStrings.service}
                            }
                            ${this.plGQLStrings.evaluation}
                            evaluationTypeDisplay
                            permissions {
                                updateEvaluation
                                reassignEvaluation
                                reassignEvaluationWithoutBillingImplicationCheck
                            }
                            reassignmentHasBillingImplications
                        }
                    }
                }
            }
        }`, params, {});
    }
}
