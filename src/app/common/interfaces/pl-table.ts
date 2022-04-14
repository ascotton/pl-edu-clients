export interface PLTableFilters { 
    value: string, 
    label: string, 
    defaultVisible: boolean,
    type?: string,
    text?: string,
    textArray?: any[],
    selectOpts?: any[],
    selectOptsMulti?: any[],
    displayOptsInCurrentLabel?: any,
}