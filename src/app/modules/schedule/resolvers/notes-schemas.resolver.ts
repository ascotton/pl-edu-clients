import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
// NgRx Store
import { Store } from '@ngrx/store';
import { selectNotesScheme, PLFetchNotesSchemes } from '@common/store/billing';
// RxJs
import { filter, first } from 'rxjs/operators';

@Injectable()
export class NotesSchemasResolver implements Resolve<any[]> {
    constructor(private store$: Store<any>) { }
    resolve() {
        return this.store$.select(selectNotesScheme).pipe(
            filter((notes) => {
                if (notes.length === 0) {
                    this.store$.dispatch(PLFetchNotesSchemes());
                }
                return notes.length > 0;
            }),
            first(),
        );
    }
}
