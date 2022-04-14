module.exports = `query Referral($id: ID!) {
    referral(id: $id) {
        id
        created
        createdBy {
            id
        }
        client {
            id
            firstName
            lastName
            locations {
                edges {
                    node {
                        id
                        name
                        parent {
                            id
                            name
                        }
                    }
                }
            }
        }
        dueDate
        providerType {
            id
            longName
            code
        }
        productType {
            id
            code
        }
        provider {
            id
            firstName
            lastName
        }
        state
        bilingual
        clientService {
            id
        }
        notes
        esy
        grade
        frequency
        interval
        isScheduled
        duration
        grouping
        reason
        schoolYear {
            id
            code
            name
        }
        permissions {
            matchProvider
            declineReferral
            deleteReferral
            unmatchReferral
            updateReferral
        }
        isShortTerm
        language {
            code
            name
        }
        assessmentPlanSignedOn
        meetingDate
    }
}`;
