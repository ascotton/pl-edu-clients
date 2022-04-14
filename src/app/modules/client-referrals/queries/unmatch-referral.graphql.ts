export const unmatchReferralMutation =
`mutation unmatchReferral($id: String, $reason: String!) {
    unmatchReferral(input: {id: $id, reason: $reason}) {
        errors {
            code
            field
            message
        }
        status
        referral {
            id
            state
            reason
        }
    }
}`;
