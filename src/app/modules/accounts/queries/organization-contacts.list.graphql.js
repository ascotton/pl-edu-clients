module.exports =
`query contactsList(
    $sfAccountId: String,
    $lastName_Icontains: String,
    $firstName_Icontains: String,
    $role: String,
    $first: Int!,
    $orderBy: String,
    $offset: Int,
    ) {
    contacts(
        sfAccountId: $sfAccountId,
        lastName_Icontains: $lastName_Icontains,
        firstName_Icontains: $firstName_Icontains,
        role: $role,
        first: $first,
        orderBy: $orderBy,
        offset: $offset,
    ) {
        totalCount
        edges {
            node {
                id
                firstName
                lastName
                title
                email
                phone
            }
        }
    }
}`;
