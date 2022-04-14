module.exports = `
mutation UpdateTaskOwner($id: ID!, $read: Boolean!, $isComplete: Boolean) {
  updateTaskOwner(input: {id: $id, read: $read, isComplete: $isComplete}) {
    taskOwner {
      user {
        id
      }
      isComplete
      read
    }
  }
}`;
