export const statsLocationReferralsQuery = `
query camAccountDetails($organizationId: UUID!, $schoolYearCode: String!) {
    statsLocationReferrals(organizationId: $organizationId, schoolYearCode: $schoolYearCode) {
        serviceStatusCounts {
            name
            statusCounts {
                name
                count
            }
            hours {
                name
                count
            }
        }
        stats {
            location {
                id
                locationType
                name
                organization {
                    id
                }
                organizationName
                state
            }
            statsCounts {
                name
                count
            }
        }
    }
}
`;
