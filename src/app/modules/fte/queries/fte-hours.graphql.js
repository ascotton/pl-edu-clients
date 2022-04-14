module.exports =
`query FTEHours(
    $providerUserId: UUID!,
    $periodDate: Date!,
    $weeklyDate: Date!,
    $weeklyBefore: Int,
    $weeklyAfter: Int,
    $periodBefore: Int,
    $periodAfter: Int
) {
    billingPeriods(
        date: $periodDate,
        before: $periodBefore,
        after: $periodAfter
    ) {
        oldestUninvoicedPeriod(providerId: $providerUserId)
        edges {
            node {
                id
                name
                start
                end
                periodHours(providerId: $providerUserId) {
                    assigned
                    scheduled
                    clinicalCoordinator {
                        id
                        name
                    }
                    reason
                }
            }
        }
    }
    weeklyHours(
        providerId: $providerUserId,
        date: $weeklyDate,
        before: $weeklyBefore,
        after: $weeklyAfter
    ) {
        edges {
            node {
                start
                end
                assigned
                scheduled
                clinicalCoordinator {
                    id
                    name
                }
                reason
            }
        }
    }
}`;
