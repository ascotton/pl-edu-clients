export const createOrUpdateReferralMutation =
`mutation referralMatchUpdateReferral($referral: ReferralInput) {
    createOrUpdateReferral(input: {referral: $referral}) {
        errors {
            code
            field
            message
        }
        status
    }
}`;
