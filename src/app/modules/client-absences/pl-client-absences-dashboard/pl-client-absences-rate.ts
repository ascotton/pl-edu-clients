import { PLClientAbsences } from './pl-client-absences';

export class PLClientAbsencesRate implements PLClientAbsences {
    readonly apiKey: string = 'sixtyDayAbsenceRatio';

    private readonly priority2Min = 0.25;
    private readonly priority2Max = 0.50;
    private readonly absencesTypeValue = 'rate';

    filtersParams(): string[] {
        return [
            'absencesType',
            'sixtyDayAbsenceRatio_Lt',
            'sixtyDayAbsenceRatio_Lte',
            'sixtyDayAbsenceRatio_Gt',
            'sixtyDayAbsenceRatio_Gte',
        ];
    }

    formattedString(absencesRatio: number): string {
        return `${Math.trunc(100 * absencesRatio)}%`;
    }

    matchesQueryParams(params: any = {}): boolean {
        return params.absencesType === this.absencesTypeValue;
    }

    priorityFromQueryParams(params: any): number | null {
        // param values may be numbers or strings; convert to numbers for comparison
        const lt = +params['sixtyDayAbsenceRatio_Lt'];
        const lte = +params['sixtyDayAbsenceRatio_Lte'];
        const gt = +params['sixtyDayAbsenceRatio_Gt'];
        const gte = +params['sixtyDayAbsenceRatio_Gte'];

        if (lte === this.priority2Max && gte === this.priority2Min) {
            return 2;
        }

        if (gt === this.priority2Max) {
            return 1;
        }

        if (lt === this.priority2Min) {
            return 3;
        }

        return null;
    }

    priority(absencesRatio: number): number {
        if (absencesRatio > this.priority2Max) {
            return 1;
        }

        if (absencesRatio >= this.priority2Min) {
            return 2;
        }

        return 3;
    }

    queryParams(priority?: number): any {
        const map = {
            none: {
                // filters out null records; should not otherwise impact results
                sixtyDayAbsenceRatio_Gte: -1.0,
            },
            1: {
                sixtyDayAbsenceRatio_Gt: this.priority2Max,
            },
            2: {
                sixtyDayAbsenceRatio_Lte: this.priority2Max,
                sixtyDayAbsenceRatio_Gte: this.priority2Min,
            },
            3: {
                sixtyDayAbsenceRatio_Lt: this.priority2Min,
            },
        };

        const params = map[priority || 'none'];

        return Object.assign({}, { absencesType: this.absencesTypeValue }, params);
    }

    reportFileTitle(priority: number): string {
        return {
            1: 'Absences, 50-100% rate',
            2: 'Absences, 25-50% rate',
            3: 'Absences, less than 25% rate',
        }[priority];
    }
}
