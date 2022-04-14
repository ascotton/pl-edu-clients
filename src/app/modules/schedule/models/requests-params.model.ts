export interface PLGetAppointmentsParams {
    calendar_view: boolean;
    event_type__in?: string;
    provider?: string;
    uuid?: string;
    start?: string; // Date formated YYYY-MM-DDT00:00
    end?: string; // Date formated YYYY-MM-DDT00:00
}

export interface PLGetPendingClientsParams {
    // status: string;
    status__in: string;
    assigned_to: string;
}
