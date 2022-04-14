export const REFERRAL_INPUTS_CONFIG: any = {
    firstName: {
        inputType: 'text',
        minChars: 1,
        maxChars: 255,
        regexp: /\w/,
        tipMessage: `
            Between 1-255 alpha characters
            Special characters allowed:
            ' [apostrophe]
              [space]
            - [hyphen]
            . [period]
        `,
    },
    lastName: {
        inputType: 'text',
        minChars: 1,
        maxChars: 255,
        regexp: /\w/,
        tipMessage: `
            Between 1-255 alpha characters
            Special characters allowed:
            ' [apostrophe]
              [space]
            - [hyphen]
            . [period]
        `,
    },
    birthday: {
        inputType: 'date',
        minChars: 1,
        maxChars: 255,
        regexp: /\w/,
        tipMessage: `
            The following input formats are acceptable:
            mm/dd/yyyy or mm-dd-yyyy
            m/d/yy or m-d-yy
            dd mmm yyyy
            d mmm yy
        `,
    },
    externalId: {
        inputType: 'text',
        minChars: 1,
        maxChars: 100,
        regexp: /\w/,
        tipMessage: `
            Between 1-100 alphanumeric characters
            No special characters allowed
        `,
    },
    notes: {
        inputType: 'textarea',
        minChars: 1,
        maxChars: 255,
        regexp: /\w/,
        tipMessage: `
            Enter any additional relevant information about the student that will help PL in initiating services for this student. This may include items such as: Prefered therapy times, behavior patterns, etc

            Between 1-2,000 characters.
            No images or emojis allowed.
        `,
    },
    providerTypeCode: {
        inputType: 'select',
        options: [
            { value: 'Speech-Language Pathologist', label: 'Speech-Language Pathologist' },
            { value: 'School Psychologist', label: 'School Psychologist' },
            { value: 'Occupational Therapist', label: 'Occupational Therapist' },
            { value: 'Mental Health Professional', label: 'Mental Health Professional' },
        ],
        default: { value: '', label: 'Select a Provider Type' },
        tipMessage: `
            Speech-Language Pathologist
            School Psychologist
            Occupational Therapist
            Mental Health Professional
        `,
    },
    productTypeCode: {
        inputType: 'select',
        options: [
            { value: 'Direct Therapy', label: 'Direct Therapy' },
            { value: 'Evaluation', label: 'Evaluation' },
            { value: 'Supervision', label: 'Supervision' },
            { value: 'BIG', label: 'BIG' },
            { value: 'Trauma Informed Group', label: 'Trauma Informed Group' },
        ],
        default: { value: '', label: 'Select a Product Type' },
        tipMessage: `
            Direct Therapy
            Evaluation
            Supervision
            BIG
            Trauma Informed Group
        `,
    },
    primaryLanguageCode: {
        inputType: 'select',
        options: [
            { value: 'English', label: 'English' },
            { value: 'Spanish', label: 'Spanish' },
            { value: 'Arabic', label: 'Arabic' },
            { value: 'Chinese (Cantonese)', label: 'Chinese (Cantonese)' },
            { value: 'Chinese (Mandarin)', label: 'Chinese (Mandarin)' },
            { value: 'French', label: 'French' },
            { value: 'German', label: 'German' },
            { value: 'Italian', label: 'Italian' },
            { value: 'Korean', label: 'Korean' },
            { value: 'Russian', label: 'Russian' },
            { value: 'Tagalog', label: 'Tagalog' },
            { value: 'Vietnamese', label: 'Vietnamese' },
        ],
        default: { value: '', label: 'Select a Language' },
        tipMessage: `
            Select language that the service should be provided in
        `,
    },
    esy: {
        inputType: 'select',
        options: [
            { value: 'Yes', label: 'Yes' },
            { value: 'No', label: 'No' },
        ],
        default: { value: '', label: '' },
        tipMessage: `
            Is this referral for the ESY period of the current school year? If so, mark Yes.

            Students receiving services during the regular school year and ESY will need separate referrals for each service period.
        `,
    },
    shortTermLeave: {
        inputType: 'select',
        options: [
            { value: 'Yes', label: 'Yes' },
            { value: 'No', label: 'No' },
        ],
        default: { value: '', label: '' },
        tipMessage: `
            Is this referral to cover the student's service provision for a short period of time (i.e., the treating therapist is going on leave and then returning)
        `,
    },
    grade: {
        inputType: 'select',
        options: [
            { value: 'Before Pre-K', label: 'Before Pre-K' },
            { value: 'Pre-K', label: 'Pre-K' },
            { value: 'Kindergarten', label: 'Kindergarten' },
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' },
            { value: '6', label: '6' },
            { value: '7', label: '7' },
            { value: '8', label: '8' },
            { value: '9', label: '9' },
            { value: '10', label: '10' },
            { value: '11', label: '11' },
            { value: '12', label: '12' },
            { value: 'Adult', label: 'Adult' },
        ],
        default: { value: '', label: 'Select a Grade' },
        tipMessage: `
            List the grade level for the student during the time which the therapy/evaluation will occur
        `,
    },
    frequency: {
        inputType: 'text',
        minChars: 1,
        maxChars: 255,
        regexp: /\d/,
        tipMessage: `
            How often the session will occur (1, 2, 3, 4 times etc..) during a week, month, year.
        `,
    },
    interval: {
        inputType: 'select',
        options: [
            { value: 'Daily', label: 'Daily' },
            { value: 'Weekly', label: 'Weekly' },
            { value: 'Monthly', label: 'Monthly' },
            { value: 'Quarterly', label: 'Quarterly' },
            { value: 'Annually', label: 'Annually' },
            { value: 'Per Semester', label: 'Per Semester' },
            { value: 'Every 2 weeks', label: 'Every 2 weeks' },
            { value: 'Every 3 weeks', label: 'Every 3 weeks' },
            { value: 'Every 4 weeks', label: 'Every 4 weeks' },
            { value: 'Every 5 weeks', label: 'Every 5 weeks' },
            { value: 'Every 6 weeks', label: 'Every 6 weeks' },
            { value: 'Every 7 weeks', label: 'Every 7 weeks' },
            { value: 'Every 8 weeks', label: 'Every 8 weeks' },
            { value: 'Every 9 weeks', label: 'Every 9 weeks' },
            { value: 'Every 10 weeks', label: 'Every 10 weeks' },
            { value: 'Every 11 weeks', label: 'Every 11 weeks' },
        ],
        default: { value: '', label: 'Select an Interval' },
        tipMessage: `
            Select the period of time the therapy sessions will occur (e.g. daily, weekly, monthly, quarterly, annually)
        `,
    },
    duration: {
        inputType: 'text',
        minChars: 1,
        maxChars: 255,
        regexp: /\d/,
        tipMessage: `
            Length of therapy session in whole minutes. e.g. 30
        `,
    },
    grouping: {
        inputType: 'select',
        options: [
            { value: 'Individual', label: 'Individual' },
            { value: 'Group', label: 'Group' },
            { value: 'Either', label: 'Either' },
        ],
        default: { value: '', label: 'Select a Grouping' },
        tipMessage: `
            Indicate whether this student should be receiving group or individual services.
        `,
    },
    assessmentPlanSignature: {
        inputType: 'date',
        minChars: 1,
        maxChars: 255,
        regexp: /\w/,
        tipMessage: `
            The following input formats are acceptable:
            mm/dd/yyyy or mm-dd-yyyy
            m/d/yy or m-d-yy
            dd mmm yyyy
            d mmm yy
        `,
    },
    assessmentDueDate: {
        inputType: 'date',
        minChars: 1,
        maxChars: 255,
        regexp: /\w/,
        tipMessage: `
            The following input formats are acceptable:
            mm/dd/yyyy or mm-dd-yyyy
            m/d/yy or m-d-yy
            dd mmm yyyy
            d mmm yy
        `,
    },
    meetingDate: {
        inputType: 'date',
        minChars: 1,
        maxChars: 255,
        regexp: /\w/,
        tipMessage: `
            The following input formats are acceptable:
            mm/dd/yyyy or mm-dd-yyyy
            m/d/yy or m-d-yy
            dd mmm yyyy
            d mmm yy
        `,
    },
};
