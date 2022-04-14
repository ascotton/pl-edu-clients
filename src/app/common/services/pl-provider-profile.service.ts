import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, first, pluck } from 'rxjs/operators';

import { PLGraphQLService } from '@root/index';
import { PLProviderProfile, PLGridQueryParams } from '@common/interfaces';
import { Option } from '@root/src/lib-components/common/interfaces';

// tslint:disable-next-line: no-require-imports
const providerProfilesQuery = require('./queries/provider-profiles.graphql');

// tslint:disable-next-line: interface-over-type-literal
type ProviderProfileResults = {
    providers: PLProviderProfile[];
    totalCount: number;
};

interface ProvidersQueryParams extends PLGridQueryParams {
    lastName_Icontains?: string;
    firstName_Icontains?: string;
    locationId?: string;
    organizationId?: string;
}

@Injectable()
export class PLProviderProfileService {

    private limit: number;

    notificationPreferencesOptions: Option[] = [
        {
            value: 'EMAIL',
            label: 'Email',
        },
        {
            value: 'SMS',
            label: 'SMS',
        },
        {
            value: 'PUSH',
            label: 'Push Notifications',
        },
    ];

    constructor(private plGraphQL: PLGraphQLService) {
        this.limit = 100;
    }

    // TODO: A Dinamic Query can be done
    getProviderProfiles(params: ProvidersQueryParams): Observable<ProviderProfileResults> {
        const _params: ProvidersQueryParams = Object.assign({}, params, {
            isActive: true,
            userIsActive: true,
        });
        const limit = params.first || this.limit;
        const page = params.page || 1;
        if (params && !params.first) {
            _params.first = limit;
        }
        if (params && !params.offset) {
            _params.offset = (page - 1) * limit;
        }
        return this.plGraphQL.query(providerProfilesQuery, _params).pipe(
            map(({ providerProfiles, providerProfiles_totalCount }) => ({
                providers: providerProfiles,
                totalCount: providerProfiles_totalCount,
            })),
        );
    }

    getProviderLanguages() {
        return this.plGraphQL.query(GQL_GET_LANGUAGES).pipe(
            pluck('languages'),
            map((objs: any) => {
                return objs
                    .filter((obj: any) => obj.code !== 'en')
                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
                    .map((obj: any) => ({ label: obj.name, value: obj.code }));
            }),
            first(),
        );
    }

    setProviderLanguages(userId: any, languageCodes: any[]) {
        const variables = {
            userId,
            languageCodes,
        };

        return this.plGraphQL.query(GQL_MUTATE_PROVIDER_LANGUAGES, variables).pipe(first());
    }

    getAreasOfSpecialty() {
        return this.plGraphQL.query(GQL_GET_AREAS_OF_SPECIALTY).pipe(
            pluck('areasOfSpecialty'),
            map((objs: any) => {
                return objs
                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
                    .map((obj: any) => ({ label: obj.name, value: obj.id }));
            }),
            first(),
        );
    }

    setAreasOfSpecialty(userId: any, areaOfSpecialtyIds: any[]) {
        const variables = {
            userId,
            areaOfSpecialtyIds,
        };

        return this.plGraphQL.query(GQL_MUTATE_PROVIDER_AREAS_OF_SPECIALTY, variables).pipe(first());
    }

    setNotificationPreferences(userId: any, notificationPreference: string[]) {
        const variables = {
            userId,
            notificationPreference,
        };

        return this.plGraphQL.query(GQL_MUTATE_PROVIDER_NOTIFICATION_PREFERENCES, variables).pipe(first());
    }

    getNotificationPreferences(): Option[] {
        return this.notificationPreferencesOptions;
    }
}

const GQL_GET_LANGUAGES = `
    query languages {
        languages {
            edges {
                node {
                    code
                    name
                }
            }
        }
    }
`;

const GQL_MUTATE_PROVIDER_LANGUAGES = `
    mutation updateProviderProfile($userId: ID!, $languageCodes: [String]!) {
        updateProviderProfile(input: { userId: $userId, languageCodes: $languageCodes }) {
            errors { code }
        }
    }
`;

const GQL_GET_AREAS_OF_SPECIALTY = `
    query areasOfSpecialty {
        areasOfSpecialty {
            id
            name
        }
    }
`;

const GQL_MUTATE_PROVIDER_AREAS_OF_SPECIALTY = `
    mutation updateProviderProfile($userId: ID!, $areaOfSpecialtyIds: [ID]!) {
        updateProviderProfile(input: { userId: $userId, areaOfSpecialtyIds: $areaOfSpecialtyIds }) {
            errors { code }
        }
    }
`;

const GQL_MUTATE_PROVIDER_NOTIFICATION_PREFERENCES = `
    mutation updateProviderProfile($userId: ID!, $notificationPreference: [String]!) {
        updateProviderProfile(input: { userId: $userId, notificationPreference: $notificationPreference }) {
            errors { code }
        }
    }
`;
