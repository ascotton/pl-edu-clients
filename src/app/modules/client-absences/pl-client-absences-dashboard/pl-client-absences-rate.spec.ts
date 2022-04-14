import { PLClientAbsencesRate } from './pl-client-absences-rate';

describe('PLClientAbsencesRate', () => {
    let definition: PLClientAbsencesRate;

    beforeEach(() => {
        definition = new PLClientAbsencesRate();
    });

    describe('formattedString', () => {
        it('is a truncated percentage of the absences ratio', () => {
            expect(definition.formattedString(.039)).toEqual('3%');
        });

        it('is 100% when ratio is 1', () => {
            expect(definition.formattedString(1.0)).toEqual('100%');
        });

        it('is 0% when absences ratio is 0 integer', () => {
            expect(definition.formattedString(0)).toEqual('0%');
        });

        it('is 0% when absences ratio is near 0', () => {
            expect(definition.formattedString(0.003)).toEqual('0%');
        });
    });

    describe('matchesQueryParams', () => {
        it('is false if does not contain absencesType param', () => {
            expect(definition.matchesQueryParams({ a: 1, b: 2, c: 3 })).toBeFalsy();
        });

        it('is false if contains absencesType param with non-matching value', () => {
            expect(definition.matchesQueryParams({ a: 1, b: 2, absencesType: 'does-not-match' })).toBeFalsy();
        });

        it('is true if matches absencesType param', () => {
            expect(definition.matchesQueryParams({ a: 1, absencesType: 'rate', c: 3 })).toBeTruthy();
        });
    });

    describe('priorityFromQueryParams', () => {
        it('is null when params is empty', () => {
            expect(definition.priorityFromQueryParams({})).toBe(null);
        });

        it('is null when params does not include any rate params', () => {
            const params = { a: 1, b: 2, c: 3 };

            expect(definition.priorityFromQueryParams(params)).toBe(null);
        });

        it('is 1 when params include queryParams(1) with values as strings', () => {
            const params = Object.assign(definition.queryParams(1), { a: 1 });

            const paramsWithStrings = Object.keys(params).reduce((obj: any, param: string) => {
                    obj[param] = params[param].toString();
                    return obj;
                }, {});

            expect(definition.priorityFromQueryParams(paramsWithStrings)).toBe(1);
        });

        it('is 1 when params include queryParams(1)', () => {
            const params = Object.assign(definition.queryParams(1), { a: 1 });

            expect(definition.priorityFromQueryParams(params)).toBe(1);
        });

        it('is 2 when params include queryParams(2)', () => {
            const params = Object.assign(definition.queryParams(2), { a: 1 });

            expect(definition.priorityFromQueryParams(params)).toBe(2);
        });

        it('is 3 when params include queryParams(3)', () => {
            const params = Object.assign(definition.queryParams(3), { a: 1 });

            expect(definition.priorityFromQueryParams(params)).toBe(3);
        });

        it('is null when consecutive params have arbitrary values', () => {
            const params = { sixtyDayAbsenceRatio_Lt: .42, sixtyDayAbsenceRatio_Gte: .20 };

            expect(definition.priorityFromQueryParams(params)).toBe(null);
        });
    });

    describe('priority', () => {
        it('is 1 if way out of bounds', () => {
            expect(definition.priority(101)).toEqual(1);
        });

        it('is 1 if larger than .50', () => {
            expect(definition.priority(.75)).toEqual(1);
        });

        it('is 2 if .50', () => {
            expect(definition.priority(.50)).toEqual(2);
        });

        it('is 2 if less than .50', () => {
            expect(definition.priority(.4999)).toEqual(2);
        });

        it('is 2 if .25', () => {
            expect(definition.priority(0.25)).toEqual(2);
        });

        it('is 3 if less than .25', () => {
            expect(definition.priority(0.2499)).toEqual(3);
        });

        it('is 3 if 0', () => {
            expect(definition.priority(0.0)).toEqual(3);
        });

        it('is 3 if negative',  () => {
            expect(definition.priority(-1.0)).toEqual(3);
        });
    });

    describe('queryParams', () => {
        it('can be called with null or no parameter to indicate no priority', () => {
            expect(definition.queryParams()).toEqual(definition.queryParams(null));
        });

        describe('when there is no priority', () => {
            it('includes definition param and lower bound to prevent null ratio values', () => {
                expect(definition.queryParams()).toEqual({
                    absencesType: 'rate',
                    sixtyDayAbsenceRatio_Gte: -1,
                });
            });
        });

        describe('when priority is 1', () => {
            it('includes param for >= 50%', () => {
                const params = {
                    absencesType: 'rate',
                    sixtyDayAbsenceRatio_Gt: 0.5,
                };

                expect(definition.queryParams(1)).toEqual(params);
            });
        });

        describe('when priority is 2', () => {
            it('includes param for < 50%, >= 25%', () => {
                const params = {
                    absencesType: 'rate',
                    sixtyDayAbsenceRatio_Lte: 0.5,
                    sixtyDayAbsenceRatio_Gte: 0.25,
                };

                expect(definition.queryParams(2)).toEqual(params);
            });
        });

        describe('when priority is 3', () => {
            it('includes param for < 25%', () => {
                const params = {
                    absencesType: 'rate',
                    sixtyDayAbsenceRatio_Lt: 0.25,
                };

                expect(definition.queryParams(3)).toEqual(params);
            });
        });
    });

    describe('reportFileTitle', () => {
        it('should be a string', () => {
            expect(typeof definition.reportFileTitle(1)).toBe('string');
        });
    });
});
