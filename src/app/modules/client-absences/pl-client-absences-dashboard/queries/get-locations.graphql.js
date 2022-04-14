module.exports =
`query clientAbsencesLocations($id_In: String) {
    locations(id_In: $id_In) {
        edges {
            node {
                id
                name
            }
        }
    }
}`;
