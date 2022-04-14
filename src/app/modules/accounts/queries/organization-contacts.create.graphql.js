module.exports =
`mutation contactCreate($input: CreateContactInput!) {
    createContact(input: $input) {
      contact {
        id
      }
      errors {
        code
        message
        field
      }
    }
  }`;
