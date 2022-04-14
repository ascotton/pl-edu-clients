module.exports = `query locationClients(
    $first: Int!,
    $orderBy: String,
    $offset: Int,
    $fullName_Icontains: String,
    $status_In: String,
    $locationId_In: String,
    $schoolYearCode_In: String
) {
    clients(
        first: $first,
        orderBy: $orderBy,
        offset: $offset,
        fullName_Icontains: $fullName_Icontains,
        status_In: $status_In,
        locationId_In: $locationId_In,
        schoolYearCode_In: $schoolYearCode_In
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
            }
        }
    }
}`;
