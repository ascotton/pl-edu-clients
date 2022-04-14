export const clientServiceTypes =`
    query clientServiceTypes($first: Int) {
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
    }
`;
