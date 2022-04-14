export interface PLQualification {
    qualification: {
        title: string,
        category: string,
        agency: string,
        status: string,
        states: string[],
    };
    expiration_date: string;
    status: string;
    application_date: string;
    issuance_date: string;
}
