interface Month {
    year: number;
    month: number; // 0 - 11
}

export interface PLReportDates {
    start: Month | null;
    end: Month | null;
}
