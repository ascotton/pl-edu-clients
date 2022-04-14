module.exports = `
mutation UpdateTaskOwner($id: ID!, $read: Boolean!) {
  updateTaskOwner(input: {id: $id, read: $read}) {
    taskOwner {
      user {
        id
      }
      read
    }
  }
}`;
