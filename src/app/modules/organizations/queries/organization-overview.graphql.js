module.exports = `query organizationOverview($id: ID!) {
     organization(id: $id) {
         accountOwner {
             email
             firstName
             id
             lastName
             profile {
                 id
                 primaryPhone
             }
         }
         accountCqm {
            email
            firstName
            id
            lastName
            profile {
                id
                primaryPhone
            }
         }
         id
         isActive
         lead {
             firstName
             lastName
             id
         }
         name
         sfAccountId
         salesforceId
         shippingAddress {
             street
             city
             state
             stateDisplay
             postalCode
             country
         }
         state
         website
         timezone
         dateTherapyStarted
         projectedTherapyStartDate
    }
}`
