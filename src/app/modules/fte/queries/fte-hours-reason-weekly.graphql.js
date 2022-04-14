module.exports =
`mutation FTEHoursResaonWeekly(
    $providerUserId: UUID!,
    $date: Date!,
    $clinicalCoordinatorId: UUID!,
    $reason: String!
) {
    addReasonForWeeklyOvertime(
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
