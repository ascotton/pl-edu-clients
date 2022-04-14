export abstract class PLClientAbsences {
    readonly apiKey: string;
    abstract filtersParams(): string[];
    abstract formattedString(value: number): string;
    abstract matchesQueryParams(params: any): boolean;
    abstract priority(value: number): number;
    abstract priorityFromQueryParams(params: any): number | null;
    abstract queryParams(priority: number): any;
    abstract reportFileTitle(priority: number): string;
}
