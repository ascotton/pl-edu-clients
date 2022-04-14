import { PLClientReferralDataModelService } from './pl-client-referral-data-model.service';

describe('PLClientReferralDataModelService', () => {
    let service: PLClientReferralDataModelService;

    beforeEach(() => {
        service = new PLClientReferralDataModelService();
    });

    describe('validateClientReferralData', () => {
        it('does not clip notes shorter than 2000 characters', () => {
            const dataIn = { notes: 'hello' };

            const { data } = service.validateClientReferralData(dataIn, false, {});

            expect(data.notes).toEqual('hello');
        });

        it('clips notes to 2000 characters', () => {
            // String of length 4048
            const dataIn = { notes: Array(4049).join('*') };

            const { data } = service.validateClientReferralData(dataIn, false, {});

            expect(data.notes.length).toBe(2000);
        });
    });
});
