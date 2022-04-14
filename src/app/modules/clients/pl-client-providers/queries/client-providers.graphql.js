module.exports =
`query ClientProviders(
    $first: Int!,
    $offset: Int,
    $orderBy: String,
    $firstName_Icontains: String,
    $lastName_Icontains: String,
    $username_Icontains: String,
    $clientId: String
) {
    providerProfiles(first: $first, offset: $offset, orderBy: $orderBy,
    firstName_Icontains: $firstName_Icontains, lastName_Icontains: $lastName_Icontains,
    username_Icontains: $username_Icontains, clientId: $clientId) {
        totalCount
        edges {
            node {
                id
                phone
                user {
                    id
                    email
                    username
                    firstName
                    lastName
                    permissions {
                        viewSchedule
                    }
                }
            }
        }
    }
}`;
