module.exports = `
query organizations(
    $id_In: String
  ) {
    organizations(
        id_In: $id_In
    ) {
        totalCount
        edges {
            node {
                id
                name
            }
        }
    }
}`;
