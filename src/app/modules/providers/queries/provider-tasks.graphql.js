module.exports = `query providerTasks($id: UUID!, $code: String) {
    providerTasks(taskOwnerId: $id, taskTypeCode_StartsWith: $code) {
        edges {
            node {
                id
                taskType {
                    code
                    description
                }
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
            }
        }
    }
}`;
