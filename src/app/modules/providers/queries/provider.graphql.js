module.exports =
`query providerProfileId($userId: ID) {
    providerProfile(userId: $userId) {
        id
        user {
            id
            username
            firstName
            lastName
            permissions {
                viewSchedule
            }
        }
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
        languages {
            edges {
                node {
                    id
                    code
                    name
                }
            }
        }
        timezone
        caseloadCount
        phone
        email
        email2
        billingAddress {
            street
            city
            postalCode
            state
            country
        }
        providerSubStatus
        readyForPlacementDate
        firstSession
        lastSession
        separationDate
        resignationDate
        techCheckStatus
        techCheckCompletionDate
        isBilingual
        accountOwner {
            firstName
            lastName
            email
        }
        hourlyRate
        hourlyRateTier1
        hourlyRateTier2
        adjustedHourlyRate
        adjustedHourlyRateTier1
        adjustedHourlyRateTier2
        isOnboardingWizardComplete
        salesforceId
        areasOfSpecialty {
            edges {
                node {
                    id
                    name        
                }
            }
        }
        notificationPreference
    }
}`;
