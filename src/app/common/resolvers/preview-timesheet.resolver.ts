import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { Resolve } from '@angular/router';
import { Injectable } from '@angular/core';
import { PLFetchTimesheetPreview, selectTimesheetPreviewLoaded } from '../store/timesheet/timesheet.store';
import { filter, tap, first } from 'rxjs/operators';

@Injectable()
export class PreviewTimesheetResolver implements Resolve<boolean> {

    constructor(
        private store$: Store<any>,
    ) { }

    resolve(): Observable<boolean> {
        return this.store$.select(selectTimesheetPreviewLoaded).pipe(
            tap((loaded) => {
                if (!loaded) {
                    this.store$.dispatch(PLFetchTimesheetPreview());
                }
            }),
            filter(loaded => loaded),
            first(),
        );
    }

}
