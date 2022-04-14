import { PLTimeFrame } from './pl-general-time';

export enum PLTimeGridBlockAction {
    click,
    dbClick,
    remove,
    hover,
    edit,
    mouseMove,
    mouseDown,
    mouseUp,
}

export enum PLDrawMode {
    None,
    Blocks,
    Box,
    Any,
}

export enum PLTimeGridColumnActions {
    selectionStarted = 'selectionStarted',
    selectionUpdated = 'selectionUpdated',
    selectionEnded = 'selectionEnded',
    added = 'blockAdded',
    dropped = 'contentDroped',
}

export interface PLTimeGridBlockSize {
    x: number;
    width: number;
}

export interface PLTimeGridBlockEvent {
    uuid: string;
    action: PLTimeGridBlockAction;
    options?: {
        X?: number;
        Y?: number;
        week?: number;
        time?: PLTimeFrame;
        size?: PLTimeGridBlockSize;
    };
}

// TBD: Not sure if this type will be needed
export interface PLTimeGridBlockConfiguration {
    className?: string;
    clickable?: boolean;
    selectable?: boolean;
    drawable?: boolean;
    priority?: number;
    viewTime?: boolean;
    size?: PLTimeGridBlockSize;
    tooltip?: string;
}

export interface PLTimeGridBlock {
    uuid: string;
    day?: string;
    title?: string;
    timeFrame: PLTimeFrame;
    configuration: PLTimeGridBlockConfiguration;
}
