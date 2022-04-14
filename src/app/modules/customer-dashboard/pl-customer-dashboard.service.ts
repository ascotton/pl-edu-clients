import { Injectable } from '@angular/core';
import { first, tap } from 'rxjs/operators';

import { PLGraphQLService } from '@root/index';
import {
  PLUtilService, PLComponentStateInterface, PLSchoolYearsService,
  PLComponentInitObservable, PLComponentInitObservableHandler,
} from '@common/services';

const saveIdeaFeedbackMutation = require('./queries/save-idea-feedback.graphql');
const clientsByNameQuery = require('./queries/clients-by-name.graphql');
const locationsByNameQuery = require('./queries/locations-by-name.graphql');

@Injectable()
export class PLCustomerDashboardService {

  constructor(
    private util: PLUtilService,
    private plGraphQL: PLGraphQLService,
    private plSchoolYears: PLSchoolYearsService,
  ) {}

  // ------------------------------
  // single fetch data API methods
  // ------------------------------

  getStatsIeps$(variables: { schoolYearCode: string, id: string, isLocation: boolean }, state: PLComponentStateInterface) {
    return this.plGraphQL.query(GQL_STATS_IEPS, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('api - stats ieps', res, state)),
      );
  }

  getStatsAbsences$(variables: {schoolYearCode: string, id: string, isLocation: boolean }, state: PLComponentStateInterface) {
    return this.plGraphQL.query(GQL_STATS_ABSENCES, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('api - stats absences', res, state)),
      );
  }

  getStatsServices$(variables: { schoolYearCode: string, id: string, isLocation: boolean }, state: PLComponentStateInterface) {
    return this.plGraphQL.query(GQL_STATS_SERVICES, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('api - stats services', res, state)),
      );
  }

  getStatsStudents$(variables: { schoolYearCode: string, id: string, isLocation: boolean }, state: PLComponentStateInterface) {
    return this.plGraphQL.query(GQL_STATS_STUDENTS, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('api - stats students', res, state)),
      );
  }

  getOrganizationOverview$(variables: {id: string}, state: PLComponentStateInterface) {
    return this.plGraphQL.query(GQL_QUERY_ORGANIZATION, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('api - stats ieps', res, state)),
      );
  }

  // GQL
  getLocations$(variables: any, state: PLComponentStateInterface) {
    return this.plGraphQL.query(GQL_QUERY_LOCATIONS, {
        first: 100,
        isActive: true,
        ...variables,
      }, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('api - locations', res, state)),
      );
  }

  // GQL
  getOrganizations$(variables: any, state: PLComponentStateInterface) {
    return this.plGraphQL.query(GQL_QUERY_ORGANIZATIONS, {
      first: 100,
      isActive: true,
      ...variables,
    }, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('api - organizations', res, state)),
      );
  }

  searchLocationsByName$(
    variables: {
      organizationId_in: Array<String>,
      isActive: Boolean,
      name_Icontains: String,
    },
    state: PLComponentStateInterface) {
    return this.plGraphQL.query(locationsByNameQuery, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('api - search locations by name', res, state)),
      );
  }

  searchClientsByName$(
    variables: {
      organizationId_in: Array<String>,
      locationId: String,
      schoolYearCode_in: String,
      phiOnly: Boolean,
      fullName_Icontains: String },
    state: PLComponentStateInterface)
  {
    return this.plGraphQL.query(clientsByNameQuery, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('api - search clients by name', res, state)),
      );
  }

  saveIdeaFeedback$(variables: {}, state: PLComponentStateInterface) {
    return this.plGraphQL.mutate(saveIdeaFeedbackMutation, variables, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('api - save idea feedback', res, state)),
      );
  }

  getSchoolYearInitObservable(handler: PLComponentInitObservableHandler): PLComponentInitObservable {
    return {
      name: 'school-year',
      observable: this.plSchoolYears.getCurrentSchoolYear(),
      isDataReady: (data: any, state: PLComponentStateInterface) => {
        return data.code;
      },
      handler,
    }
  }

  getUserOrganizationInitObservable(handler: PLComponentInitObservableHandler): PLComponentInitObservable {
    return {
      name: 'user-organization',
      observable: this.getOrganizations(),
      isDataReady: (data: any, state: PLComponentStateInterface) => {
        return data.organizations;
      },
      handler,
    }
  }

  getOrganizations() {
    return this.plGraphQL.query(GQL_QUERY_ORGANIZATIONS, {
      first: 100,
      isActive: true,
    }, {})
      .pipe(
        first(),
        tap(res => this.util.debugLogApi('api - organizations', res)),
      );
  }
}

const GQL_STATS_IEPS = `
query statsIeps($schoolYearCode: String!, $id: UUID!, $isLocation: Boolean) {
    statsIeps(schoolYearCode: $schoolYearCode, id: $id, isLocation: $isLocation) {
      statusCounts {
        name
        count
      }
      serviceStatusCounts {
        name
        exited
        statusCounts {
          name
          count
        }
      }
    }
}
`;

const GQL_STATS_ABSENCES = `
query statsAbsences($schoolYearCode: String!, $id: UUID!, $isLocation: Boolean) {
    statsAbsences(schoolYearCode: $schoolYearCode, id: $id, isLocation: $isLocation) {
      absences1
      absences2Or3
      absences4OrMore
    }
}
`;

const GQL_STATS_SERVICES = `
query statsServices($schoolYearCode: String!, $id: UUID!, $isLocation: Boolean) {
    statsServices(schoolYearCode: $schoolYearCode, id: $id, isLocation: $isLocation) {
      statusCounts {
        name
        count
      }
    }
}
`;

const GQL_STATS_STUDENTS = `
query statsStudents($schoolYearCode: String!, $id: UUID!, $isLocation: Boolean) {
    statsStudents(schoolYearCode: $schoolYearCode, id: $id, isLocation:$isLocation) {
      students
      services
    }
}
`;

const GQL_QUERY_ORGANIZATION = `
query organizationOverview($id: ID!) {
     organization(id: $id) {
         accountOwner {
             email
             firstName
             lastName
             id
             profile {
                 id
                 primaryPhone
             }
         }
         accountCqm {
             email
             firstName
             lastName
             id
             profile {
                 id
                 primaryPhone
             }
         }
         id
         isActive
         lead {
             firstName
             lastName
             id
         }
         name
         shippingAddress {
             street
             city
             state
             stateDisplay
             postalCode
             country
         }
         state
         website
         timezone
         dateTherapyStarted
         projectedTherapyStartDate
    }
}
`;

const GQL_QUERY_LOCATIONS = `
query locations(
    $after: String,
    $first: Int,
    $id_In: String,
    $isActive: Boolean,
    $name_Icontains: String,
    $offset: Int,
    $orderBy: String,
    $organizationId_In: String
  ) {
    locations(
        after: $after,
        first: $first,
        id_In: $id_In,
        isActive: $isActive,
        name_Icontains: $name_Icontains,
        offset: $offset,
        orderBy: $orderBy,
        organizationId_In: $organizationId_In
    ) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
            node {
                id
                locationType
                name
                state
                accountOwner {
                  username
                  email
                  firstName
                  lastName
                }
                timezone
                organizationName
                organization {
                    id
                }
            }
        }
    }
}
`;

const GQL_QUERY_ORGANIZATIONS = `
query organizations(
    $after: String,
    $first: Int,
    $isActive: Boolean,
    $offset: Int,
    $orderBy: String
  ) {
    organizations(
        after: $after,
        first: $first,
        isActive: $isActive,
        offset: $offset,
        orderBy: $orderBy
    ) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
            node {
                accountOwner {
                email
                firstName
                id
                lastName
                profile {
                    id
                    primaryPhone
                }
            }
            id
            isActive
            lead {
                firstName
                lastName
                id
            }
            name
            shippingAddress {
                street
                city
                state
                stateDisplay
                postalCode
                country
            }
            state
            website
            timezone
            dateTherapyStarted
            projectedTherapyStartDate
            }
        }
    }
}
`;
