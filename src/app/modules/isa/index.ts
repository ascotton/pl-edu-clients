export enum ISAFeatureStates {
    available = 'Available',
    unavailable = 'Unavailable',
    notChecked = 'Hasn\'t been checked',
}

export enum ISADashboardButtons {
    sign = 'Sign',
    download = 'Download',
    remove = 'Remove',
    signOrRemove = 'Sign or Remove',
}

export enum ISATableMode {
    readOnlyISA = 'Read Only Signed ISA',
    manageISA = 'Manage ISA Pending to be Signed or to be Removed',
    removeISA = 'Remove ISA',
    error = 'An Error Ocurred wile Loading the ISAs',
}

export enum ISAModalMode {
    sign = 'Signing ISA Mode',
    remove = 'Remove ISA Mode',
}

export interface ISAInfo {
    count: number,
    next: string,
    previous: string,
    results: any[]
}