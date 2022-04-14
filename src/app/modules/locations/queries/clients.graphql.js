module.exports =
`query locationClients($schoolYearCode_In: String, $locationId: String) {
    clients(schoolYearCode_In: $schoolYearCode_In, locationId: $locationId) {
        totalCount
        edges {
            node {
                id
                firstName
                lastName
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
