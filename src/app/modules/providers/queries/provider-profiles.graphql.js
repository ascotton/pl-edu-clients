module.exports =
`query providerProfiles(
    $first: Int!,
    $orderBy: String,
    $offset: Int,
    $lastName_Icontains: String,
    $firstName_Icontains: String,
    $providerType_Icontains: String,
    $subStatus_Icontains: String,
    $isActive: Boolean,
    $user_IsActive: Boolean
    ) {
    providerProfiles(
        first: $first,
        orderBy: $orderBy,
        offset: $offset,
        lastName_Icontains: $lastName_Icontains,
        firstName_Icontains: $firstName_Icontains,
        providerType_Icontains: $providerType_Icontains,
        subStatus_Icontains: $subStatus_Icontains,
        isActive: $isActive,
        user_IsActive: $user_IsActive
    ) {
        totalCount
        edges {
            node {
                id
                user {
                    id
                    firstName
                    lastName
                }
                email
                phone
                providerSubStatus
                providerTypes {
                    edges {
                        node {
                            id
                            code
                            shortName
                            longName
                        }
                    }
                }
            }
        }
    }
}`;
