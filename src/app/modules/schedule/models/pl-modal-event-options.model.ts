import { PLEvent, PLEventRepeatMode } from './event.model';

export interface PLModalEventOptions {
    uuid?: string;
    event?: PLEvent;
    isNew?: boolean;
    start?: string;
    end?: string;
    // appointment?: boolean;
    repeat?: PLEventRepeatMode;
    isAmendable?: boolean;
}
