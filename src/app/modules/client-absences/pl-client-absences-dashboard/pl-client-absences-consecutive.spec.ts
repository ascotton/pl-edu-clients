import { PLClientAbsencesConsecutive } from './pl-client-absences-consecutive';

describe('PLClientAbsencesConsecutive', () => {
    let definition: PLClientAbsencesConsecutive;

    beforeEach(() => {
        definition = new PLClientAbsencesConsecutive();
    });

    describe('formattedString', () => {
        it('is a string representation of absences parameter', () => {
            expect(definition.formattedString(3)).toEqual('3');
        });
    });

    describe('priorityFromQueryParams', () => {
        it('is null when params is empty', () => {
            expect(definition.priorityFromQueryParams({})).toBe(null);
        });

        it('is null when params does not include any consecutive params', () => {
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
            const params = { consecutiveAbsenceStreak_Gt: 42, consecutiveAbsenceStreak_Lt: 20 };

            expect(definition.priorityFromQueryParams(params)).toBe(null);
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
            expect(definition.matchesQueryParams({ a: 1, absencesType: 'consecutive', c: 3 })).toBeTruthy();
        });
    });

    describe('priority', () => {
        it('is 1 if way out of bounds', () => {
            expect(definition.priority(100000)).toEqual(1);
        });

        it('is 1 if 3', () => {
            expect(definition.priority(3)).toEqual(1);
        });

        it('is 2 if 2', () => {
            expect(definition.priority(2)).toEqual(2);
        });

        it('is 3 if 1', () => {
            expect(definition.priority(1)).toEqual(3);
        });

        it('is 3 if 0', () => {
            expect(definition.priority(0)).toEqual(3);
        });

        it('is 3 if negative',  () => {
            expect(definition.priority(-20)).toEqual(3);
        });
    });

    describe('queryParams', () => {
        it('can be called with null or no parameter to indicate no priority', () => {
            expect(definition.queryParams()).toEqual(definition.queryParams(null));
        });

        describe('when there is no priority', () => {
            it('includes definition param and lower bound to prevent null streak values', () => {
                expect(definition.queryParams()).toEqual({
                    absencesType: 'consecutive',
                    consecutiveAbsenceStreak_Gt: -1,
                });
            });
        });

        describe('when priority is 1', () => {
            it('includes param for streak greater than 2', () => {
                const params = { absencesType: 'consecutive', consecutiveAbsenceStreak_Gt: 2 };

                expect(definition.queryParams(1)).toEqual(params);
            });
        });

        describe('when priority is 2', () => {
            it('includes param for streak less than 3 and greater than 1', () => {
                const params = {
                    absencesType: 'consecutive',
                    consecutiveAbsenceStreak_Gt: 1,
                    consecutiveAbsenceStreak_Lt: 3,
                };

                expect(definition.queryParams(2)).toEqual(params);
            });
        });

        describe('when priority is 3', () => {
            it('includes param for streak less than 2', () => {
                const params = {
                    absencesType: 'consecutive',
                    consecutiveAbsenceStreak_Lt: 2,
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
