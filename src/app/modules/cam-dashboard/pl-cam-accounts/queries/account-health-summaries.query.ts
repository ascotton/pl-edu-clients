export const accountHealthSummariesQuery = `
query accountHealthSummaries(
    $schoolYearCode: String!,
    $fulfillmentPercentageLte: Int,
    $organizationIds: [UUID]
) {
    accountHealth(
        organizationIds: $organizationIds,
        schoolYearCode: $schoolYearCode,
        fulfillmentPercentageLte: $fulfillmentPercentageLte
    ) {
        summaries {
            organization {
                id
                name
            }
            projectedTherapyStartDate
            statsCounts {
                name
                count
            }
        }
    }
}
`;
