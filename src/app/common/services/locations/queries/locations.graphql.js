module.exports = `
query locations(
    $accountCam: String,
    $after: String,
    $first: Int,
    $id_In: String,
    $isActive: Boolean,
    $name_Icontains: String,
    $offset: Int,
    $orderBy: String,
    $organizationId_In: String,
    $accountCam_Icontains: String,
  ) {
    locations(
        accountCam: $accountCam,
        after: $after,
        first: $first,
        id_In: $id_In,
        isActive: $isActive,
        name_Icontains: $name_Icontains,
        offset: $offset,
        orderBy: $orderBy,
        organizationId_In: $organizationId_In,
        accountCam_Icontains: $accountCam_Icontains,
    ) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
            node {
                organizationName
                id
                locationType
                name
                state
                organization {
                    id
                }
                accountCam {
                    firstName
                    lastName       
                }
            }
        }
    }
}`;
