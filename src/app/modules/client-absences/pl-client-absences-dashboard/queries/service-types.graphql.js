module.exports =
`query clientAbsencesServiceTypes($first: Int) {
    serviceTypes(first: $first) {
        edges {
            node {
                id
                code
                shortName
                longName
            }
        }
    }
}`;
