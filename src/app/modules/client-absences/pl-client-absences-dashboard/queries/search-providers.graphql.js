module.exports =
`query clientAbsencesProviders(
    $fullName_Icontains: String,
    $orderBy: String
) {
    providerProfiles(
        fullName_Icontains: $fullName_Icontains,
        orderBy: $orderBy
    ) {
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
