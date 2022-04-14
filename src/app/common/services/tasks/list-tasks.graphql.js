module.exports = `
query tasks {
  tasks {
    edges {
      node {
        owners {
          edges {
            node {
              user {
                username
                id
              }
              read
              firstReadDate
              isComplete
            }
          }
        }
        message
        severity
        priority
        created
        taskType {
          code
          id
        }
        actionUrl
        completedOn
        age
        dueDate
        owners {
          edges {
            node {
              read
              firstReadDate
              id
              user {
                username
              }
            }
          }
        }
      }
    }
  }
}`;
