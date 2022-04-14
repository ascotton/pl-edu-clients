module.exports = `mutation createOrUpdateReferral($referral: ReferralInput,
 $client: UpdateOrCreateInputData, $autoMatch: Boolean) {
    createOrUpdateReferral(input: {referral: $referral, client: $client,
     autoMatch: $autoMatch}) {
        errors {
            code
            field
            message
        }
        status
        referral {
            id
            created
            createdBy {
                id
            }
            providerType {
                id
                longName
            }
            productType {
                id
                code
            }
            schoolYear {
                id
                code
                name
            }
            provider {
                id
                firstName
                lastName
            }
            state
            clientService {
                id
            }
            notes
            esy
            grade
            frequency
            interval
            duration
            grouping
            reason
            permissions {
                matchProvider
                declineReferral
                deleteReferral
                unmatchReferral
                updateReferral
            }
            client {
                id
                primaryLanguage {
                    id
                    code
                    name
                }
                secondaryLanguage {
                    id
                    code
                    name
                }
                englishLanguageLearnerStatus
                birthday
                firstName
                lastName
                externalId
            }
        }
    }
}`;
