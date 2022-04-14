import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
// NgRx Store
import { Store } from '@ngrx/store';
import { selectEvaluations, PLLoadEvaluations } from '../store/schedule';
// RxJs
import { filter, first, concatMap } from 'rxjs/operators';
// Models
import { PLEvaluation } from '../models';

@Injectable()
export class EvaluationsResolver implements Resolve<PLEvaluation[]> {

    constructor(private store$: Store<any>) { }

    resolve(route: ActivatedRouteSnapshot) {
        const { provider: assignedTo } = route.queryParams;
        return this.store$.select('currentUser').pipe(
            filter(user => !!user),
            concatMap(() => this.store$.select(selectEvaluations)),
            filter((evaluations) => {
                if (evaluations.length === 0) {
                    this.store$.dispatch(PLLoadEvaluations({ payload: {
                        assignedTo,
                        statusIn: 'not_started,in_process,idle',
                    } }));
                }
                return evaluations.length > 0;
            }),
            first(),
        );
    }
}
