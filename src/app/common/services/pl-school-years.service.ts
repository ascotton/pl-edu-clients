import { Injectable } from '@angular/core';
import { PLGraphQLService, PLLodashService, PLTableFrameworkUrlService } from '@root/index';
import { Observable, from, forkJoin } from 'rxjs';
import { filter, first, map, flatMap } from 'rxjs/operators';
import { Option } from '@common/interfaces';

import * as moment from 'moment';

interface FetchYearsResults {
    totalCount: number;
    years: {};
}

@Injectable()
export class PLSchoolYearsService {

    private yearsObservers: any[] = [];

    private yearsIndex: any = {};
    private yearsOpts: Option[] = [];
    private yearsLoaded = false;

    constructor(
        private lodash: PLLodashService,
        private plGraphQL: PLGraphQLService,
        private plTableFrameworkUrl: PLTableFrameworkUrlService,
    ) {
        this.beginFetch();
    }

    getYearsData() {
        return new Observable((observer: any) => {
            if (this.yearsLoaded) {
                observer.next(this);
            } else {
                this.yearsObservers.push(observer);
            }
        });
    }

    private beginFetch() {
        const resultsSeed: FetchYearsResults = {
            totalCount: 0,
            years: {},
        };
        this.fetchYears(
            resultsSeed,
            (results: FetchYearsResults) => {
                const yearOptions: any[] = [];
                for (const yearCode in results.years) {
                    const year = results.years[yearCode];
                    year.option = { value: year.code, label: year.name, id: year.id };
                    yearOptions.push(year.option);
                }
                this.labelSort(yearOptions);
                this.yearsOpts = yearOptions;
                this.yearsIndex = results.years;

                this.yearsLoaded = true;
                this.yearsObservers.forEach((observer) => {
                    observer.next(this);
                });
            },
            '',
        );
    }

    getYearCount() {
        return this.yearsOpts.length;
    }

    getYearOptions() {
        this.labelSort(this.yearsOpts);
        return this.yearsOpts.slice(0);
    }

    getYearForCode(code: string) {
        return this.yearsIndex[code];
    }

    /*
        getYearForCodeAsync - wrap call to getYearForCode so it
        can be called by a consumer without the consumer needing
        to know about loading status logic.
    */
    getYearForCodeAsync(code: string): Observable<any> {
        return this.getYearsData().pipe(
            filter((service: PLSchoolYearsService) => service.yearsLoaded),
            map((service: PLSchoolYearsService) => service.getYearForCode(code)),
            first(),
        );
    }

    getYearForUUID(uuid: string) {
        for (const yearCode in this.yearsIndex) {
            const year = this.yearsIndex[yearCode];
            if (year.id === uuid) {
                return year;
            }
        }
        return null;
    }

    isYearInThePast(yearCode: string) {
        const year = this.getYearForCode(yearCode);
        const endDate = moment(year.endDate);
        const today = moment();
        return endDate.isBefore(today);
    }

    isYearInTheFuture(yearCode: string) {
        const year = this.getYearForCode(yearCode);
        const startDate = moment(year.startDate);
        const today = moment();
        return startDate.isAfter(today);
    }

    private labelSort(arrayToSort: Option[]) {
        this.lodash.sort2d(arrayToSort, 'label');
    }

    getCurrentSchoolYear() {
        return this.getYearsData().pipe(
            first(),
            map((res: any) => {
                let year: any = null;
                Object.keys(res.yearsIndex).forEach((k: any) => {
                    if (res.yearsIndex[k].isCurrent) year = res.yearsIndex[k];
                });
                return year;
            }),
        );
    }

    getCurrentSchoolYearCode() {
        return this.getCurrentSchoolYear().pipe(
            first(),
            map((year: any) => year.code),
        );
    }

    getSchoolYear(tableStateName: string) {
        return this.plTableFrameworkUrl.getStateFromUrl(tableStateName).pipe(
            flatMap((res: any) => {
                const querySchoolYear = res.query.schoolYearCode_In;
                if (querySchoolYear) {
                    return from(querySchoolYear);
                }
                return this.getCurrentSchoolYearCode();
            }),
            first(),
        );
    }

    private fetchYears(
        results: FetchYearsResults,
        callback: (results: FetchYearsResults) => any,
        cursor: string,
    ) {
        this.plGraphQL
            .query(GQL_QUERY_ALL_SCHOOL_YEARS, { first: 100, after: cursor })
            .pipe(first())
            .subscribe((res: any) => {
                const years: any[] = res.schoolYears;

                if (!results.totalCount) results.totalCount = 0;
                results.totalCount += res.schoolYears_totalCount;

                for (const year of years) {
                    results.years[year.code] = {
                        name: year.name,
                        code: year.code,
                        startYear: year.startYear,
                        startDate: year.startDate,
                        endDate: year.endDate,
                        yearType: year.yearType,
                        id: year.id,
                        isCurrent: year.isCurrent,
                    };
                }
                if (res.schoolYears_pageInfo.hasNextPage && res.schoolYears_pageInfo.endCursor) {
                    this.fetchYears(results, callback, res.schoolYears_pageInfo.endCursor);
                } else {
                    callback(results);
                }
            });
    }

    public getSchoolYearsInfo() {
        const currentYear$ = this.getCurrentSchoolYear();
        const schoolYears$ = this.plGraphQL.query(GQL_QUERY_ALL_SCHOOL_YEARS, { first: 100 }).pipe(first());
        return forkJoin([
            currentYear$,
            schoolYears$,
        ]).pipe(
            map((res: any) => ({
                currentSchoolYear: res[0],
                schoolYears: res[1].schoolYears,
            })),
            first(),
        );
    }
}

const GQL_QUERY_ALL_SCHOOL_YEARS = `
query loadAllSchoolYears($first: Int!, $after: String) {
    schoolYears(first: $first, after: $after) {
        totalCount
        pageInfo {
            endCursor
            hasNextPage
            __typename
        }
        edges {
            node {
                id
                name
                code
                startYear
                yearType
                startDate
                endDate
                isCurrent
            }
        }
    }
}
`;
