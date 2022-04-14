import { of } from 'rxjs';
import * as moment from 'moment';
import {
    anything,
    instance,
    mock,
    when,
} from 'ts-mockito';

import { PLGraphQLService } from '@root/index';

import { PLCamAccountsService } from './pl-cam-accounts.service';

describe('PLCamAccountsService', () => {
    let service: PLCamAccountsService;
    let graphql: PLGraphQLService;

    const queryResults = {
        accountHealth: {
            summaries: [
                {
                    organization: { id: '1', name: 'my org' },
                    statsCounts: [
                        { name: 'hoursFulfillmentPercentage', count: 50 },
                        { name: 'matchedReferrals', count: 75 },
                        { name: 'referrals', count: 100 },
                    ],
                    projectedTherapyStartDate: '2020-04-03',
                },
            ],
        },
    };

    describe('getHealthSummaries', () => {
        const params = { schoolYearCode: 'whatever' };

        beforeEach(() => {
            graphql = mock(PLGraphQLService);
            service = new PLCamAccountsService(instance(graphql));

            when(graphql.query(anything(), anything())).thenReturn(of(queryResults));
        });

        it('should include orgId', (done) => {
            service.getHealthSummaries(params).subscribe((results) => {
                expect(results.summaries[0].orgId).toEqual('1');

                done();
            });
        });

        it('should include orgName', (done) => {
            service.getHealthSummaries(params).subscribe((results) => {
                expect(results.summaries[0].orgName).toEqual('my org');

                done();
            });
        });

        it('should include projectedTherapyStartDate', (done) => {
            service.getHealthSummaries(params).subscribe((results) => {
                const expectedDate = moment('2020-04-03').toDate();
                expect(results.summaries[0].projectedTherapyStartDate).toEqual(expectedDate);

                done();
            });
        });

        it('should include fulfillmentPercentage', (done) => {
            service.getHealthSummaries(params).subscribe((results) => {
                expect(results.summaries[0].fulfillmentPercentage).toEqual(50);

                done();
            });
        });

        it('should include matchedReferralCount', (done) => {
            service.getHealthSummaries(params).subscribe((results) => {
                expect(results.summaries[0].matchedReferralCount).toEqual(75);

                done();
            });
        });

        it('should include referralCount', (done) => {
            service.getHealthSummaries(params).subscribe((results) => {
                expect(results.summaries[0].referralCount).toEqual(100);

                done();
            });
        });

        it('should include total (summaries count)', (done) => {
            service.getHealthSummaries(params).subscribe((results) => {
                expect(results.total).toEqual(1);

                done();
            });
        });
    });
});
