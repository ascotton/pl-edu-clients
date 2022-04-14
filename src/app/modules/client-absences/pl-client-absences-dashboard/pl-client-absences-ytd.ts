import { PLClientAbsences } from './pl-client-absences';

export class PLClientAbsencesYtd implements PLClientAbsences {
  readonly apiKey: string = 'ytdAbsenceCount';

  private readonly priority2Min = 2;
  private readonly priority2Max = 3;
  private readonly absencesTypeValue = 'ytd';

  filtersParams(): string[] {
    return [
      'absencesType',
      'ytdAbsenceCount_Gt',
      'ytdAbsenceCount_Lt',
    ];
  }

  formattedString(absences: number): string {
    return `${absences}`;
  }

  matchesQueryParams(params: any = {}): boolean {
    return params.absencesType === this.absencesTypeValue;
  }

  priorityFromQueryParams(params: any): number | null {
    // param values may be numbers or strings; convert to numbers for comparison
    const lt = +params['ytdAbsenceCount_Lt'];
    const gt = +params['ytdAbsenceCount_Gt'];

    if (gt === this.priority2Max) {
      return 1;
    }

    if (lt === this.priority2Max+1 && gt === this.priority2Min-1) {
      return 2;
    }

    if (lt === this.priority2Min && gt === 0) {
      return 3;
    }

    return null;
  }

  priority(absences: number): number {
    if (absences > this.priority2Max) {
      return 1;
    }

    if (absences >= this.priority2Min && absences <= this.priority2Max) {
      return 2;
    }

    if (absences === 1) {
      return 3;
    }

    return 0;
  }

  queryParams(priority?: number): any {
    const map = {
      none: {
        // filters out null records; should not otherwise impact results
        ytdAbsenceCount_Gt: -1,
      },
      1: {
        ytdAbsenceCount_Gt: this.priority2Max,
      },
      2: {
        ytdAbsenceCount_Lt: this.priority2Max + 1,
        ytdAbsenceCount_Gt: this.priority2Min - 1,
      },
      3: {
        ytdAbsenceCount_Lt: this.priority2Min,
        ytdAbsenceCount_Gt: 0,
      },
    };

    const params = map[priority || 'none'];

    return Object.assign({}, { absencesType: this.absencesTypeValue }, params);
  }

  reportFileTitle(priority: number): string {
    return {
      1: 'Absences, 4 or more absences',
      2: 'Absences, 2 or 3 absences',
      3: 'Absences, 1 absence'
    }[priority];
  }
}
