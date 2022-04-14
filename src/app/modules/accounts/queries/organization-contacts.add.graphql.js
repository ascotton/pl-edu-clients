module.exports =
`mutation addRelations($input: AddRelationsInput!) {
  addRelations(input: $input) {
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
