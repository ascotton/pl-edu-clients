module.exports =
`query providerProfiles(
    $organizationId: String,
    $locationId: String,
    $first: Int,
    $isActive: Boolean,
    $orderBy: String,
    $offset: Int,
    $lastName_Icontains: String,
    $firstName_Icontains: String,
    $userIsActive: Boolean
    ) {
    providerProfiles(
        organizationId: $organizationId,
        locationId: $locationId,
        first: $first,
        isActive: $isActive,
        orderBy: $orderBy,
        offset: $offset,
        lastName_Icontains: $lastName_Icontains,
        firstName_Icontains: $firstName_Icontains,
        user_IsActive: $userIsActive,
    ) {
        totalCount
        edges {
            node {
                id
                timezone
                user {
                    id
                    firstName
                    lastName
                    username
                    permissions {
                        viewSchedule
                    }
                }
                providerTypes {
                    edges {
                        node {
                            shortName
                            longName
                        }
                    }
                }
                email
                phone
            }
        }
    }
}`;
