export interface PLAmendment {
    count: number;
    next: string | null;
    previous: string | null;
    results: PLAmendmentResults[];
}

export interface PLAmendmentResults {
    uuid: string;
    status: string;
    reason: string;
    created: string;
    number: number;
    net_duration: string;
    before: {
        start: string,
        end: string,
        billing_code: string,
        service: string,
        client: string,
        location: string,
    };
    after: {
        start: string,
        end: string,
        billing_code: string,
        service: string,
        client: string,
        location: string,
    };
    estimated_pay_date: string;
    relatedEntity?: string;
}
