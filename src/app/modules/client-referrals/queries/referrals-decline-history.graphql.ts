export const REFERRALS_DECLINE_HISTORY_GQL =
`query referralDeclineHistory($id: ID!) {
    referral(id: $id) {
        declineHistory {
            edges {
                node {
                    created
                    provider {
                        lastName
                        firstName
                    }
                    reason
                    state
                }
            }
        }
    }
}`;
