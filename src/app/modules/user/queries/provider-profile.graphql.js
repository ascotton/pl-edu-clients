module.exports =
`query providerProfile($userId: ID) {
    providerProfile(userId: $userId) {
        id
        user {
            id
            firstName
            lastName
            username
        }
        email
        email2
        phone
        providerTypes {
            edges {
                node {
                    id
                    isActive
                    code
                    shortName
                    longName
                }
            }
        }
        timezone
        caseloadCount
        billingAddress {
            street
            city
            postalCode
            state
            country
        }
        hourlyRate
        hourlyRateTier1
        hourlyRateTier2
        adjustedHourlyRate
        adjustedHourlyRateTier1
        adjustedHourlyRateTier2
        providerSubStatus
        isOnboardingWizardComplete
        salesforceId
        isW2
    }
}`
