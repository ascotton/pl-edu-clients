export const matchReferralsMutation =
`mutation referralManagerMatchReferrals($referralIds: [ID]!) {
    matchReferrals(input: {ids: $referralIds}) {
        results {
            error {
                code
                field
                message
            }
            status
            referral {
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
                grouping
                grade
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
        }
        errors {
            code
            field
            message
        }
        status
    }
}`;
