import { of } from 'rxjs';
import * as moment from 'moment';
import {
    anything,
    instance,
    mock,
    when,
} from 'ts-mockito';

import { PLGraphQLService } from '@root/index';

import { PLCamAccountDetailsService } from './pl-cam-account-details.service';

describe('PLCamAccountDetailsService', () => {
    let graphql: PLGraphQLService;
    let service: PLCamAccountDetailsService;

    describe('getDetails', () => {
        const params = { schoolYearCode: 'whatever' };

        const queryResults = {
            statsLocationReferrals: {
                serviceStatusCounts: [
                    {
                        name: 'BMH',
                        statusCounts: [
                            { name: 'Onboarding', count: 10 },
                            { name: 'In Service', count: 20 },
                            { name: 'Not In Service', count: 30 },
                        ],
                        hours: [
                            { name: 'Assigned Hours', count: 40 },
                            { name: 'Contracted Hours', count: 50 },
                        ],
                    },
                ],
                stats: [
                    {
                        location: {
                            id: 'a-location-id',
                            locationType: 'VIRTUAL',
                            name: 'A Location',
                            organizationName: 'An Org',
                            organization: { id: 'an-org-id' },
                            state: 'CA',
                        },
                        statsCounts: [
                            { name: 'converted', count: 5 },
                            { name: 'declined', count: 10 },
                            { name: 'deleted', count: 15 },
                            { name: 'isMissingInformation', count: 5 },
                            { name: 'matched', count: 20 },
                            { name: 'proposed', count: 17 },
                            { name: 'scheduled', count: 5 },
                            { name: 'unmatchedOpenToProviders', count: 25 },
                            { name: 'unmatchedPlReview', count: 30 },
                            { name: 'unmatchedTotal', count: 55 },
                        ],
                    },
                ],
            },
        };

        beforeEach(() => {
            graphql = mock(PLGraphQLService);

            service = new PLCamAccountDetailsService(instance(graphql));

            when(graphql.query(anything(), anything())).thenReturn(of(queryResults));
        });

        it('should map service status name', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.serviceStatuses[0].serviceName).toEqual('BMH');

                done();
            });
        });

        it('should map assignedProviderHours', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.serviceStatuses[0].assignedProviderHours).toEqual(40);

                done();
            });
        });

        it('should map contractedReferralHours', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.serviceStatuses[0].contractedReferralHours).toEqual(50);

                done();
            });
        });

        it('should map onboardingCount', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.serviceStatuses[0].onboardingCount).toEqual(10);

                done();
            });
        });

        it('should map inServiceCount', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.serviceStatuses[0].inServiceCount).toEqual(20);

                done();
            });
        });

        it('should map notInServiceCount', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.serviceStatuses[0].notInServiceCount).toEqual(30);

                done();
            });
        });

        it('should map location', (done) => {
            service.getDetails(params).subscribe((results) => {
                const location = {
                    id: 'a-location-id',
                    name: 'A Location',
                    isVirtual: true,
                    organizationId: 'an-org-id',
                    organizationName: 'An Org',
                    state: 'CA',
                };

                expect(results.locationReferralStats[0].location).toEqual(location);

                done();
            });
        });

        it('should map referrals convertedCount', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.locationReferralStats[0].convertedCount).toEqual(5);

                done();
            });
        });

        it('should map referrals matchedCount', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.locationReferralStats[0].matchedCount).toEqual(20);

                done();
            });
        });

        it('should map referrals missingInfoPercentage', () => {
            service.getDetails(params).subscribe((results) => {
                const expected = 5 / results.locationReferralStats[0].totalCount;
                expect(results.locationReferralStats[0].missingInfoPercentage).toBeCloseTo(expected, 2);
            });
        });

        it('should map openCount', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.locationReferralStats[0].openCount).toEqual(25);

                done();
            });
        });

        it('should map referral proposedCount', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.locationReferralStats[0].proposedCount).toEqual(17);

                done();
            });
        });

        it('should map scheduledCount', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.locationReferralStats[0].scheduledCount).toEqual(5);

                done();
            });
        });

        it('should map unmatchedCount', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.locationReferralStats[0].unmatchedCount).toEqual(30);

                done();
            });
        });

        it('should calculate total', (done) => {
            service.getDetails(params).subscribe((results) => {
                expect(results.locationReferralStats[0].totalCount).toEqual(30 + 25 + 17 + 20 + 5);

                done();
            });
        });

        it('should calculcate scheduledPercentage', (done) => {
            service.getDetails(params).subscribe((results) => {
                const total = results.locationReferralStats[0].totalCount;
                const scheduled =  results.locationReferralStats[0].scheduledCount;
                expect(results.locationReferralStats[0].scheduledPercentage).toEqual(scheduled / total);

                done();
            });
        });
    });
});
