module.exports =
`mutation contactUpdate($input: UpdateContactInput!) {
    updateContact(input: $input) {
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
