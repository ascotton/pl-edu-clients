import { PLClientAbsences } from './pl-client-absences';

export class PLClientAbsencesConsecutive implements PLClientAbsences {
    readonly apiKey: string = 'consecutiveAbsenceStreak';

    private readonly priority2Absences = 2;
    private readonly absencesTypeValue = 'consecutive';

    filtersParams(): string[] {
        return [
            'absencesType',
            'consecutiveAbsenceStreak_Gt',
            'consecutiveAbsenceStreak_Lt',
        ];
    }

    formattedString(absences: number): string {
        return absences.toString();
    }

    matchesQueryParams(params: any = {}): boolean {
        return params.absencesType === this.absencesTypeValue;
    }

    priority(absences: number): number {
        if (absences > this.priority2Absences) {
            return 1;
        }

        if (absences === this.priority2Absences) {
            return 2;
        }

        return 3;
    }

    priorityFromQueryParams(params: any): number | null {
        // param values may be numbers or strings; convert to numbers for comparison
        const gt = +params['consecutiveAbsenceStreak_Gt'];
        const lt = +params['consecutiveAbsenceStreak_Lt'];

        if ((gt === this.priority2Absences - 1) && (lt === this.priority2Absences + 1)) {
            return 2;
        }

        if (gt === this.priority2Absences) {
            return 1;
        }

        if (lt === this.priority2Absences) {
            return 3;
        }

        return null;
    }

    queryParams(priority?: number): any {
        const map = {
            none: {
                // filters out null records; should not otherwise impact results
                consecutiveAbsenceStreak_Gt: -1,
            },
            1: {
                consecutiveAbsenceStreak_Gt: this.priority2Absences,
            },
            2: {
                consecutiveAbsenceStreak_Lt: this.priority2Absences + 1,
                consecutiveAbsenceStreak_Gt: this.priority2Absences - 1,
            },
            3: {
                consecutiveAbsenceStreak_Lt: this.priority2Absences,
            },
        };

        const params = map[priority || 'none'];

        return Object.assign({}, { absencesType: this.absencesTypeValue }, params);
    }

    reportFileTitle(priority: number): string {
        return {
            1: 'Absences, 3 or more consecutive',
            2: 'Absences, 2 consecutive',
            3: 'Absences, 1 or 0 consecutive',
        }[priority];
    }
}
