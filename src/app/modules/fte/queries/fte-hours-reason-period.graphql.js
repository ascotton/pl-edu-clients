module.exports =
`mutation FTEHoursResaonPeriod(
    $providerUserId: UUID!,
    $date: Date!,
    $clinicalCoordinatorId: UUID!,
    $reason: String!
) {
    addReasonForPeriodOvertime(
        input: {
            providerId: $providerUserId,
            date: $date,
            clinicalCoordinatorId: $clinicalCoordinatorId,
            reason: $reason
        }
    ) {
        errors {
            code
            field
            message
        }
    }
}`;
