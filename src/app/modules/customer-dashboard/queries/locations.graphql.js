module.exports =
`query reportsSummaryLocations($isActive: Boolean) {
    locations(isActive: $isActive) {
        edges {
            node {
                id
                name
            }
        }
    }
}`;