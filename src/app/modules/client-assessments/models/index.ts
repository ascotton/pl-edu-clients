export interface PLEvaluationsResponse {
    referrals: PLEvaluationResponse[];
    totalCount: number;
    hasNextPage: boolean;
}

export interface PLEvaluationResponse {
    id: string;
    state?: string;
    client?: PLEvaluationClientResponse;
    service?: any;
    referrals?: any[];
    provider?: any;
    assignedTo?: any;
    clientService?: any;
    evaluationStage?: string;
    assessmentPlanSignedOn?: string;
    dueDate?: any;
    meetingDate?: any;
    permissions?: any;
    matchingDate?: string;
    caseManager?: PLAssessmentCaseManager;
    referringProvider?: any;
    hasNotes?: boolean;
}

export interface PLAssessmentsTableColumn {
    header: {
        key: string;
        orderKey?: string;
        value: string;
        defaultOrdering?: string;
    };
}

export interface PLAssessmentRow {
    isService: boolean;
    isAssessment: boolean;
    id: string;
    referralId: string;
    location: any;
    locationName: string;
    client: PLEvaluationClientResponse;
    studentName: string;
    studentProfileURL: string;
    serviceType: string;
    status: string;
    statusDisplay: string;
    stage: string;
    assessmentPlanSignedOn: any;
    dueDate: any;
    meetingDate: any;
    caseManager: PLAssessmentCaseManager;
    caseManagerDisplay: string;
    hasNotes: boolean;
    providerName: string;
    permissions: any;
    matchingDate: string;
    isNotesOpen?: boolean;
    hasClickedAddNote?: boolean;
    isAnimationComplete?: boolean;
}

export interface PLEvaluationClientResponse {
    id: string;
    firstName: string;
    lastName: string;
    contacts?: PLClientContactResponse[];
    locations: any[];
}

export interface PLAssessmentCaseManager {
    uuid: string;
    last_name: string;
    first_name: string;
    contact_type: string;
    primary_language: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    contact_preference: string;
    email: string;
    phone: string;
    is_emergency: boolean;
    is_responsible_party: boolean;
    created: string;
}

export interface PLClientContactResponse {
    uuid: string;
    lastName: string;
    firstName: string;
    contactType: string;
    primaryLanguage: { code: string; };
    street: string;
    city: string;
    state: string;
    postalCode: string;
    contactPreference: string;
    email: string;
    phone: string;
    isEmergency: boolean;
    isResponsibleParty: boolean;
    created: string;
}

export interface PLClientContactType {
    uuid: string;
    name: string;
    created: string;
    modified: string;
}

export interface PLClientContactLanguage {
    code: string;
    created: string;
    modified: string;
    name: string;
    uuid: string;
}
