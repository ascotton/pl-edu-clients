module.exports =
`query reportsSummaryClients($phiOnly: Boolean, $fullName_Icontains: String, $organizationId_In: String, $locationId: String) {
    clients(phiOnly: $phiOnly, fullName_Icontains: $fullName_Icontains, organizationId_In: $organizationId_In, locationId: $locationId) {
        edges {
            node {
                id
                firstName
                lastName
            }
        }
    }
}`;