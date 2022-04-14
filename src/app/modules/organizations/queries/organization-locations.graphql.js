module.exports = `
query locations(
    $first: Int,
    $name_Icontains: String,
    $offset: Int,
    $orderBy: String,
    $organizationId_In: String
  ) {
    locations(
        first: $first,
        isActive: true,
        name_Icontains: $name_Icontains,
        offset: $offset,
        orderBy: $orderBy,
        organizationId_In: $organizationId_In
    ) {
        totalCount
        edges {
            node {
                id
                name
                sfAccountId
                timezone
                clientStatistics {
                  	statuses {
                    	  status
                    	  count
                  	}
                }
            }
        }
    }
}`;
