module.exports =
`query reportsSummaryLocations($isActive: Boolean, $name_Icontains: String) {
    locations(isActive: $isActive, name_Icontains: $name_Icontains) {
        edges {
            node {
                id
                name
            }
        }
    }
}`;