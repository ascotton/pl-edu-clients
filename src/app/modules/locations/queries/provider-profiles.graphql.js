module.exports =
`query locationsProviderProfiles($first: Int, $isActive: Boolean, $user_IsActive: Boolean, $locationId: String) {
    providerProfiles(first: $first, isActive: $isActive, user_IsActive: $user_IsActive, locationId: $locationId) {
        edges {
            node {
                id
                user {
                    id
                    firstName
                    lastName
                }
            }
        }
    }
}`;
