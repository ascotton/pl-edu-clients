module.exports =
`query contactGet($id: ID!) {
    contact(
        id: $id,
    ) {
        id
        relations {
            edges {
                node {
                    id
                    sfAccount {
                        id
                        name
                        organizationType
                    }
                    role
                    source
                    organizationId
                    organizationName
                    organization {
                        id
                        name
                        sfAccountId
                        isActive
                    }
                    location {
                        id
                        name
                        sfAccountId
                        isActive
                    }
                }
            }
        }
    }
}`;
