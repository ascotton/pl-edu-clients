import { OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

export abstract class PLDestroyComponent implements OnDestroy {
    protected destroyed$ = new Subject<boolean>();

    ngOnDestroy() {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }
}
