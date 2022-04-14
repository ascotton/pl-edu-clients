import { EntityState } from '@ngrx/entity';

export enum PL_SEARCH_CATEGORY {
    All = '0',
    Client = 'Client',
    Provider = 'Provider',
    Location = 'Location',
    Organization = 'Organization',
}

export const PL_SEARCH_CATEGORY_ORDER = {
    Client: 0,
    Provider: 3,
    Location: 1,
    Organization: 2,
};

export interface PLSearchResult {
    uuid: string;
    link: string;
    name: string;
    type: PL_SEARCH_CATEGORY;
    other?: string;
    initials?: string;
    icon?: string;
    lastViewed?: Date;
}

export interface PLLocationSearch {
    id: string;
    name: string;
    organizationName: string;
}

export interface PLOrganizationSearch {
    id: string;
    name: string;
}

export interface PLClientSearch {
    id: string;
    firstName: string;
    lastName: string;
    locations: { name: string }[];
}

export interface PLProviderSearch {
    id: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface PLSearchState {
    results: EntityState<PLSearchResult>;
    cached: boolean;
    clientsCount: number;
    providersCount: number;
    locationsCount: number;
    organizationsCount: number;
    recentHistory: EntityState<PLSearchResult>;
}
