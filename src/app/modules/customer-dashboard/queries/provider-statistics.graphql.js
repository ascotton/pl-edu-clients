module.exports =
`query providerStatistics($locationId: String, $organizationId: String) {
    providerProfiles(locationId: $locationId, organizationId: $organizationId) {
        totalCount
        statistics {
            providerTypes {
                count
                providerType {
                    id
                    code
                    longName
                }
            }
        }
    }
}`;
