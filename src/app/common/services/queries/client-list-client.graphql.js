const Queries = require('../../gql/pl-gql-queries.service');

const gqlQueries = new Queries();

module.exports = `query ${gqlQueries.queries.clientsListClients.cacheName}(
    $first: Int!,
    $orderBy: String,
    $fullName_Icontains: String,
    $locationId_In: String,
    $schoolYearCode_In: String,
    $externalId: String,
    $birthday: Date,
    $offset: Int,
    $providerId: String,
    $status_In: String,
    $organizationId_In: String
) {
    ${gqlQueries.queries.clientsListClients.apiName}(
        first: $first,
        orderBy: $orderBy,
        fullName_Icontains: $fullName_Icontains,
        locationId_In: $locationId_In,
        schoolYearCode_In: $schoolYearCode_In,
        externalId: $externalId,
        birthday: $birthday,
        offset: $offset,
        providerId: $providerId,
        status_In: $status_In,
        organizationId_In: $organizationId_In
    ) {
        totalCount
        edges {
            node {
                id
                firstName
                lastName
                externalId
                birthday
                statusDisplay
                activeIep {
                    id
                    status
                    startDate
                    nextAnnualIepDate
                    nextEvaluationDate
                    prevEvaluationDate
                    type
                }
                referralMatchedCount
                locations {
                    edges {
                        node {
                            id
                            name
                            parent {
                                id
                                name
                            }
                        }
                    }
                }
                recentProvider {
                    id
                    firstName
                    lastName
                }
            }
        }
    }
}`;
