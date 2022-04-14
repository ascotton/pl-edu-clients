import { Injectable } from '@angular/core';
import { Observable, zip } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { PLGraphQLService } from '@root/index';
import { PLClientAbsences } from './pl-client-absences';

const summaryDataQuery = require('./queries/summary-data.graphql');

@Injectable()
export class PLClientAbsencesService {
    constructor(private plGraphQL: PLGraphQLService) {}

    /*
        Returns an observable combining summary data for each absence priority. The subscription
        completes after it emits the first set of results.
    */
    formSummaryData(absencesType: PLClientAbsences, varsOriginal: any): Observable<any> {
        // Currently need to do 3 backend calls, one for each absence range.
        // Do the SAME exact call (hence passing in the variables)
        // BUT change the absence filter for each one.

        // For performance, strip out things like ordering and offset.
        const sanitizedVars = Object.assign({}, varsOriginal, { first: 1, status_NotIn: 'completed,cancelled' });
        delete sanitizedVars.orderBy;
        delete sanitizedVars.offset;

        const summaries = [1, 2, 3].map((priority: number): Observable<any> => {
            const vars = Object.assign({}, sanitizedVars, absencesType.queryParams(priority));

            // Skip the cache to avoid inconsistencies between summary number and downloaded
            // absences report. cache-and-network would deviate from current expectations
            // of consumers of this call.
            return this.plGraphQL.query(summaryDataQuery, vars, { fetchPolicy: 'network-only' }).pipe(
                map((r: any) => ({ [`priority${priority}`]: r.clientServices.totalCount })),
            );
        });

        const merge = (...results: any[]) => Object.assign({}, ...results);

        return zip(...summaries, merge).pipe(first());
    }
}
