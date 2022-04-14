import { Component } from '@angular/core';
// NgRx Store
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import {
    selectLicensesBought,
    selectLicensesLoading,
} from '../../store';
// RxJs
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// Models
import { PLLicenseType } from '../../models';

@Component({
    selector: 'pl-platform-licenses',
    templateUrl: './platform-licenses.component.html',
    styleUrls: ['./platform-licenses.component.less'],
})
export class PLPlatformLicensesComponent {
    data$: Observable<{
        list: PLLicenseType[],
        totals: {
            total: number,
            assigned: number,
        },
    }> = this.store$.select(selectLicensesBought).pipe(
        map(list => ({
            list,
            totals: list.reduce((acc, license) =>
                ({
                    total: acc.total + license.total_quantity,
                    assigned: acc.assigned + license.quantity_used,
                }), { total: 0, assigned: 0 }),
        })),
    );
    loadingLicenses$: Observable<boolean> = this.store$.select(selectLicensesLoading);
    exceededWarning = 'You have exceeded the total number of available licenses. Please contact your Customer Success Contact for help with fixing this.';

    constructor(private store$: Store<AppStore>) { }
}
