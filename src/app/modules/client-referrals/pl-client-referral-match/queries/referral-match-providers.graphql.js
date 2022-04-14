module.exports =
`query ReferralMatchProviders($id: ID!) {
    referral(id: $id) {
        id
        providerCandidates {
            edges {
                node {
                    id
                    caseloadCount
                    user {
                        id
                        firstName
                        lastName
                    }
                    remainingAvailableHours
                }
            }
        }
    }
}`;
