module.exports =
`query clientsSummaryClients($schoolYearCode_In: String, $locationId: String, $organizationId_In: String) {
    clients(schoolYearCode_In: $schoolYearCode_In, locationId: $locationId, organizationId_In: $organizationId_In) {
        totalCount
        statistics {
            statuses {
                status
                ratio
                count
            }
        }
    }
}`;
