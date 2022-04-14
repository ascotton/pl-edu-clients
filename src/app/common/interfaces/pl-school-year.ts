export interface PLSchoolYear {
    id: string;
    code: string;
    name: string;
    isCurrent?: boolean;
    startYear?: number;
    yearType?: string;
    startDate?: string;
    endDate?: string;
}
