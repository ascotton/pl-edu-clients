import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { PLGraphQLService, PLTimezoneService } from '@root/index';
import { PLReferralCyclesModalService } from './pl-referral-cycles-modal.service';

describe('PLReferralCyclesModalService', () => {
    let spectator: SpectatorService<PLReferralCyclesModalService>;

    const serviceFactory = {
        service: PLReferralCyclesModalService,
        mocks: [PLGraphQLService, PLTimezoneService],
    };
    const createService = createServiceFactory(serviceFactory);

    beforeEach(() => spectator = createService());

    it('should succeed', () => {
        expect(spectator.service).toBeTruthy();
        expect(spectator.service).toBeDefined();
    });

    describe('Decline History Scenarios', () => {
        xit('it should return an empty [] when referralId is not valid.');
        xit('it should return an empty [] when GQL returns error.');
        xit('it should return referralCreatedOn empty if there are issues with the created property.');
        xit('it should return providerFirstName empty if there are issues with the firstName property.');
        xit('it should return providerLastName empty if there are issues with the lastName property.');
    });

});
