module.exports =
`query locationContacts($first: Int!, $orderBy: String,
 $firstName_Icontains: String, $lastName_Icontains: String, $accountRole: String,
 $locationId: String) {
      accountContacts(first: $first, orderBy: $orderBy, firstName_Icontains: $firstName_Icontains,
          lastName_Icontains: $lastName_Icontains,
          accountRole: $accountRole, locationId: $locationId) {
        edges {
          node{
             firstName
             lastName
             title
             accountRole
             email
             phone
          }
        }
      }
  }`;
