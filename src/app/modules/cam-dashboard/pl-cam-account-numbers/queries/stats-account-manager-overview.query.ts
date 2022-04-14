export const statsAccountManagerOverviewQuery = `
query statsAccountManagerOverviewQuery(
    $referralsToConvertCreatedAtLt: Date!,
    $schoolYearCode: String!
) {
    statsAccountManagerOverview(
        referralsToConvertCreatedAtLt: $referralsToConvertCreatedAtLt,
        schoolYearCode: $schoolYearCode
    ) {
        statsCounts {
            name
            count
        }
    }
}
`;
