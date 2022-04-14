module.exports =
`query UserSelf {
    currentUser {
        id
        username
        firstName
        lastName
        enabledFeatures
        permissions {
            manageCaseload
            viewSchedule
        }
        globalPermissions {
            addReferral
            addReferrals
            exportNotes
            viewProviders
            viewOpenReferrals
            manageReferrals
            addEvaluation
            addDirectService
            provideServices
            viewCustomers
            mergeClient
            viewPersonnel
        }
        enabledUiFlags
    }
}
`;
