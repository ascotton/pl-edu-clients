module.exports =
`query locationAppointments($start: NaiveDateTime!, $end: NaiveDateTime!, $timezone: Timezone!, $billingCodeCodeWithRecords_In : String!, $clientLocationId: ID!) {
    appointments(start: $start, end: $end, timezone: $timezone, billingCodeCodeWithRecords_In : $billingCodeCodeWithRecords_In , clientLocationId: $clientLocationId) {
        totalCount
        edges {
            node {
                id
                title
                start
                end
                clientsTotalCount
                event {
                    id
                    start
                    end
                    recurrenceParams
                    recurrenceFrequency
                    endRecurringPeriod
                }
                provider {
                    id
                    firstName
                    lastName
                }
                billingCode {
                    id
                    code
                    name
                }
                clients {
                    edges {
                        node {
                            id
                            firstName
                            lastName
                        }
                    }
                }
                records {
                    edges {
                        node {
                            id
                            client {
                                id
                            }
                            location {
                                id
                            }
                            billingCode {
                                id
                                code
                                name
                            }
                        }
                    }
                }
            }
        }
    }
}`;
