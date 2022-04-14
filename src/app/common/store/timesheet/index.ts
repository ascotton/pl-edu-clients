import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { StoreModule } from '@ngrx/store';
import { TimesheetEfects } from './timesheet.effect';
import { timesheetStoreSelectorKey, reducer } from './timesheet.store';

import { PLTimesheetService } from '@root/src/app/modules/billing/pl-timesheet.service';

@NgModule({
    imports: [
        StoreModule.forFeature(timesheetStoreSelectorKey, reducer),
        EffectsModule.forFeature([TimesheetEfects]),
    ],
    providers: [
        PLTimesheetService,
    ],
})
export class PLTimesheetStoreModule { }

export {
    selectTimesheetPreview,
    PLFetchTimesheetPreview,
    PLSetTimesheetPreview,
} from './timesheet.store';
