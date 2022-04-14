import { Observable } from 'rxjs';
import { first, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { PLHttpService } from '@root/index';

@Injectable()
export class PLTimesheetService {

    constructor(private plHttp: PLHttpService) { }

    get(params?: any) {
        return this.plHttp.get('timesheet', params).pipe(first());
    }

    save(): Observable<any> {
        return this.plHttp.save('timesheet', {}).pipe(first());
    }

    // TODO: any will be replaced by something like PLInvoice but will be PLTimesheet
    getPreview(): Observable<any> {
        return this.plHttp.get('timesheetPreview').pipe(first());
    }

    getAmendments(params: { page: number, limit: number, ordering: string }): Observable<any> {
        return this.plHttp
            .get('timesheetAmendments', params)
            .pipe(
                tap((amendments: {results: string[]}) => {
                    amendments.results.forEach((result: any) => result.uuid = result.uuid.slice(0, 8));
                }),
                first(),
            );
    }

    retract(id: string) {
        const httpOpts = {
            url: `${this.plHttp.formUrl('timesheet')}${id}/retract/`,
            data: {},
            method: 'PUT',
        };
        return this.plHttp.go(httpOpts).pipe(first());
    }
}
