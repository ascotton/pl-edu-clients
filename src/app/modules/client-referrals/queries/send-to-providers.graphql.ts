export const sendToProvidersMutation = `
mutation ReferralsManagerSendToOpen($referralIds: [ID]) {
  sendToProviders(input: {ids: $referralIds}) {
    results {
      error {
        code
        field
        message
      }
      status
      referral {
        id
        state
        provider {
            id
            firstName
            lastName
        }
        frequency
        interval
        duration
        grouping
      }
    }
    errors {
      code
      field
      message
    }
    status
  }
}`;
