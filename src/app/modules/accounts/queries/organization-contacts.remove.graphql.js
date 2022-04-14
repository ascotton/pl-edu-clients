module.exports =
`mutation contactRemove($input: RemoveRelationInput!) {
  removeRelation(input: $input) {
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
