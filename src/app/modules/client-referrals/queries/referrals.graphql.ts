export const referralsQuery =
`query ReferralManagerReferrals(
    $accountCam: String,
    $first: Int!,
    $offset: Int,
    $orderBy: String,
    $clientEnglishLanguageLearnerStatus_In: String,
    $clientFirstName_Icontains: String,
    $clientLastName_Icontains: String,
    $clientLocationId_In: String,
    $clientOrganizationId_In: String,
    $clientPrimaryLanguageCode_In: String,
    $created_Lt: DateTime,
    $declinedByProvidersCount_Gt: Float,
    $isScheduled: Boolean,
    $isMissingInformation: Boolean,
    $providerTypeCode_In: String,
    $productTypeCode_In: String,
    $state_In: String,
    $schoolYearCode_In: String,
    $providerId: String,
    $hasProviderSeparationDate: Boolean,
    $clientServiceStatus_In: String,
) {
    referrals(
        accountCam: $accountCam,
        first: $first,
        offset: $offset,
        orderBy: $orderBy,
        clientEnglishLanguageLearnerStatus_In: $clientEnglishLanguageLearnerStatus_In,
        clientFirstName_Icontains: $clientFirstName_Icontains,
        clientLastName_Icontains: $clientLastName_Icontains,
        clientLocationId_In: $clientLocationId_In,
        clientOrganizationId_In: $clientOrganizationId_In,
        clientPrimaryLanguageCode_In: $clientPrimaryLanguageCode_In,
        created_Lt: $created_Lt,
        declinedByProvidersCount_Gt: $declinedByProvidersCount_Gt,
        isScheduled: $isScheduled,
        isMissingInformation: $isMissingInformation,
        providerTypeCode_In: $providerTypeCode_In,
        productTypeCode_In: $productTypeCode_In,
        state_In: $state_In,
        schoolYearCode_In: $schoolYearCode_In,
        providerId: $providerId,
        hasProviderSeparationDate: $hasProviderSeparationDate,
        clientServiceStatus_In: $clientServiceStatus_In,
    ) {
        totalCount
        edges {
            node {
                id
                created
                client {
                    id
                    firstName
                    lastName
                    primaryLanguage {
                        id
                        code
                        name
                    }
                    englishLanguageLearnerStatus
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
                clientService {
                    id
                    status
                }
                declinedByProvidersCount
                duration
                frequency
                grouping
                isScheduled
                isMissingInformation
                interval
                notes
                permissions {
                    matchProvider
                    declineReferral
                    deleteReferral
                    unmatchReferral
                    updateReferral
                }
                provider {
                    id
                    firstName
                    lastName
                    providerprofile {
                        separationDate
                    }
                }
                providerType {
                    id
                    shortName
                    code
                }
                productType {
                    id
                    code
                }
                state
                hasNotes
            }
        }
    }
 }`;
