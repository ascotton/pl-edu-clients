export const proposeReferralMatchesMutation = `
mutation referralManagerProposeReferralMatches(
    $proposeReferralMatchesInput: ProposeReferralMatchesInput!
) {
    proposeReferralMatches(input: $proposeReferralMatchesInput) {
        errors {
            code
            field
            message
        }
        referrals {
            id
            created
            client {
                id
                firstName
                lastName
                primaryLanguage {
                    id
                    code
                    name
                }
                englishLanguageLearnerStatus
                locations {
                    edges {
                        node {
                            id
                            name
                            parent {
                                id
                                name
                            }
                        }
                    }
                }
            }
            declinedByProvidersCount
            duration
            frequency
            grade
            grouping
            isScheduled
            isMissingInformation
            interval
            notes
            permissions {
                matchProvider
                declineReferral
                deleteReferral
                unmatchReferral
                updateReferral
            }
            provider {
                id
                firstName
                lastName
            }
            providerType {
                id
                shortName
                code
            }
            productType {
                id
                code
            }
            state
        }
        status
    }
}
`;
