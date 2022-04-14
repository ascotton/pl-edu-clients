import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { PLEvent } from '../../models';

export const eventAdapter: EntityAdapter<PLEvent> = createEntityAdapter<PLEvent>({
    selectId: (item) => {
        const { event, original_start } = item;
        let { uuid } = item;
        if (!uuid) {
            uuid = `evt__${event.uuid}${event.repeating ? `__${original_start}` : ''}`;
        }
        return uuid;
    },
});
