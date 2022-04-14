module.exports =
`query organizationContacts(
    $organizationId: String,
    $first: Int!,
    $orderBy: String,
    $offset: Int,
    $lastName_Icontains: String,
    $firstName_Icontains: String,
    $accountRole: String
    ) {
    accountContacts(
        organizationId: $organizationId,
        first: $first,
        orderBy: $orderBy,
        offset: $offset,
        lastName_Icontains: $lastName_Icontains,
        firstName_Icontains: $firstName_Icontains,
        accountRole: $accountRole
    ) {
        totalCount
        edges {
            node {
                id
                firstName
                lastName
                title
                accountRole
                email
                phone
            }
        }
    }
}`;
