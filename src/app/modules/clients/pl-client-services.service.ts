import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { first, map } from 'rxjs/operators';

import * as moment from 'moment';

import {
    PLGraphQLService,
    PLTransformGraphQLService,
    PLLodashService,
    PLGQLQueriesService,
    PLGQLStringsService,
    PLApiClientServicesService,
} from '@root/index';

import { CLINICAL_PRODUCT_TYPE } from '../../common/constants/index';
import { serviceEvalStageOptions } from '../../common/services/pl-client-service';

@Injectable()
export class PLClientServicesService {
    CLINICAL_PRODUCT = CLINICAL_PRODUCT_TYPE;

    clientContactFields = `
        contacts {
            uuid
            id
            contactPreference
            firstName
            lastName
            primaryLanguage {
              code
            }
            street
            city
            state
            postalCode
            email
            phone
            isEmergency
            isResponsibleParty
            contactType
            created
        }
    `;

    private readonly referralStateMap: any = {
        UNMATCHED_PL_REVIEW: 'Unmatched',
        UNMATCHED_OPEN_TO_PROVIDERS: 'Open',
        PROPOSED: 'Proposed',
        MATCHED: 'Matched',
    };

    constructor(
        private plGraphQL: PLGraphQLService,
        private plTransformGraphQL: PLTransformGraphQLService,
        private plLodash: PLLodashService,
        private plGQLQueries: PLGQLQueriesService,
        private plGQLStrings: PLGQLStringsService,
        private plApiClientServices: PLApiClientServicesService,
    ) { }

    getDirectServicesAndReferrals(clientId: string): Observable<any> {
        return forkJoin(
            this.getDirectServices(clientId).pipe(first()),
            this.getDirectReferrals(clientId).pipe(first()),
        ).pipe(
            map(([services, referrals]: [any, any]) => {
                return this.joinServicesAndReferrals(services, referrals);
            }),
        );
    }

    getEvaluationServicesAndReferrals(clientId: string) {
        return forkJoin(
            this.getEvaluationServices(clientId).pipe(first()),
            this.getEvaluationReferrals(clientId).pipe(first()),
        ).pipe(
            map(([services, referrals]: [any, any]) => {
                return this.joinServicesAndReferrals(services, referrals);
            }),
        );
    }

    getReferrals(clientId: string): Observable<{ referrals: any[] }> {
        // Filter out states we do not want.
        const stateFilters = ['UNMATCHED_PL_REVIEW', 'UNMATCHED_OPEN_TO_PROVIDERS', 'PROPOSED', 'MATCHED'];
        const params = {
            clientId,
            state_In: stateFilters.join(','),
        };

        return this.plGraphQL.query(
            `query ${this.plGQLQueries.queries.clientServicesReferrals.cacheName}(
                $clientId: String,
                $state_In: String
             ) {
                ${this.plGQLQueries.queries.clientServicesReferrals.apiName}(clientId: $clientId, state_In: $state_In) {
                    totalCount
                    edges {
                        node {
                            id
                            created
                            createdBy {
                                id
                            }
                            dueDate
                            schoolYear {
                                id
                                code
                                name
                            }
                            client {
                                id
                            }
                            providerType {
                                id
                                longName
                            }
                            productType {
                                id
                                code
                            }
                            provider {
                                id
                                firstName
                                lastName
                            }
                            state
                            clientService {
                                id
                            }
                            notes
                            esy
                            grade
                            frequency
                            interval
                            duration
                            grouping
                            reason
                            permissions {
                                matchProvider
                                declineReferral
                                deleteReferral
                                unmatchReferral
                                updateReferral
                                convertReferral
                            }
                            isShortTerm
                            language {
                                name
                            }
                            assessmentPlanSignedOn
                            meetingDate
                            hasNotes
                        }
                    }
                }
             }`,
            params,
        ).pipe(
            map((res: any) => ({
                referrals: res.referrals,
            })),
        );
    }

    getProviderReferrals(query: any) {
        const params = {
            ...query
        };

        return this.plGraphQL.query(
            `query ${this.plGQLQueries.queries.clientServicesReferrals.cacheName}(
                $state_In: String,
                $schoolYearCode_In: String,
                $productTypeCode_In: String,
                $clientOrganizationId_In: String,
                $clientLocationId_In: String,
                $providerFullName_Icontains: String,
                $clientFullName_Icontains: String,
                $providerTypeCode_In: String,
                $evaluationStage_In: String,
                $providerId: String,
                $accountCamId: String,
                $first: Int,
                $offset: Int,
                $orderBy: String,
                $orderByDueDate: String
             ) {
                ${this.plGQLQueries.queries.clientServicesReferrals.apiName}(
                    state_In: $state_In,
                    schoolYearCode_In: $schoolYearCode_In,
                    productTypeCode_In: $productTypeCode_In,
                    clientOrganizationId_In: $clientOrganizationId_In,
                    clientLocationId_In: $clientLocationId_In,
                    providerFullName_Icontains: $providerFullName_Icontains,
                    clientFullName_Icontains: $clientFullName_Icontains,
                    providerTypeCode_In: $providerTypeCode_In,
                    evaluationStage_In: $evaluationStage_In,
                    providerId: $providerId,
                    accountCam: $accountCamId,
                    first: $first,
                    offset: $offset,
                    orderBy: $orderBy,
                    orderByDueDate: $orderByDueDate
                ) {
                    totalCount
                    pageInfo {
                        hasNextPage
                    }
                    edges {
                        node {
                            id
                            created
                            createdBy {
                                id
                            }
                            dueDate
                            schoolYear {
                                id
                                code
                                name
                            }
                            client {
                                id
                                ${this.plGQLStrings.clientName}
                                ${this.plGQLStrings.clientLanguages}
                                ${this.plGQLStrings.clientEvalDates}
                                ${this.clientContactFields}
                                permissions {
                                    updatePii
                                }
                                locations {
                                    edges {
                                        node {
                                            id
                                            name
                                            organization {
                                                id
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                            providerType {
                                id
                                longName
                                shortName
                            }
                            productType {
                                id
                                code
                            }
                            provider {
                                id
                                firstName
                                lastName
                            }
                            state
                            clientService {
                                id
                                isActive
                                created
                                evaluation {
                                    id
                                    service {
                                        id
                                        isActive
                                        code
                                        name
                                        productType {
                                          id
                                          isActive
                                          code
                                          name
                                        }
                                    }
                                    evaluationType
                                    status
                                    statusDisplay
                                    referringProvider {
                                        id
                                        firstName
                                        lastName
                                    }
                                    assignedTo {
                                        id
                                        firstName
                                        lastName
                                    }
                                    dueDate
                                    evaluationTypeDisplay
                                    permissions {
                                        updateEvaluation
                                        modifyEvaluationDates
                                        reassignEvaluation
                                        reassignEvaluationWithoutBillingImplicationCheck
                                    }
                                    evaluationStage
                                    meetingDate
                                    assessmentPlanSignedOn
                                    matchingDate
                                }
                            }
                            notes
                            esy
                            grade
                            frequency
                            interval
                            duration
                            grouping
                            permissions {
                                matchProvider
                                declineReferral
                                deleteReferral
                                unmatchReferral
                                updateReferral
                                convertReferral
                            }
                            isShortTerm
                            language {
                                name
                            }
                            assessmentPlanSignedOn
                            meetingDate
                            hasNotes
                            matchingDate
                        }
                    }
                }
             }`,
            params,
        ).pipe(
            map((res: any) => {
                return {
                    totalCount: res.referrals_totalCount,
                    referrals: res.referrals,
                    hasNextPage: res.referrals_pageInfo.hasNextPage
                };
            }),
        );
    }

    getAssessmentReferralById(referralId: string): Observable<any> {
        const params = { id: referralId };

        return this.plGraphQL.query(
            `query Referral(
                $id: ID!,
             ) {
                referral(
                    id: $id,
                ) {
                    id
                    created
                    createdBy {
                        id
                    }
                    dueDate
                    schoolYear {
                        id
                        code
                        name
                    }
                    client {
                        id
                        ${this.plGQLStrings.clientName}
                        ${this.plGQLStrings.clientLanguages}
                        ${this.plGQLStrings.clientEvalDates}
                        ${this.clientContactFields}
                        permissions {
                            updatePii
                        }
                        locations {
                            edges {
                                node {
                                    id
                                    name
                                    organization {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                    providerType {
                        id
                        longName
                        shortName
                    }
                    productType {
                        id
                        code
                    }
                    provider {
                        id
                        firstName
                        lastName
                    }
                    state
                    clientService {
                        id
                    }
                    notes
                    esy
                    grade
                    frequency
                    interval
                    duration
                    grouping
                    permissions {
                        matchProvider
                        declineReferral
                        deleteReferral
                        unmatchReferral
                        updateReferral
                        convertReferral
                    }
                    isShortTerm
                    language {
                        name
                    }
                    assessmentPlanSignedOn
                    meetingDate
                    hasNotes
                    matchingDate
                }
             }`,
            params,
        ).pipe(
            map((res: any) => res.referral),
        );
    }

    getAssessmentsReferrals(query: any): Observable<any> {
        return this.getProviderReferrals(query).pipe(first());
    }

    getAssessmentsReferralsAndServices(query: any): Observable<any[]> {
        return forkJoin([
            this.getAllEvaluations(query).pipe(first()),
            this.getProviderReferrals(query).pipe(first()),
        ]).pipe(
            map(([evaluations, referrals]: [any, any]) => {
                return this.joinServicesAndReferrals(evaluations, referrals);
            }),
        );
    }

    getClientServices(clientId: string): Observable<{ clientServices: any[] }> {
        const params = { clientId };

        return this.plGraphQL.query(
            `query ${this.plGQLQueries.queries.clientServicesServices.cacheName}($clientId: ID) {
                ${this.plGQLQueries.queries.clientServicesServices.apiName}(clientId: $clientId) {
                    edges {
                        node {
                            ... on DirectService {
                                ${this.plGQLStrings.directServiceFull}
                                referrals {
                                    edges {
                                        node {
                                            ...ConvertedReferralFields
                                            schoolYear {
                                                id
                                                code
                                                name
                                                __typename
                                            }
                                        }
                                    }
                                }
                            }
                            ... on Evaluation {
                                id
                                isActive
                                created
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
                                referrals {
                                    edges {
                                        node {
                                            ...ConvertedReferralFields
                                            schoolYear {
                                                id
                                                code
                                                name
                                                __typename
                                            }
                                        }
                                    }
                                }
                                assessmentPlanSignedOn
                                meetingDate
                                evaluationStage
                            }
                        }
                    }
                }
             }
             fragment ConvertedReferralFields on Referral {
                 id
                 created
                 createdBy {
                     id
                     firstName
                     lastName
                 }
                 notes
                 noteModifiedBy {
                     firstName
                     lastName
                 }
                 noteLastModified
                 esy
                 grade
                 frequency
                 interval
                 duration
                 grouping
                 isShortTerm
                 language {
                     code
                     name
                 }
                 hasNotes
             }`,
            params,
        ).pipe(
            map((res: any) => ({ clientServices: res.clientServices })),
        );
    }

    getAllEvaluations(query: any): Observable<any> {
        const params = {
            ...query,
        };

        return this.plGraphQL.query(
            `query evaluations(
                $assignedToId: String,
                $schoolYearCode_In: String,
                $status_In: String,
                $clientOrganizationId_In: String,
                $clientLocationId_In: String
                $providerFullName_Icontains: String,
                $clientFullName_Icontains: String,
                $stage_In: String,
                $providerTypeCode_In: String,
                $cam: Boolean,
                $first: Int,
                $offset: Int
            ) {
                evaluations(
                    assignedToId: $assignedToId,
                    schoolYearCode_In: $schoolYearCode_In,
                    status_In: $status_In,
                    clientOrganizationId_In: $clientOrganizationId_In,
                    clientLocationId_In: $clientLocationId_In,
                    providerFullName_Icontains: $providerFullName_Icontains,
                    clientFullName_Icontains: $clientFullName_Icontains,
                    stage_In: $stage_In,
                    providerTypeCode_In: $providerTypeCode_In,
                    cam: $cam,
                    first: $first,
                    offset: $offset
                ) {
                    totalCount
                    edges {
                        node {
                            id
                            isActive
                            created
                            createdBy {
                                ${this.plGQLStrings.createdBy}
                            }
                            client {
                                id
                                ${this.plGQLStrings.clientName}
                                ${this.plGQLStrings.clientLanguages}
                                ${this.plGQLStrings.clientEvalDates}
                                ${this.clientContactFields}
                                permissions {
                                    updatePii
                                }
                                locations {
                                    edges {
                                        node {
                                            id
                                            name
                                            organization {
                                                id
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                            referrals {
                                edges {
                                    node {
                                        id
                                        state
                                        providerType {
                                            id
                                            longName
                                            shortName
                                        }
                                        hasNotes
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
                            evaluationStage
                            meetingDate
                            assessmentPlanSignedOn
                            matchingDate
                        }
                    }
                }
            }`,
            params,
        ).pipe(
            map((res: any) => res.evaluations),
        );
    }

    private getDirectServices(clientId: string): Observable<any[]> {
        return this.getClientServices(clientId).pipe(
            map(({ clientServices }: { clientServices: any[] }) => {
                const servicesWithEvaluationType = clientServices.filter((s: any) => s.evaluationType === undefined);
                return this.formatDirectServices(servicesWithEvaluationType);
            }),
        );
    }

    private getDirectReferrals(clientId: string): Observable<any[]> {
        return this.getReferrals(clientId).pipe(
            map(({ referrals }: { referrals: any }) => {
                const directServiceReferrals = referrals.filter((r: any) => {
                    const code = r.productType.code;
                    const validCode = (
                        code === this.CLINICAL_PRODUCT.CODE.DIR_SVC ||
                        code === this.CLINICAL_PRODUCT.CODE.SV ||
                        code === this.CLINICAL_PRODUCT.CODE.BIG ||
                        code === this.CLINICAL_PRODUCT.CODE.TG
                    );

                    return validCode;
                });

                return this.formatDirectReferrals(directServiceReferrals);
            }),
        );
    }

    private formatDirectServices(services: any[]) {
        services.forEach((service: any) => {
            service.xType = 'directService';
            service.xCreated = moment(service.created, 'YYYY-MM-DD').format('MM/DD/YYYY');
            service.xActive = service.isActive ? true : 'false';
            service.minutesRemaining = (service.totalMinutesRequired || 0) - (service.minutesReceived || 0);
            service.xStart = (service.startDate ? moment(service.startDate, 'YYYY-MM-DD').format('MM/DD/YYYY') : '');
            service.xEnd = (service.endDate ? moment(service.endDate, 'YYYY-MM-DD').format('MM/DD/YYYY') : '');
        });
        return services;
    }

    private formatDirectReferrals(referrals: any[]) {
        referrals.forEach((referral: any) => {
            referral.xType = 'directReferral';
            referral.xStatus = this.referralStateMap[referral.state];
            referral.xCreated = moment(referral.created, 'YYYY-MM-DD').format('MM/DD/YYYY');
        });
        return referrals;
    }

    getEvaluationServices(clientId: string): Observable<any[]> {
        return this.getClientServices(clientId).pipe(
            map(({ clientServices }: { clientServices: any }) => {
                const servicesWithEvaluationType = clientServices.filter((clientService: any) => {
                    return clientService.evaluationType !== undefined;
                });

                return this.formatEvaluationServices(servicesWithEvaluationType);
            }),
        );
    }

    getEvaluationReferrals(clientId: string): Observable<any[]> {
        return this.getReferrals(clientId).pipe(
            map(({ referrals }: { referrals: any }) => {
                const forEvalAndAssessments = referrals.filter((referral: any) => {
                    return referral.productType.code === 'evaluation_with_assessments';
                });

                return this.formatEvaluationReferrals(forEvalAndAssessments);
            }),
        );
    }

    private formatEvaluationServices(services: any[]) {
        services.forEach((service: any) => {
            service.xType = 'evaluationService';
            service.xCreated = moment(service.created, 'YYYY-MM-DD').format('MM/DD/YYYY');
            service.xName = service.service ? service.service.name : '';
            service.xCreatedBy = service.createdBy ?
                `${service.createdBy.firstName} ${service.createdBy.lastName}` : '';
            service.xAssignedTo = service.assignedTo ?
                `${service.assignedTo.firstName} ${service.assignedTo.lastName}` : '';
            service.xDueDate = (service.dueDate ?
                moment(service.dueDate, 'YYYY-MM-DD').format('MM/DD/YYYY') : '');
            service.xSignedOn = (service.assessmentPlanSignedOn ?
                moment(service.assessmentPlanSignedOn, 'YYYY-MM-DD').format('MM/DD/YYYY') : '');
            service.xStage = this.getEvaluationStageDisplay(service.evaluationStage);
            service.xMeetingDate = (service.meetingDate ?
                moment(service.meetingDate, 'YYYY-MM-DD').format('MM/DD/YYYY') : '');
        });
        return services;
    }

    private formatEvaluationReferrals(referrals: any[]) {
        referrals.forEach((referral: any) => {
            referral.xType = 'evaluationReferral';
            referral.xStatus = this.referralStateMap[referral.state];
            referral.xCreated = moment(referral.created, 'YYYY-MM-DD').format('MM/DD/YYYY');
        });
        return referrals;
    }

    private joinServicesAndReferrals(services: any[], referrals: any[]): any[] {
        // Sort - referrals by created, services by active. Then referrals on top (first);
        // slice() to create shallow copy. sort2d() modifies the array parameter.
        return [
            ...this.plLodash.sort2d(referrals.slice(), 'createdAt', 'descending'),
            ...this.plLodash.sort2d(services.slice(), 'isActive', 'descending'),
        ];
    }

    private getEvaluationStageDisplay(stageValue: string): string {
        const stageOpt = serviceEvalStageOptions.find(opt => opt.value === stageValue);
        return stageOpt ? stageOpt.label : '';
    }
}
