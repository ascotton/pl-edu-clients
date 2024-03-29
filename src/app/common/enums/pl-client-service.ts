export enum PL_CLIENT_SERVICE_STATUS {
    NOT_STARTED = 'not_started',
    IN_PROCESS = 'in_process',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum PL_CLIENT_SERVICE_CANCELLED_REASON {
    STUDENT_REMOVED_BY_SCHOOL = 'STUDENT_REMOVED_BY_SCHOOL',
    STUDENT_MOVED_OUT = 'STUDENT_MOVED_OUT',
    OTHER = 'OTHER',
}

export enum PL_CLIENT_SERVICE_COMPLETED_REASON {
    STUDENT_EXITED = 'STUDENT_EXITED',
    END_OF_YEAR = 'END_OF_YEAR',
    OTHER = 'OTHER',
}
