export const referralEvaluationProvidersQuery = `query ReferralEvaluationProviders($clientId: ID!, $providerTypeIds: [ID]!) {
    referralProviderCandidates(clientId: $clientId, providerTypeIds: $providerTypeIds) {
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
}`;
