module.exports =
`query Location(
    $id: ID!
) {
    location(
        id: $id
    ) {
        id
        organizationName
        organization {
            id
        }
        sfAccountId
        salesforceId
        parent {
            id
            name
            sfAccountId
            state
            website
            shippingAddress {
                street
                city
                state
                stateDisplay
                postalCode
                country
            }
            accountCqm {
                email
                firstName
                id
                lastName
                profile {
                    id
                    primaryPhone
                }
            }
            lead {
                id
                username
                firstName
                lastName
            }
        }
        accountOwner {
            id
            username
            firstName
            lastName
            email
            profile {
                id
                primaryPhone
            }
        }
        techCheckStatus
        name
        state
        projectedTherapyStartDate
        dateTherapyStarted
        computerSetupUrl
        shippingAddress {
            street
            city
            state
            stateDisplay
            postalCode
            country
        }
        timezone
        locationType
        preventProvidersOrderingMaterials
    }
}`;
