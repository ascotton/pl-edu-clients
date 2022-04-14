import { of } from 'rxjs';
import * as moment from 'moment';
import {
    anything,
    instance,
    mock,
    when,
} from 'ts-mockito';

import { PLGraphQLService, PLTimezoneService } from '@root/index';

import { PLCamAccountNumbersService } from './pl-cam-account-numbers.service';

describe('PLCamAccountNumbersService', () => {
    let service: PLCamAccountNumbersService;
    let graphql: PLGraphQLService;

    describe('getAccountNumbers', () => {
        const params = {
            referralsToConvertCreatedAtLtUtc: moment(),
            schoolYearCode: 'whatever',
        };

        const queryResults = {
            statsAccountManagerOverview: {
                statsCounts: [
                    { name: 'accountsUnfulfilled', count: 10 },
                    { name: 'assignmentsPending', count: 20 },
                    { name: 'assignmentsProposed', count: 30 },
                    { name: 'locationsRequiringScheduling', count: 40 },
                    { name: 'referralsToConvert', count: 50 },
                    { name: 'referralsTotal', count: 60 },
                    { name: 'referralsUnmatched', count: 70 },
                    { name: 'servicesEvalsPastDue', count: 80 },
                    { name: 'servicesTotal', count: 90 },
                    { name: 'servicesUndocumentedBeyondStartDate', count: 100 },
                ],
            },
        };

        beforeEach(() => {
            graphql = mock(PLGraphQLService);
            service = new PLCamAccountNumbersService(instance(graphql), new PLTimezoneService());

            when(graphql.query(anything(), anything())).thenReturn(of(queryResults));
        });

        it('should include accountsUnfulfilledCount', (done) => {
            service.getAccountNumbers(params).subscribe((results) => {
                expect(results.accountsUnfulfilledCount).toEqual(10);

                done();
            });
        });

        it('should include assignmentsPendingCount', (done) => {
            service.getAccountNumbers(params).subscribe((results) => {
                expect(results.assignmentsPendingCount).toEqual(20);

                done();
            });
        });

        it('should include assignmentsProposedCount', (done) => {
            service.getAccountNumbers(params).subscribe((results) => {
                expect(results.assignmentsProposedCount).toEqual(30);

                done();
            });
        });

        it('should include locationsRequiringSchedulingCount', (done) => {
            service.getAccountNumbers(params).subscribe((results) => {
                expect(results.locationsRequiringSchedulingCount).toEqual(40);

                done();
            });
        });

        it('should include referralsToConvertCount', (done) => {
            service.getAccountNumbers(params).subscribe((results) => {
                expect(results.referralsToConvertCount).toEqual(50);

                done();
            });
        });

        it('should include referralsTotalCount', (done) => {
            service.getAccountNumbers(params).subscribe((results) => {
                expect(results.referralsTotalCount).toEqual(60);

                done();
            });
        });

        it('should include referralsUnmatchedCount', (done) => {
            service.getAccountNumbers(params).subscribe((results) => {
                expect(results.referralsUnmatchedCount).toEqual(70);

                done();
            });
        });

        it('should include servicesEvalsPastDue', (done) => {
            service.getAccountNumbers(params).subscribe((results) => {
                expect(results.servicesEvalsPastDue).toEqual(80);

                done();
            });
        });

        it('should include servicesTotalCount', (done) => {
            service.getAccountNumbers(params).subscribe((results) => {
                expect(results.servicesTotalCount).toEqual(90);

                done();
            });
        });

        it('should include servicesUndocumentedBeyondStartDate', (done) => {
            service.getAccountNumbers(params).subscribe((results) => {
                expect(results.servicesUndocumentedBeyondStartDate).toEqual(100);

                done();
            });
        });
    });
});
