module.exports =
`query clientAbsencesProviderProfiles($userId_In: String) {
    providerProfiles(userId_In: $userId_In) {
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
