module.exports =
`query clientsSummaryClients($schoolYearCode_In: String) {
    clients(schoolYearCode_In: $schoolYearCode_In) {
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
