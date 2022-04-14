module.exports = `query locationClients(
    $first: Int!,
    $orderBy: String,
    $after: String,
    $fullName_Icontains: String,
    $status_In: String,
    $locationId_In: String,
    $schoolYearCode_In: String
) {
    clients(
        first: $first,
        orderBy: $orderBy,
        after: $after,
        fullName_Icontains: $fullName_Icontains,
        status_In: $status_In,
        locationId_In: $locationId_In,
        schoolYearCode_In: $schoolYearCode_In
    ) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
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
                }
            }
        }
    }
}`;
