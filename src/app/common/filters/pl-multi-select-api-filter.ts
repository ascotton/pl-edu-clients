import { PLTableFilter } from '@root/index';

export interface PLMultiSelectApiFilter extends PLTableFilter {
    setOptionsSearchTerm(searchTerm: string): void;
    updateOptions(): void;
    updateModelOptions(modelValues: string[]): void;
}
