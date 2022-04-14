module.exports = class PLGQLStrings {
    constructor() {
        // Base, independent strings.
        this.address = `
            street
            city
            postalCode
            state
            country
        `;

        this.clientEvalDates = `
            activeIep {
                id
                status
                startDate
                nextAnnualIepDate
                nextEvaluationDate
                prevEvaluationDate
            }
        `;

        this.directService = `
            id
            startDate
            endDate
            duration
            frequency
            interval
            startingBalance
            totalMinutesRequired
            minutesReceived
            minutesRemaining
        `;

        this.language = `
            id
            code
            name
        `;

        this.locationsWithParent = `
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
        `;

        this.productType = `
            id
            isActive
            code
            name
        `;

        this.providerType = `
            id
            isActive
            code
            shortName
            longName
        `;

        this.referralPermissions = `
            matchProvider
            declineReferral
            deleteReferral
            unmatchReferral
            updateReferral
        `;

        this.serviceType = `
            id
            isActive
            code
            shortName
            longName
        `;

        this.userName = `
            firstName
            lastName
        `;

        // Dependent strings
        this.areasOfConcern = `
            edges {
                node {
                    id
                    isActive
                    name
                    serviceType {
                        ${this.serviceType}
                    }
                }
            }
        `;

        this.assessmentsUsed = `
            edges {
                node {
                    id
                    isActive
                    shortName
                    longName
                }
            }
        `;

        this.clientLanguages = `
            primaryLanguage {
                ${this.language}
            }
            secondaryLanguage {
                ${this.language}
            }
            englishLanguageLearnerStatus
        `;

        this.clientName = `
            ${this.userName}
        `;

        this.createdBy = `
            id
            ${this.userName}
        `;

        this.evaluation = `
            id
            evaluationType
            status
            statusDisplay
            referringProvider {
                id
                ${this.userName}
            }
            assignedTo {
                id
                ${this.userName}
            }
            assignedDate
            dueDate
            completedDate
            consentSigned
            areasOfConcern {
                ${this.areasOfConcern}
            }
            assessmentsUsed {
                ${this.assessmentsUsed}
            }
            celdtListening
            celdtSpeaking
            celdtReading
            celdtWriting
            celdtComprehension
        `;

        this.providerProfile = `
            id
            user {
                id
                username
                ${this.userName}
                permissions {
                    manageCaseload
                    viewSchedule
                }
            }
            providerTypes {
                edges {
                    node {
                        ${this.providerType}
                    }
                }
            }
            primaryLanguage {
                ${this.language}
            }
            secondaryLanguage {
                ${this.language}
            }
            timezone
            caseloadCount
            phone
            email
            billingAddress {
                ${this.address}
            }
        `;

        this.service = `
            id
            isActive
            code
            name
            serviceType {
                ${this.serviceType}
            }
            productType {
                ${this.productType}
            }
            providerTypes {
                edges {
                    node {
                        ${this.providerType}
                    }
                }
            }
        `;

        this.directServiceFull = `
            id
            isActive
            created
            createdBy {
                ${this.createdBy}
            }
            client {
                id
                ${this.clientName}
                ${this.clientLanguages}
                ${this.clientEvalDates}
            }
            service {
                ${this.service}
            }
            status
            statusDisplay
            ${this.directService}
        `;

        this.evaluationFull = `
            id
            isActive
            created
            createdBy {
                ${this.createdBy}
            }
            client {
                id
                ${this.clientName}
                ${this.clientLanguages}
                ${this.clientEvalDates}
            }
            bilingual
            service {
                ${this.service}
            }
            ${this.evaluation}
        `;

        this.referralFull = `
            id
            created
            createdBy {
                ${this.createdBy}
            }
            client {
                id
                ${this.clientName}
                locations {
                    ${this.locationsWithParent}
                }
            }
            providerType {
                ${this.providerType}
            }
            productType {
                ${this.productType}
            }
            provider {
                id
                ${this.userName}
            }
            state
            bilingual
            clientService {
                id
            }
            notes
            reason
            permissions {
                ${this.referralPermissions}
            }
        `;
    }
};
